import { JsonField, parseDataBySchema } from '../../utils/parseDataBySchema.js';

describe('parseDataBySchema', () => {
    describe('Date fields', () => {
        test('converts a string value to a Date instance when type is Date', () => {
            const schemaDef = { createdAt: { type: Date } };
            const data = { createdAt: '2024-01-15T10:00:00.000Z' };

            const result = parseDataBySchema(data, schemaDef);

            expect(result.createdAt).toBeInstanceOf(Date);
            expect((result.createdAt as unknown as Date).toISOString()).toBe('2024-01-15T10:00:00.000Z');
        });

        test('handles Date type defined without wrapping object', () => {
            const schemaDef = { birthday: Date };
            const data = { birthday: '1990-06-01T00:00:00.000Z' };

            const result = parseDataBySchema(data, schemaDef);

            expect(result.birthday).toBeInstanceOf(Date);
        });

        test('skips conversion when Date field value is null', () => {
            const schemaDef = { createdAt: { type: Date, required: false } };
            const data = { createdAt: null };

            const result = parseDataBySchema(data, schemaDef);

            expect(result.createdAt).toBeNull();
        });

        test('skips conversion when Date field is absent', () => {
            const schemaDef = { createdAt: { type: Date, required: false } };
            const data = {} as Record<string, any>;

            const result = parseDataBySchema(data, schemaDef);

            expect(result.createdAt).toBeUndefined();
        });

        test('does not convert non-string Date values', () => {
            const existing = new Date('2024-01-01');
            const schemaDef = { createdAt: { type: Date } };
            const data = { createdAt: existing };

            const result = parseDataBySchema(data, schemaDef);

            expect(result.createdAt).toBe(existing);
        });
    });

    describe('JsonField fields', () => {
        test('parses a JSON string to an object when type is JsonField', () => {
            const schemaDef = { metadata: { type: JsonField } };
            const data = { metadata: '{"key":"value","count":42}' };

            const result = parseDataBySchema(data, schemaDef);

            expect(result.metadata).toEqual({ key: 'value', count: 42 });
        });

        test('parses a JSON array string to an array', () => {
            const schemaDef = { tags: { type: JsonField } };
            const data = { tags: '["a","b","c"]' };

            const result = parseDataBySchema(data, schemaDef);

            expect(result.tags).toEqual(['a', 'b', 'c']);
        });

        test('skips parsing when JsonField value is null', () => {
            const schemaDef = { metadata: { type: JsonField, required: false } };
            const data = { metadata: null };

            const result = parseDataBySchema(data, schemaDef);

            expect(result.metadata).toBeNull();
        });

        test('skips parsing when JsonField is absent', () => {
            const schemaDef = { metadata: { type: JsonField, required: false } };
            const data = {} as Record<string, any>;

            const result = parseDataBySchema(data, schemaDef);

            expect(result.metadata).toBeUndefined();
        });

        test('keeps original value when JSON string is invalid', () => {
            const schemaDef = { metadata: { type: JsonField } };
            const data = { metadata: 'not-valid-json' };

            const result = parseDataBySchema(data, schemaDef);

            expect(result.metadata).toBe('not-valid-json');
        });

        test('does not parse non-string JsonField values', () => {
            const existing = { already: 'parsed' };
            const schemaDef = { metadata: { type: JsonField } };
            const data = { metadata: existing };

            const result = parseDataBySchema(data, schemaDef);

            expect(result.metadata).toBe(existing);
        });
    });

    describe('non-required fields', () => {
        test('leaves other field types untouched', () => {
            const schemaDef = {
                name: { type: String },
                count: { type: Number },
            };
            const data = { name: 'Alice', count: 5 };

            const result = parseDataBySchema(data, schemaDef);

            expect(result.name).toBe('Alice');
            expect(result.count).toBe(5);
        });

        test('does not mutate the original data object', () => {
            const schemaDef = { createdAt: { type: Date } };
            const data = { createdAt: '2024-01-15T10:00:00.000Z' };

            parseDataBySchema(data, schemaDef);

            expect(typeof data.createdAt).toBe('string');
        });
    });

    describe('edge cases', () => {
        test('returns data unchanged when schemaDef is null', () => {
            const data = { createdAt: '2024-01-15T10:00:00.000Z' };
            const result = parseDataBySchema(data, null as any);
            expect(result).toBe(data);
        });

        test('returns data unchanged when data is null', () => {
            const schemaDef = { createdAt: { type: Date } };
            const result = parseDataBySchema(null as any, schemaDef);
            expect(result).toBeNull();
        });

        test('handles mixed Date and JsonField fields in one schema', () => {
            const schemaDef = {
                createdAt: { type: Date },
                metadata: { type: JsonField },
                name: { type: String },
            };
            const data = {
                createdAt: '2024-06-01T00:00:00.000Z',
                metadata: '{"x":1}',
                name: 'test',
            };

            const result = parseDataBySchema(data, schemaDef);

            expect(result.createdAt).toBeInstanceOf(Date);
            expect(result.metadata).toEqual({ x: 1 });
            expect(result.name).toBe('test');
        });
    });
});
