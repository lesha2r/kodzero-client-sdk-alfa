import FluidFetch from "fluid-fetch"
import { AuthOptions } from "./index.js"
import buildURL from "../utils/buildURL.js"
import KodzeroAuthBase from "./base.js"
import TokensManagerClass from "./tokens.js"

interface KodzeroAuthEmailLogin {
    email: string
    password: string
}

interface SuccessResponse<Result> {
    ok: true
    result: Result
}

interface Tokens {
    access: string
    refresh: string
}

interface AuthUser {
    _id: string
    email: string
    name: string
    workspace: string
    createdAt: string
    updatedAt: string
    [key: string]: any
}

type RegisterResponse = SuccessResponse<{
    user: AuthUser
    tokens: Tokens
    session: number
}>

type LoginResponse = SuccessResponse<{
    user: AuthUser
    tokens: Tokens
    session: number
}>

type VerifyResponse = SuccessResponse<{}>
type RefreshResponse = SuccessResponse<{tokens: Tokens}>
type LogoutResponse = SuccessResponse<boolean>

class KodzeroAuthEmail extends KodzeroAuthBase {
    tokensManager: TokensManagerClass
    collection: "auth/password"

    constructor(options: AuthOptions, api: typeof FluidFetch, tokensManager: TokensManagerClass) {
        super(options, api, tokensManager)

        this.tokensManager = tokensManager
        this.collection = "auth/password"
    }

    /**
     * Private.
     * Setter for tokens in TokensManager
     */
    _setTokens = (access: string, refresh?: string) => {
        this.tokensManager.setAccess(access)
        if (refresh) this.tokensManager.setRefresh(refresh)
    }

    /**
     * Login with email and password. On success, sets tokens in TokensManager automatically
     */
    login = async (input: KodzeroAuthEmailLogin): Promise<LoginResponse['result']> => {
        const url = buildURL(this.host, this.collection + '/login')

        const response = await this.api.post(url, input)
            .headers({ 'Content-Type': 'application/json' });

        await this._handleApiError(response);        
        const json: LoginResponse = await response.json();

        if (json.ok && json.result && json.result.tokens.access && json.result.tokens.refresh) {
            this._setTokens(json.result.tokens.access, json.result.tokens.refresh);
        }
    
        return json.result
    }

    /**
     *  Register with email and password. On success, sets tokens in TokensManager automatically
     */
    register = async (userData: Record<string, string>): Promise<RegisterResponse['result']> => {
        const url = buildURL(this.host, this.collection + '/register')
        const response = await this.api.post(url, userData)
            .headers({ 'Content-Type': 'application/json' });
            
        await this._handleApiError(response);        
        const json: RegisterResponse = await response.json();

        if (json.ok && json.result && json.result.tokens.access && json.result.tokens.refresh) {
            this._setTokens(json.result.tokens.access, json.result.tokens.refresh);
        }

        return json.result
    }

    /**
     * Verify current access token
     */
    verify = async (): Promise<VerifyResponse['result']> => {
        try {
            const url = buildURL(this.host, this.collection + '/verify')
            const response = await this.api.get(url)
            const json: VerifyResponse = await response.json();

            return json.ok ? true : false
        } catch (error) {
            console.warn("Token verification error:", error);
            return false
        }
    }

    /**
     * Refresh access token using refresh token
     * If success, updates access token in TokensManager automatically
     */
    refresh = async (): Promise<RefreshResponse['result'] | {tokens: null}> => {
        const url = buildURL(this.host, this.collection + '/refresh')
        const response = await this.api.post(url, { refresh: this.tokensManager.refresh })
            .headers({ 'Content-Type': 'application/json' });

        await this._handleApiError(response);        
        const json: RefreshResponse = await response.json(); 
        
        if (json.ok && json.result?.tokens && json.result.tokens.access) {
            this.tokensManager.setAccess(json.result.tokens.access)
        }

        return json.ok ? { tokens: json.result.tokens } : { tokens: null }
    }

    /**
     * Logout the user
     * If success, clears tokens in TokensManager automatically
     */
    logout = async (): Promise<boolean> => {
        const url = buildURL(this.host, this.collection + '/logout')
        const response = await this.api.post(url, {})
            .headers({ 'Content-Type': 'application/json' });

        await this._handleApiError(response);        
        const json: LogoutResponse = await response.json(); 

        if (json.ok) this.tokensManager.clear()

        return json.ok ? true : false
    }

}

export default KodzeroAuthEmail