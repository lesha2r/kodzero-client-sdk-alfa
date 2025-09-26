import { FindManyOptions } from "./createModel.js"

interface PaginationState {
    skip: number,
    limit: number,
    page: number,
    total: number,
    totalPages: number,
    left: number
}

interface PaginationResultInput<T> {
    data: T[],
    state: PaginationState,
    options: FindManyOptions | {},
    findManyFunction: Function
}

class PaginatedResult<T = {}> {
    state: PaginationState
    data: Array<T>
    options: FindManyOptions | {}
    private findManyFunction: Function

    constructor(input: PaginationResultInput<T>) {
        const {findManyFunction, state, data, options} = input

        this.options = options
        this.findManyFunction = findManyFunction

        this.state = {
            skip: state.skip || 0,
            limit: state.limit || 0,
            page: state.page || 0,
            total: state.total || 0,
            totalPages: state.totalPages || 0,
            left: state.left || 0
        }

        this.data = data
    }

    async next(): Promise<PaginatedResult<T>> {
        this.state.page++;

        const result = await this.findManyFunction(this.options, this.state.page, this.state.limit);
        this.data = result.data;

        return this;
    }

    async previous(): Promise<PaginatedResult<T>> {
        if (this.state.page === 1) throw new Error('Page cannot be lower than 1')

        this.state.page--;
        const result = await this.findManyFunction(this.options, this.state.page, this.state.limit);
        this.data = result.data

        return this;
    }

    async page(pageNumber: number) {
        if (pageNumber < 1) throw new Error('Page cannot be lower than 1')
        
        this.state.page = pageNumber
        const result = this.findManyFunction(this.options, this.state.page, this.state.limit);
        this.data = result.data
        
        return this;
    }

    hasNext(): boolean {
        return this.state.page < this.state.totalPages
    }

    hasPrevious(): boolean {
        return this.state.page > 1
    }
}

export default PaginatedResult