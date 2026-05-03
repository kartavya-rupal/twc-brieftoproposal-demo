import { NextRequest, NextResponse } from "next/server";
import { generateProposal } from "@/lib/groq";
import { leadBriefSchema, proposalResultSchema } from "@/lib/schema";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const { brief } = body;

        if (!brief) {
            return NextResponse.json(
                { error: "Invalid input: brief is required" },
                { status: 400 }
            );
        }

        const parsedBrief = leadBriefSchema.safeParse(brief);

        if (!parsedBrief.success) {
            return NextResponse.json(
                { error: "Invalid brief format", details: parsedBrief.error },
                { status: 400 }
            );
        }

        const proposal = await generateProposal(parsedBrief.data);

        const parsedProposal = proposalResultSchema.safeParse(proposal);

        if (!parsedProposal.success) {
            return NextResponse.json(
                { error: "Invalid proposal format", details: parsedProposal.error },
                { status: 500 }
            );
        }

        return NextResponse.json(parsedProposal.data);
    } catch (error) {
        console.error("Generate Proposal Error:", error);

        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}