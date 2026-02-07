import buildURL from '../../utils/buildURL.js';

describe('buildURL', () => {
    test('buildURL constructs a URL without an ID', () => {
        const url = buildURL('https://example.com', 'collection');
        expect(url).toBe('https://example.com/collection');
    });

    test('buildURL constructs a URL with an ID', () => {
        const url = buildURL('https://example.com', 'collection', '123');
        expect(url).toBe('https://example.com/collection/123');
    });

    test('buildURL handles trailing slashes in baseUrl and collection', () => {
        const url = buildURL('https://example.com/', '/collection/', '123');
        expect(url).toBe('https://example.com/collection/123');
    });
})