import { camaraDeputiesAdapter } from "./sources/camara/deputies";
import { createCamaraDeputyPagesAdapter } from "./sources/camara/deputyPages";
import { createCamaraEventsAdapter } from "./sources/camara/events";
import { createCamaraExpensesAdapter } from "./sources/camara/expenses";
import { camaraFrontsAdapter } from "./sources/camara/fronts";
import { camaraOrgansAdapter } from "./sources/camara/organs";
import { createCamaraVotesAdapter } from "./sources/camara/votes";
import { runSourceAdapter, type SourceAdapter } from "./sources/sourceAdapter";

// adapters are registered here as each data source is implemented; the arguments after the adapter name are passed on
const registeredAdapters: Record<string, (adapterArguments: string[]) => SourceAdapter<any, any, any>> = {
    "camara-deputies": () => camaraDeputiesAdapter,
    "camara-deputy-pages": (years) => {
        if (years.length === 0 || !years.every((year) => /^\d{4}$/.test(year))) {
            throw new Error("usage: pnpm ingest camara-deputy-pages <year> [year ...]");
        }
        return createCamaraDeputyPagesAdapter(years.map(Number));
    },
    "camara-events": ([year]) => {
        if (!/^\d{4}$/.test(year ?? "")) {
            throw new Error("usage: pnpm ingest camara-events <year>");
        }
        return createCamaraEventsAdapter(Number(year));
    },
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

    await requestSiteRevalidation();
}

// set only in the GitHub workflows; local runs do not touch the deployed site
async function requestSiteRevalidation(): Promise<void> {
    const revalidateUrl = process.env.REVALIDATE_URL;
    const revalidateSecret = process.env.REVALIDATE_SECRET;
    if (!revalidateUrl || !revalidateSecret) {
        console.log("site revalidation skipped: REVALIDATE_URL or REVALIDATE_SECRET is not set");
        return;
    }

    const response = await fetch(revalidateUrl, {
        method: "POST",
        headers: { authorization: `Bearer ${revalidateSecret}` },
    });
    if (!response.ok) {
        throw new Error(`site revalidation failed: ${revalidateUrl} answered ${response.status}`);
    }
    console.log("site revalidation requested");
}

main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
});