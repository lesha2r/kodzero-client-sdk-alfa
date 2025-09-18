import FluidFetch from "fluid-fetch";
import { KodzeroAuthBase } from "./base.js";
import KodzeroAuthEmail from "./email.js";
import { TokensManagerClass } from "./tokens.js";

export interface AuthOptions {
    host: string
}

export class KodzeroAuth extends KodzeroAuthBase {
    email: KodzeroAuthEmail
    setTokens: (access: string, refresh?: string) => void
    clearTokens: () => void;

    constructor(options: AuthOptions, api: typeof FluidFetch, tokensManager: TokensManagerClass) {
        super(options, api, tokensManager)

        // Email Strategy
        this.email = new KodzeroAuthEmail(options, api, tokensManager)
        
        // Default methods set to email strategy methods
        this.signin = this.email.signin
        this.signup = this.email.signup
        this.signout = this.email.signout
        this.verify = this.email.verify
        this.refresh = this.email.refresh

        /**
         * Set tokens in TokensManager. Used for manual token setting on startup.
         */
        this.setTokens = (access: string, refresh?: string) => {
            tokensManager.setAccess(access)
            if (refresh) tokensManager.setRefresh(refresh)
        }

        /**
         * Clear tokens in TokensManager. Used for manual token clearing on necessary.
         */
        this.clearTokens = () => {
            tokensManager.clear()
        }
    }
}