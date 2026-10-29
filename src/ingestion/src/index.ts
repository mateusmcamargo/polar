import { camaraDeputiesAdapter } from "./sources/camara/deputies";
import { createCamaraExpensesAdapter } from "./sources/camara/expenses";
import { camaraFrontsAdapter } from "./sources/camara/fronts";
import { camaraOrgansAdapter } from "./sources/camara/organs";
import { createCamaraVotesAdapter } from "./sources/camara/votes";
import { runSourceAdapter, type SourceAdapter } from "./sources/sourceAdapter";

// adapters are registered here as each data source is implemented; the arguments after the adapter name are passed on
const registeredAdapters: Record<string, (adapterArguments: string[]) => SourceAdapter<any, any, any>> = {
    "camara-deputies": () => camaraDeputiesAdapter,
    "camara-expenses": ([year]) => {
        if (!/^\d{4}$/.test(year ?? "")) {
            throw new Error("usage: pnpm ingest camara-expenses <year>");
        }
        return createCamaraExpensesAdapter(Number(year));
    },
    "camara-fronts": () => camaraFrontsAdapter,
    "camara-organs": () => camaraOrgansAdapter,
    "camara-votes": ([year]) => {
        if (!/^\d{4}$/.test(year ?? "")) {
            throw new Error("usage: pnpm ingest camara-votes <year>");
        }
        return createCamaraVotesAdapter(Number(year));
    },
};

async function main(): Promise<void> {
    const requestedAdapterName = process.argv[2];
    const availableAdapterNames = Object.keys(registeredAdapters);

    if (!requestedAdapterName) {
        console.log("usage: pnpm ingest <adapter> [arguments]");
        console.log(`available adapters: ${availableAdapterNames.join(", ") || "none yet"}`);
        return;
    }

    const createAdapter = registeredAdapters[requestedAdapterName];
    if (!createAdapter) {
        throw new Error(`unknown adapter "${requestedAdapterName}"`);
    }
    const adapter = createAdapter(process.argv.slice(3));

    const result = await runSourceAdapter(adapter);
    console.log(`${adapter.name}: ${result.insertedOrUpdatedCount} records written`);
}

main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
});