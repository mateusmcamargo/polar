export interface CollectionContext {
    collectedAt: Date;
}

export interface UpsertResult {
    insertedOrUpdatedCount: number;
}

// every data source follows the same four steps, see the new-data-source skill
export interface SourceAdapter<RawData, ParsedRecord, NormalizedRecord> {
    name: string;
    fetch(context: CollectionContext): Promise<RawData>;
    parse(rawData: RawData): ParsedRecord[];
    normalize(parsedRecords: ParsedRecord[], context: CollectionContext): NormalizedRecord[];
    upsert(normalizedRecords: NormalizedRecord[]): Promise<UpsertResult>;
}

export async function runSourceAdapter<RawData, ParsedRecord, NormalizedRecord>(
    adapter: SourceAdapter<RawData, ParsedRecord, NormalizedRecord>,
): Promise<UpsertResult> {
    const context: CollectionContext = { collectedAt: new Date() };
    const rawData = await adapter.fetch(context);
    const parsedRecords = adapter.parse(rawData);
    const normalizedRecords = adapter.normalize(parsedRecords, context);
    return adapter.upsert(normalizedRecords);
}