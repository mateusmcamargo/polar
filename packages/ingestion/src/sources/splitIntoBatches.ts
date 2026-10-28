export function splitIntoBatches<Item>(items: Item[], batchSize: number): Item[][] {
    const batches: Item[][] = [];
    for (let start = 0; start < items.length; start += batchSize) {
        batches.push(items.slice(start, start + batchSize));
    }
    return batches;
}