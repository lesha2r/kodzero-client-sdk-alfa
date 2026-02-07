import FluidFetch from "fluid-fetch"
import KodzeroAuth from "./auth/index.js"
import createModel from "./model/createModel.js"
import { ModelOptions } from "./model/BaseModel.js"
import TokensManagerClass from "./auth/tokens.js"
import { ReservedKeyNames } from "./constants/reservedKeyNames.js"

interface Options {
    host: string
    authCollection?: string
}

class Kodzero {
    host: string
    authCollection: string | null
    auth: KodzeroAuth | null
    tokensManager: TokensManagerClass
    api: typeof FluidFetch

    constructor (options: Options) {
        this.tokensManager = new TokensManagerClass('', '')
        this.authCollection = options.authCollection || null
        this.host = options.host
        this.api = new FluidFetch()
        this.auth = !this.authCollection ? null : new KodzeroAuth({
            host: options.host,
            collection: this.authCollection
        }, this.api, this.tokensManager)

        this.api.middlewares.request.use((req: any) => {
            const accessToken = this.tokensManager.access
            if (accessToken) req.headers['Authorization'] = `Bearer ${accessToken}`
            return req
        })
    }

    createModel = <T extends { [ReservedKeyNames.ID]: string | null }, M = {}>(options: Omit<ModelOptions, 'host'>) => {
        return createModel<T, M>({...options, host: this.host}, this.api)
    }
}

export default Kodzero