export type Decoder = (view: ArrayBuffer | DataView | Uint8Array) => string;
export declare function createDecoder(encoding: string | undefined, second?: boolean): Decoder;
