import createModel from '../../model/createModel.js'

const createMockResponse = (jsonData: any) => ({
    ok: true,
    status: 200,
    url: 'http://localhost:6969/products/distinct',
    statusText: 'OK',
    json: jest.fn().mockResolvedValue(jsonData),
})

describe('createModel distinct', () => {
    test('returns distinct values for requested fields and passes query params', async () => {
        const mockResponse = createMockResponse({
            ok: true,
            result: {
                brand: ['Nike', 'Adidas', 'Puma'],
                category: ['Shoes', 'Sneakers'],
            },
        })

        const params = jest.fn().mockResolvedValue(mockResponse)
        const get = jest.fn().mockReturnValue({ params })
        const apiClient = { get }

        const Product = createModel<{ _id: string | null; brand: string; category: string }>(
            { host: 'http://localhost:6969', collection: 'products' },
            apiClient as any
        )

        const result = await Product.distinct(['brand', 'category'], { status: 'active' })

        expect(get).toHaveBeenCalledWith('http://localhost:6969/products/distinct')
        expect(params).toHaveBeenCalledWith({
            fields: 'brand,category',
            filter: JSON.stringify({ status: 'active' }),
        })
        expect(result).toEqual({
            brand: ['Nike', 'Adidas', 'Puma'],
            category: ['Shoes', 'Sneakers'],
        })
    })

    test('does not send filter param when filter is not provided', async () => {
        const mockResponse = createMockResponse({
            ok: true,
            result: {
                brand: ['apple', 'google', 'samsung'],
            },
        })

        const params = jest.fn().mockResolvedValue(mockResponse)
        const get = jest.fn().mockReturnValue({ params })
        const apiClient = { get }

        const Product = createModel<{ _id: string | null; brand: string }>(
            { host: 'https://api.kodzero.pro/v1/10010', collection: '100051' },
            apiClient as any
        )

        const result = await Product.distinct(['brand'])

        expect(params).toHaveBeenCalledWith({ fields: 'brand' })
        expect(result).toEqual({ brand: ['apple', 'google', 'samsung'] })
    })

    test('throws when fields array is empty', async () => {
        const get = jest.fn()
        const apiClient = { get }

        const Product = createModel<{ _id: string | null; brand: string }>(
            { host: 'http://localhost:6969', collection: 'products' },
            apiClient as any
        )

        await expect(Product.distinct([])).rejects.toThrow('Distinct methods requires array of fields')
        expect(get).not.toHaveBeenCalled()
    })
})
