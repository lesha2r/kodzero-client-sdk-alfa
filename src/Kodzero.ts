import FluidFetch from "fluid-fetch"
import KodzeroAuth from "./auth/index.js"
import createModel from "./model/createModel.js"
import { ModelOptions } from "./model/BaseModel.js"
import TokensManagerClass from "./auth/tokens.js"
import { ReservedKeyNames } from "./constants/reservedKeyNames.js"
import KodzeroApiError from "./errors/KodzeroApiError.js"

export interface AutoRefreshOptions {
    /**
     * Called when access token is successfully refreshed after a 401 response.
     */
    onRefresh?: () => void
    /**
     * Called when token refresh fails (e.g., refresh token is expired or invalid).
     * Use this to redirect the user to login, clear storage, etc.
     */
    onRefreshFailure?: (error: any) => void
}

interface Options {
    host: string
    authCollection?: string
    /**
     * Enable automatic access token refresh on 401 responses.
     * Requires `authCollection` to be configured.
     * 
     * - `true` — enables auto-refresh with default behavior
     * - `AutoRefreshOptions` — enables auto-refresh with lifecycle callbacks
     * 
     * When a 401 is intercepted, the SDK:
     * 1. Calls `auth.refresh()` to obtain a new access token
     * 2. **Replays the original request** with the new token
     * 3. Returns the replayed response — the caller never sees the 401
     * 
     * @example
     * ```ts
     * const kz = new Kodzero({
     *   host: 'https://api.example.com',
     *   authCollection: 'users',
     *   autoRefresh: {
     *     onRefresh: () => console.log('Token refreshed'),
     *     onRefreshFailure: (err) => router.push('/login')
     *   }
     * })
     * 
     * // Works transparently — no wrapper needed:
     * const users = await UserModel.findMany()
     * ```
     */
    autoRefresh?: boolean | AutoRefreshOptions
}

class Kodzero {
    host: string
    authCollection: string | null
    auth: KodzeroAuth | null
    tokensManager: TokensManagerClass
    api: typeof FluidFetch

    /**
     * Tracks the in-flight refresh promise to deduplicate concurrent 401
     * responses into a single refresh call.
     */
    private _refreshPromise: Promise<any> | null = null

    /**
     * Stores the original request config so the response middleware can replay
     * the request after a token refresh. Keyed by a normalized identifier
     * derived from the request (method + url) to match against the response.
     */
    private _lastRequestConfig: { method: string; url: string; headers: Record<string, string>; data: any; params: Record<string, any> } | null = null

    constructor (options: Options) {
        this.tokensManager = new TokensManagerClass('', '')
        this.authCollection = options.authCollection || null
        this.host = options.host
        this.api = new FluidFetch()

        this.auth = !this.authCollection ? null : new KodzeroAuth({
            host: options.host,
            collection: this.authCollection
        }, this.api, this.tokensManager)

        // Attach access token to all outgoing requests & capture request config
        this.api.middlewares.request.use((req: any) => {
            const accessToken = this.tokensManager.access
            if (accessToken) req.headers['Authorization'] = `Bearer ${accessToken}`

            // Store request config for potential replay after 401 token refresh
            // fluid-fetch uses `data` (object) for the body and stringifies at send time
            this._lastRequestConfig = {
                method: req.method || 'GET',
                url: req.url,
                headers: { ...req.headers },
                data: req.data ?? null,
                params: req.params ? { ...req.params } : {},
            }

            return req
        })

        // Set up auto-refresh response middleware if enabled
        if (options.autoRefresh && this.auth) {
            const refreshOpts = typeof options.autoRefresh === 'object'
                ? options.autoRefresh
                : {}
            this._setupAutoRefresh(refreshOpts)
        }
    }

    /**
     * Registers a response middleware that intercepts 401 responses,
     * refreshes the access token, and **replays the original request**
     * with the new token — returning the replayed response to the caller.
     *
     * - Captures request config in the request middleware for replay
     * - Uses native `fetch()` for the replay to bypass the middleware pipeline
     *   (prevents infinite loops and double-processing)
     * - Deduplicates concurrent 401s — only one refresh request at a time
     * - Invokes user-provided lifecycle callbacks on success/failure
     */
    private _setupAutoRefresh(options: AutoRefreshOptions) {
        this.api.middlewares.response.use(async (response: any) => {
            if (response.status !== 401) return response

            // No refresh token available — nothing we can do
            if (!this.tokensManager.hasRefresh()) return response

            // Prevent infinite loop: never refresh on the refresh endpoint itself
            const url = typeof response.url === 'string' ? response.url : ''
            if (url.includes('/refresh')) return response

            // Grab the captured request config before it's overwritten by the refresh call
            const requestConfig = this._lastRequestConfig

            // --- Refresh the access token (deduplicated) ---
            try {
                if (!this._refreshPromise) {
                    this._refreshPromise = Promise.resolve(this.auth!.refresh())
                }
                await this._refreshPromise
                options.onRefresh?.()
            } catch (error) {
                options.onRefreshFailure?.(error)
                return response // refresh failed — return original 401
            } finally {
                this._refreshPromise = null
            }

            // --- Replay the original request with the new token ---
            if (requestConfig) {
                const replayHeaders = {
                    ...requestConfig.headers,
                    'Authorization': `Bearer ${this.tokensManager.access}`,
                }

                // Reconstruct URL with query params (same logic as fluid-fetch._buildUrl)
                let replayUrl = requestConfig.url
                if (requestConfig.params && Object.keys(requestConfig.params).length > 0) {
                    const query = Object.entries(requestConfig.params)
                        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
                        .join('&')
                    replayUrl = `${replayUrl}?${query}`
                }

                // Build fetch options
                const fetchOptions: RequestInit = {
                    method: requestConfig.method,
                    headers: replayHeaders,
                }

                // Only attach body for methods that support it
                // fluid-fetch stores the body as `data` (raw object) and stringifies at send time
                const method = requestConfig.method.toUpperCase()
                if (method !== 'GET' && method !== 'HEAD' && requestConfig.data != null) {
                    fetchOptions.body = typeof requestConfig.data === 'string'
                        ? requestConfig.data
                        : JSON.stringify(requestConfig.data)
                }

                try {
                    return await fetch(replayUrl, fetchOptions)
                } catch {
                    // Replay failed (e.g. network error) — return original 401
                    return response
                }
            }

            return response
        })
    }

    /**
     * Wraps an async operation with automatic retry on 401.
     *
     * Useful when `autoRefresh` is **not** enabled, or as an explicit retry
     * mechanism. Refreshes the token and retries the operation exactly once.
     *
     * @example
     * ```ts
     * const users = await kz.withRetry(() => UserModel.findMany())
     * ```
     */
    withRetry = async <T>(fn: () => Promise<T>): Promise<T> => {
        try {
            return await fn()
        } catch (error) {
            if (
                error instanceof KodzeroApiError &&
                error.statusCode === 401 &&
                this.auth &&
                this.tokensManager.hasRefresh()
            ) {
                if (this._refreshPromise) {
                    try { await this._refreshPromise } catch { /* handled by middleware */ }
                } else {
                    await this.auth.refresh()
                }
                return await fn()
            }
            throw error
        }
    }

    createModel = <T extends { [ReservedKeyNames.ID]: string | null }, M = {}>(options: Omit<ModelOptions, 'host'>) => {
        return createModel<T, M>({...options, host: this.host}, this.api)
    }
}

export default Kodzero