export function isUrl(url) {
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'https:';
    } catch (_) {
        return false;
    }
}

export function parseParams(params) {
    let results = [];
    const list = params.split(',');
    for (const el of list) {
        const items = el.split('=');
        if (items.length !== 2) {
            throw new Error('Parameters were mis-formatted, expecting parameters in format "key=value,key2=value2"');
        }
        results.push({
            ParameterKey: items[0],
            ParameterValue: items[1],
        });
    }
    return results;
}
