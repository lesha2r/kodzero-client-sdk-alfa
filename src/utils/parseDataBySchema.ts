/**
 * Marker class to identify JSON-typed fields in schema definitions.
 * Use as `type: JsonField` in schema to enable automatic JSON string parsing.
 *
 * Example:
 * ```ts
 * const MyModel = kodzero.createModel({
 *   collection: 'items',
 *   schema: {
 *     metadata: { type: JsonField },
 *   }
 * });
 * ```
 */
export class JsonField {}

/**
 * Parses fields in a raw data object according to the schema type definitions:
 * - Fields with `type: Date` are converted from ISO strings to Date instances.
 * - Fields with `type: JsonField` are parsed from JSON strings to objects/arrays.
 * - Non-required fields that are absent or null/undefined are left unchanged.
 */
export function parseDataBySchema<T extends Record<string, any>>(
    data: T,
    schemaDef: Record<string, any>
): T {
    if (!data || typeof data !== 'object' || !schemaDef) return data;

    const result: Record<string, any> = { ...data };

    for (const [key, fieldDef] of Object.entries(schemaDef)) {
        const type =
            fieldDef && typeof fieldDef === 'object' && 'type' in fieldDef
                ? fieldDef.type
                : fieldDef;

        const value = data[key];

        if (value === undefined || value === null) continue;

        if (type === Date && typeof value === 'string') {
            result[key] = new Date(value);
        } else if (type === JsonField && typeof value === 'string') {
            try {
                result[key] = JSON.parse(value);
            } catch {
                // Keep original value if JSON parsing fails
            }
        }
    }

    return result as T;
}
