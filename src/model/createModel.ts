import FluidFetch from 'fluid-fetch'
import BaseModel, { ModelOptions } from './BaseModel.js'
import {KzResponseFindMany } from '../types/responses.js'
import validateApiResponse from '../utils/validateApiResponse.js'
import buildURL from '../utils/buildURL.js'
import constants from './constants.js'
import PaginatedResult from './PaginatedResult.js'

export interface FindManyOptions {
    page: number
    perPage: number
    search?: string
    sort?: string
    fields?: string[]
}

/**
 * Creates custom model with the specified schema, API options, etc.
 */
const createModel = <
    T extends { _id: string | null},
    M = {}
>(options: ModelOptions, apiClient: typeof FluidFetch) => {
    const Model = class extends BaseModel<T> {
        static host = options.host
        static collection = options.collection
        static apiClient = apiClient

        static async _handleApiError(response: Response) {
            return validateApiResponse(response)
        }

        // ** Model methods **
        static async get(id: string): Promise<InstanceType<typeof Model>> {
            if (!id) throw new Error(constants.RequiresId)
            
            const getUrl = buildURL(Model.host, Model.collection, id)
            
            const response = await Model.apiClient.get(getUrl);
            await Model._handleApiError(response);

            const json = await response.json();
            const model = new Model(json.result);
            model.modelData._id = json.result._id;
            model.id = json.result._id;
            
            return model;
        }

        /**
         * Adds custom method to Model
         * 
         * TS support: pass interfaces for both data and custom methods:
         * Example: 
         * interface Dog { name: string }
         * interface DogMethods { greet: () => `Woof! ${this.data().name}`}
         * "createModel<Dog, DogMethods>(...)"
         */
        static registerMethod<K extends keyof M>(name: K, fn: M[K]) {
            (Model.prototype as any)[name] = fn;
        }

        // ** Collection methods **
        static async find(id: string): Promise<T> {
            if (!id) throw new Error(constants.RequiresId);

            const getUrl = buildURL(Model.host, Model.collection, id)

            const response = await Model.apiClient.get(getUrl);
            await Model._handleApiError(response);

            const data = await response.json();
            return data.result;
        }

        static async findMany(options?: FindManyOptions | {}): Promise<T[]> {
            const getUrl = buildURL(Model.host, Model.collection)
            
            const params = {...options} as Record<string, any>;

            const response = await Model.apiClient.get(getUrl).params(params);
            await Model._handleApiError(response);

            const data: KzResponseFindMany<T> = await response.json();
            return data.result.found;
        }

        static async findManyPaginated(
            options: FindManyOptions | {} = {},
            page: number = 1,
            perPage: number = 25
        ): Promise<any> {
            if (!page || page < 1) throw new Error('Page number must be greater than 0');

            const getUrl = buildURL(Model.host, Model.collection)
            const params = {...options, page, perPage} as Record<string, any>;
            const response = await Model.apiClient.get(getUrl).params(params);
            await Model._handleApiError(response);

            const data: KzResponseFindMany<T> = await response.json();

            return new PaginatedResult({
                data: data.result.found,
                state: data.result,
                options,
                findManyFunction: Model.findManyPaginated
            })
        }

        static async create(data: T): Promise<T> {
            const createUrl = buildURL(Model.host, Model.collection)
            const {_id, ...dataWithoutId} = data as T & {_id: string | null};

            const response = await Model.apiClient.post(createUrl)
                .body(dataWithoutId)
                .headers({
                    'Content-Type': 'application/json'
                })

            await Model._handleApiError(response);

            const json = await response.json();
            return json.result
        }

        static async createMany(records: T[]): Promise<T[]> {
            if (!records || !Array.isArray(records) || !records.length) {
                throw new Error(constants.DataTypeNotArray)
            }

            const createUrl = buildURL(Model.host, Model.collection) + '/batch'

            const dataWithoutId = records.map(item => {
                const {_id, ...rest} = item as T & {_id?: string};
                return rest;
            });
            
            const response = await Model.apiClient.post(createUrl)
                .body(dataWithoutId)
                .headers({
                    'Content-Type': 'application/json'
                })
            await Model._handleApiError(response);

            const json = await response.json();
            return json.result
        }

        static async update(id: string, data: Partial<T>): Promise<T> {
            if (!id) {
                throw new Error(constants.RequiresId);
            }
            
            const updateUrl = buildURL(Model.host, Model.collection, id)
            const {_id, ...dataWithoutId} = data as Partial<T> & {_id?: string};
            const response = await Model.apiClient.patch(updateUrl)
                .body(dataWithoutId)
                .headers({ 'Content-Type': 'application/json' });

            await Model._handleApiError(response);        
            const json = await response.json();
            
            return json.result;
        }

        static async updateMany(updates: Partial<T>[]): Promise<T[]> {
            if (!updates || !Array.isArray(updates) || updates.length === 0) {
                throw new Error(constants.DataTypeNotArray);
            }

            if (updates.some(update => !update._id)) {
                throw new Error("All updates must have an _id");
            }

            const updateUrl = buildURL(Model.host, Model.collection) + '/batch'

            const response = await Model.apiClient.patch(updateUrl)
                .body(updates)
                .headers({ 'Content-Type': 'application/json' });

            await Model._handleApiError(response);        
            const json = await response.json();
            
            return json.result;
        }

        static async delete(id: string): Promise<boolean> {
            if (!id) throw new Error(constants.RequiresId);

            const deleteUrl = buildURL(Model.host, Model.collection, id)
            
            const response = await Model.apiClient.delete(deleteUrl);
            await Model._handleApiError(response);
            
            const json = await response.json();
            return json.result;
        }

        static async deleteMany(ids: string[]): Promise<Record<string, boolean>> {
            if (!ids || ids.length === 0) throw new Error(constants.RequiresIdsArray);

            const deleteUrl = buildURL(Model.host, Model.collection) + '/batch'
            
            const response = await Model.apiClient.delete(deleteUrl)
                .body({ ids })
                .headers({ 'Content-Type': 'application/json' });

            await Model._handleApiError(response);

            const json = await response.json();
            return json.result;
        }

        static async distinct(fields: string[], filter?: Record<string, any>): Promise<string[]> {
            throw new Error('Distinct method is disabled in this SDK version'); // temporary disable

            if (!fields || fields.length === 0) {
                throw new Error(constants.DistinctRequiresFieldsArray);
            }

            const distinctUrl = buildURL(Model.host, Model.collection, 'distinct')

            const response = await Model.apiClient.get(distinctUrl)
                .params({ fields: fields.join(','), filter: filter ? JSON.stringify(filter) : undefined })
                .headers({ 'Content-Type': 'application/json' });

            await Model._handleApiError(response);

            const json = await response.json();
            return json.result;
        }

        constructor(data: T) {
            super(options, apiClient)

            this.modelData = {...data}
            this.modelData._id = data._id || null;
            this.id = data._id || null;
        }
    }

    // Return type: ModelConstructor<T, M>
    type ModelInstance = BaseModel<T> & M;
    type Model = {
        new(data: T): ModelInstance;
        get(id: string): Promise<ModelInstance>;
        registerMethod<K extends keyof M>(name: K, fn: M[K]): void;
        find(id: string): Promise<T>;
        findMany(options?: FindManyOptions | {}): Promise<T[]>;
        findManyPaginated(options?: FindManyOptions | {}, page?: number, perPage?: number): Promise<PaginatedResult<T>>;
        create(data: T): Promise<T>;
        createMany(data: T[]): Promise<T[]>;
        update(id: string, data: Partial<T>): Promise<T>;
        updateMany(updates: Partial<T>[]): Promise<T[]>;
        delete(id: string): Promise<boolean>;
        deleteMany(ids: string[]): Promise<Record<string, boolean>>;
        distinct(fields: string[], filter?: Record<string, any>): Promise<string[]>;
        host: string;
        collection: string;
    };

    return Model as unknown as Model;
}

export default createModel