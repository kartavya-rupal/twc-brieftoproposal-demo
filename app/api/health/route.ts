import { hasGroqKey } from "@/lib/groq";
import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        ai: {
            groqConfigured: hasGroqKey
        }
    });
}