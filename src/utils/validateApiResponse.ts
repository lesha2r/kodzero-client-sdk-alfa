import KodzeroApiError from "../errors/KodzeroApiError.js"

const validateApiResponse = async (response: Response) => {
    if (response.ok) return

    let json
    try { json = await response.json() } catch (err) { json = null }

    throw new KodzeroApiError(
        response.url,
        response.status,
        `API Request failed with status ${response.status}. Details: ${json?.details || json?.error || response.statusText}`,
        json?.details || json?.error || response.statusText
    );
}

export default validateApiResponse