import FluidFetch from "fluid-fetch"
import { KodzeroAuth } from "./auth/index.js"
import createModel from "./model/createModel.js"
import { ModelOptions } from "./model/BaseModel.js"
import { TokensManagerClass } from "./auth/tokens.js"

interface Options {
    host: string
}

class Kodzero {
    host: string
    auth: KodzeroAuth
    tokensManager: TokensManagerClass
    api: typeof FluidFetch

    constructor (options: Options) {
        this.tokensManager = new TokensManagerClass('', '')
        this.host = options.host
        this.api = new FluidFetch()
        this.auth = new KodzeroAuth({host: options.host}, this.api, this.tokensManager)

        this.api.middlewares.request.use((req: any) => {
            const accessToken = this.tokensManager.access
            if (accessToken) req.headers['Authorization'] = accessToken
            return req
        })
    }

    createModel = <T extends { _id?: string }, M = {}>(options: Omit<ModelOptions, 'host'>) => {
        return createModel<T, M>({...options, host: this.host}, this.api)
    }
}

export default Kodzero