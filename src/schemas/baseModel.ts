import Schema from 'validno'
import KodzeroValidationError from '../errors/KodzeroValidationError.js';

class BaseModelSchema {
    // Validation schema for BaseModel class constructor options
    static schema = new Schema({
        host: {
            type: String
        },
        collection: {
            type: String
        },
        schema: {
            type: Schema,
            required: false
        }
    })

    static validate = (options: Record<string, any>) => BaseModelSchema.schema.validate(options);

    static validateOrThrow = (options: Record<string, any>) => {
        const validation = BaseModelSchema.schema.validate(options);

        if (!validation.ok) {
            throw new KodzeroValidationError(
                'Invalid model options: ' + validation.failed.join(', '),   // TODO: to constants
                validation.errors
            );
        }

        return true
    }
}

export default BaseModelSchema;