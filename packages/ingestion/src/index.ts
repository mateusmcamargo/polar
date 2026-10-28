import { camaraDeputiesAdapter } from "./sources/camara/deputies";
import { runSourceAdapter, type SourceAdapter } from "./sources/sourceAdapter";

// adapters are registered here as each data source is implemented
const registeredAdapters: Record<string, SourceAdapter<any, any, any>> = {
    [camaraDeputiesAdapter.name]: camaraDeputiesAdapter,
};

async function main(): Promise<void> {
    const requestedAdapterName = process.argv[2];
    const availableAdapterNames = Object.keys(registeredAdapters);

    if (!requestedAdapterName) {
        console.log("usage: pnpm ingest <adapter>");
        console.log(`available adapters: ${availableAdapterNames.join(", ") || "none yet"}`);
        return;
    }

    const adapter = registeredAdapters[requestedAdapterName];
    if (!adapter) {
        throw new Error(`unknown adapter "${requestedAdapterName}"`);
    }

    const result = await runSourceAdapter(adapter);
    console.log(`${adapter.name}: ${result.insertedOrUpdatedCount} records written`);
}

main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
});