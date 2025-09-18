class KodzeroApiError extends Error {
    url: string;
    statusCode: number;
    details: string;

    constructor(url: string, statusCode: number, message: string, details?: string) {
        
        super(message);

        this.name = "KodzeroApiError";
        this.url = url;
        this.statusCode = statusCode;
        this.details = details || '';
    }
}

export default KodzeroApiError