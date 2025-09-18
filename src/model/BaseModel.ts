import Schema from "validno";
import FluidFetch from "fluid-fetch";
import constants from "./constants.js";
import validateApiResponse from "../utils/validateApiResponse.js";
import BaseModelSchema from "../schemas/baseModel.js";
import buildURL from "../utils/buildURL.js";

export interface ModelOptions {
    host: string
    collection: string
    schema?: Record<string, any>
}

/**
 * Base model constructor that expose main methods to work with user-created model
 */
class BaseModel<T extends { _id?: string }> {
    host: string
    collection: string
    modelData: T = {} as T
    schema?: typeof Schema
    api: typeof FluidFetch

    id: string | null;

    static url: string
    static collection: string
    static api: typeof FluidFetch

    constructor(options: ModelOptions, api: typeof FluidFetch) {
        BaseModelSchema.validateOrThrow(options);

        this.host = options.host
        this.collection = options.collection
        this.schema = options.schema ? new Schema({...options.schema}) : null
        this.api = api
        this.id = null;
    }

    /**
     * Private
     * Setter for this.id
     */
    _setId = (id: string | null) => {
        this.id = id
    }

    /**
     * Private
     * Setter for this.modelData. Also sets this.id if it is present
     */
    _setModelData = (data: T) => {
        this.modelData = data;
        this._setId(data?._id || null);
    }

    /**
     * Private
     * Links to API error handler
     */
    _handleApiError(response: Response) {
        return validateApiResponse(response)
    }

    /**
     * Getter for model's data (this.modelData)
     */
    data(): T {
        return this.modelData
    }

    /**
     * Private
     * Getter for model's data (this.modelData) excluding "_id" field
     * Used to 
     */
    _dataWithoutId(): Omit<T, "_id"> | {} {
        if (typeof this.modelData === 'object' && this.modelData !== null && '_id' in this.modelData) {
            const { _id, ...dataWithoutId } = this.modelData as T;
            return dataWithoutId;
        }

        return this.modelData;
    }

    /**
     * Private
     * Sets nested keys of this.modelData by the path
     * Path example: 'key.level2.level3'
     */
    _setNested(key: string, value: any) {
        const keys = key.split('.');


        let obj = this.modelData;
        while (keys.length > 1) {
            const k = keys.shift()!;
            // @ts-ignore
            if (!(k in obj)) obj[k] = {};
            // @ts-ignore
            obj = obj[k];
        }
        // @ts-ignore
        obj[keys[0]] = value;

        return this.modelData
    }

    /**
     * Setter for model's data (this.modelData)
     */
    set(data: Record<string, any> | string, value?: any) {
        if (typeof data === 'string' && value !== undefined) {
            this._setNested(data, value);
        } else if (typeof data === 'object') {
            Object.entries(data).forEach(([key, value]) => {
                this._setNested(key, value);
            });
        }

        return this.modelData;
    }

    /**
     * Validates model's data against it's schema
     */
    validate(): {ok: boolean, errors: string[], joinErrors: () => string} {
        const schema = this.schema;

        if (!schema) {
            throw new Error(constants.NoSchema);
        }

        const keysToValidate = Object.keys(this.schema.definition).filter(k => k !== '_id')
        const validationResult = schema.validate(this._dataWithoutId(), keysToValidate);

        return validationResult
    }

    /**
     * Sends patch request to update document data by it's _id
     */
    async update(): Promise<T> {
        if (!this.id) {
            throw new Error(constants.RequiresId);
        }

        const updateUrl = buildURL(this.host, this.collection, this.id)
       
        const response = await this.api.patch(updateUrl, this._dataWithoutId())
            .headers({ 'Content-Type': 'application/json' });

        await this._handleApiError(response);        
        const json = await response.json();
        
        this._setModelData(json.result);

        return this.modelData
    }

    /**
     * Sends delete request to delete document by it's _id
     */
    async delete(): Promise<boolean> {
        if (!this.id) {
            throw new Error(constants.RequiresId);
        }

        const deleteUrl = buildURL(this.host, this.collection, this.id);

        const response = await this.api.delete(deleteUrl);
        await this._handleApiError(response);

        this._setId(null);
        this.modelData = {} as T;

        return true;
    }

    /**
     * Sends post request to insert document into the collection
     */
    async create(): Promise<T> {
        const createUrl = buildURL(this.host, this.collection)
        
        const response = await this.api.post(createUrl, this._dataWithoutId())
            .headers({ 'Content-Type': 'application/json' });

        await this._handleApiError(response);
        const json = await response.json();
        
        this._setModelData(json.result);

        return this.modelData
    }

    /**
     * Updates document or inserts it depending on presense of _id (this.id)
     */
    async save(): Promise<T> {
        if (this.id) {
            return this.update();
        } else {
            return this.create();
        }
    }
}

export default BaseModel