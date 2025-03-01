const regex = /^(?:ANSI\s)?(\d+)$/m;

export function createDecoder(encoding:string | undefined, second: boolean = false) {
    if (!encoding) {
        return browserDecoder;
    }
    try {
        new TextDecoder(encoding.trim());
    } catch (e) {
        const match = regex.exec(encoding);
        if (match && !second) {
            return createDecoder('windows-' + match[1], true);
        } else {
            encoding = undefined;
            return browserDecoder;
        }
    }
    return browserDecoder;
    function browserDecoder(view: DataView) {
        const decoder = new TextDecoder(encoding ? encoding : undefined);
        const out = decoder.decode(view, {
            stream: true
        }) + decoder.decode();
        return out.replace(/\0/g, '').trim();
    }
}
