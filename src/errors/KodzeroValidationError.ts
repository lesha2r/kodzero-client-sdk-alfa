class KodzeroValidationError extends Error {
    errors: string[]

    constructor(message: string, errors: string[] = []) {
        super(message);

        this.name = "KodzeroValidationError";
        this.errors = errors;
    }
}

export default KodzeroValidationError