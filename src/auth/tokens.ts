/**
 * TokensManagerClass is responsible for managing access and refresh tokens.
 * It provides methods to set, get, check existence, and clear tokens.
 */
class TokensManagerClass {
    access: string
    refresh: string

    constructor(access: string = '', refresh: string = '') {
        this.access = access
        this.refresh = refresh
    }

    /**
     * Checks if access token exists
     */
    hasAccess() {
        return this.access && this.access !== ''
    }

    /**
     * Checks if refresh token exists
     */
    hasRefresh() {
        return this.refresh && this.refresh !== ''
    }

    /**
     * Sets the access token
     */
    setAccess(token: string) {
        this.access = token
    }

    /**
     * Sets the refresh token
     */
    setRefresh(token: string) {
        this.refresh = token
    }

    /**
     * Clears both access and refresh tokens
     */
    clear() {
        this.access = ''
        this.refresh = ''
    }
}

export default TokensManagerClass