import FluidFetch from "fluid-fetch";
import { AuthOptions } from "./index.js";
import TokensManagerClass from "./tokens.js";
import BaseAuthSchema from "../schemas/baseAuth.js";
import validateApiResponse from "../utils/validateApiResponse.js";

class KodzeroAuthBase {
    host: string;
    api: typeof FluidFetch
    tokensManager: TokensManagerClass

    constructor(options: AuthOptions, api: typeof FluidFetch, tokensManager: TokensManagerClass) {
        BaseAuthSchema.validateOrThrow(options);
        
        this.host = options.host
        this.api = api
        this.tokensManager = tokensManager
    }

    /**
     * Private.
     * Links to API error handler
     */
    _handleApiError(response: Response) {
        return validateApiResponse(response)
    }

    /** 
     * Base auth methods.
     * These will be overridden by specific strategies (e.g. email, social, etc.)
     */
    login = (...args: any[]): Promise<any> | void => {}
    register = (...args: any[]): Promise<any> | void => {}
    refresh = (...args: any[]): Promise<any> | void => {}
    logout = (...args: any[]): Promise<any> | void => {}
    verify = (...args: any[]): Promise<any> | void => {}
}

export default KodzeroAuthBase