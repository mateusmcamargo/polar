import { timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";

// called by the ingestion jobs after writing, so pages show new data on their next visit
export async function POST(request: Request): Promise<Response> {
    const secret = process.env.REVALIDATE_SECRET;
    if (!secret) {
        return Response.json({ revalidated: false, message: "REVALIDATE_SECRET is not set" }, { status: 500 });
    }

    const expected = Buffer.from(`Bearer ${secret}`);
    const received = Buffer.from(request.headers.get("authorization") ?? "");
    if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
        return Response.json({ revalidated: false }, { status: 401 });
    }

    // every ingestion run touches data shown on several pages, so the whole site is marked stale
    revalidatePath("/", "layout");
    return Response.json({ revalidated: true });
}