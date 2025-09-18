export interface KzResponse<T = any> {
    ok: boolean
    result: T
}

export interface KzResponseFindMany<T = any> extends KzResponse<{
    skip: number,
    limit: number,
    page: number,
    total: number,
    totalPages: number,
    left: number,
    found: T[],
}> {}