import FluidFetch from "fluid-fetch"
import { AuthOptions } from "./index.js"
import buildURL from "../utils/buildURL.js"
import KodzeroAuthBase from "./base.js"
import TokensManagerClass from "./tokens.js"

interface KodzeroAuthEmailSignin {
    email: string
    password: string
}

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
     * Sign in with email and password. On success, sets tokens in TokensManager automatically
     */
    signin = async (input: KodzeroAuthEmailSignin): Promise<{access: string, refresh: string}> => {
        const url = buildURL(this.host, this.collection + '/signin')
       
        const response = await this.api.post(url, input)
            .headers({ 'Content-Type': 'application/json' });

        await this._handleApiError(response);        
        const json = await response.json();

        if (json.ok && json.tokens && json.tokens.access && json.tokens.refresh) {        
            this._setTokens(json.tokens.access, json.tokens.refresh);
        }
    
        return json.tokens
    }

    /**
     *  Sign up with email and password. On success, sets tokens in TokensManager automatically
     */
    signup = async (userData: Record<string, string>): Promise<Record<string, any>> => {
        const url = buildURL(this.host, this.collection + '/signup')
        const response = await this.api.post(url, userData)
            .headers({ 'Content-Type': 'application/json' });
            
        await this._handleApiError(response);        
        const json = await response.json();

        if (json.ok && json.result && json.result.tokens.access && json.result.tokens.refresh) {
            this._setTokens(json.result.tokens.access, json.result.tokens.refresh);
        }

        return json.result.user
    }

    /**
     * Verify current access token
     */
    verify = async (): Promise<any> => {
        try {
            const url = buildURL(this.host, this.collection + '/verify')
            const response = await this.api.get(url)
            const json = await response.json();

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
    refresh = async (): Promise<any> => {
        const url = buildURL(this.host, this.collection + '/refresh')
        const response = await this.api.post(url, { refresh: this.tokensManager.refresh })
            .headers({ 'Content-Type': 'application/json' });

        await this._handleApiError(response);        
        const json = await response.json(); 
        
        if (json.ok && json.tokens && json.tokens.access) {
            this.tokensManager.setAccess(json.tokens.access)
        }

        return json.ok ? true : false
    }

    /**
     * Sign out the user
     * If success, clears tokens in TokensManager automatically
     */
    signout = async (): Promise<any> => {
        const url = buildURL(this.host, this.collection + '/signout')
        const response = await this.api.post(url, {})
            .headers({ 'Content-Type': 'application/json' });

        await this._handleApiError(response);        
        const json = await response.json(); 

        if (json.ok) this.tokensManager.clear()

        return json.ok ? true : false
    }

}

export default KodzeroAuthEmail