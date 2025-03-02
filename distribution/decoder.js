const regex = /^(?:ANSI\s)?(\d+)$/m;
export function createDecoder(encoding, second = false) {
    if (!encoding) {
        return browserDecoder;
    }
    encoding = encoding.trim();
    try {
        // eslint-disable-next-line no-new
        new TextDecoder(encoding.trim());
    }
    catch {
        const match = regex.exec(encoding);
        if (match && !second) {
            return createDecoder('windows-' + match[1], true);
        }
        encoding = undefined;
        return browserDecoder;
    }
    return browserDecoder;
    function browserDecoder(view) {
        const decoder = new TextDecoder(encoding ?? undefined);
        const out = decoder.decode(view, {
            stream: true,
        }) + decoder.decode();
        return out.replaceAll('\0', '').trim();
    }
}
