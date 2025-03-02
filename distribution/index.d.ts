import { type Readable } from 'node:stream';
export type DbfHeader = {
    lastUpdated: Date;
    records: number;
    headerLen: number;
    recLen: number;
};
export type RowHeader = {
    name: string;
    dataType: string;
    len: number;
    decimal: number;
};
export default function parseDbf(stream: Readable, encoding?: string): Promise<Record<string, any>[]>;
