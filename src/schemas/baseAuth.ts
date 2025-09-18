import Schema from 'validno'
import KodzeroValidationError from '../errors/KodzeroValidationError.js';

class BaseAuthSchema {
    // Validation schema for BaseAuth class constructor options
    static schema = new Schema({
        host: {
            type: String
        }
    })

    static validate = (options: Record<string, any>) => BaseAuthSchema.schema.validate(options);

    static validateOrThrow = (options: Record<string, any>) => {
        const validation = BaseAuthSchema.schema.validate(options);

        if (!validation.ok) {
            throw new KodzeroValidationError(
                'Invalid auth options: ' + validation.failed.join(', '),
                validation.errors
            );
        }

        return true
    }
}

export default BaseAuthSchema;