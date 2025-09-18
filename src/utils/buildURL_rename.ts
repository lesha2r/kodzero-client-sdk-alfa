const buildURL = (baseUrl: string, collection: string, id?: string): string => {
    let url = `${baseUrl}/${collection}`;
    if (id) url += `/${id}`;
    
    return url.replace(/\/+/g, '/').replace(':/', '://');
}

export default buildURL;
