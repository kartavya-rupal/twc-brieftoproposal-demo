import { NextRequest, NextResponse } from "next/server";
import { extractLeadBrief } from "@/lib/groq";
import { leadExtractionResultSchema } from "@/lib/schema";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const { message } = body;

        if (!message || typeof message !== "string") {
            return NextResponse.json(
                { error: "Invalid input: message is required" },
                { status: 400 }
            );
        }

        const result = await extractLeadBrief(message);

        const parsed = leadExtractionResultSchema.safeParse(result);

        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid AI response format", details: parsed.error },
                { status: 500 }
            );
        }

        return NextResponse.json(parsed.data);
    } catch (error) {
        console.error("Extract Brief Error:", error);

        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}