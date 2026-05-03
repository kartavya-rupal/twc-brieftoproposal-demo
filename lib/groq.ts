import Groq from "groq-sdk";
import { z } from "zod";

import {
    EXTRACT_BRIEF_SYSTEM_PROMPT,
    PROPOSAL_SYSTEM_PROMPT,
    WHATSAPP_SUMMARY_SYSTEM_PROMPT
} from "@/lib/prompts";
import {
    budgetSplitSuggestionSchema,
    leadExtractionResultSchema,
    leadBriefSchema,
    proposalResultSchema,
    venueMatchSchema
} from "./schema";
import type { LeadBrief, LeadExtractionResult, ProposalResult, Venue } from "@/lib/types";
import {
    buildBudgetSplit,
    buildMissingQuestions,
    detectAccomNeed,
    detectCityFromList,
    detectEventType,
    inferPlanningStage,
    detectServiceNeeds,
    detectStyleHint,
    inferLeadType,
    inferUrgency,
    normalizeText,
    parseGuestCountFromText,
    parseIndianBudgetFromText,
    rankVenuesForBrief,
    safeJsonParse,
    summarizeBrief,
    titleCase
} from "@/lib/utils";
import { MOCK_VENUES } from "./mockvenues";

const client = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
const MODEL = process.env.GROQ_MODEL || "llama-3.1-70b-versatile";

type ChatMessage = {
    role: "system" | "user" | "assistant";
    content: string;
};

async function chatJson<T>(messages: ChatMessage[], fallback: T): Promise<T> {
    if (!client) return fallback;

    try {
        const response = await client.chat.completions.create({
            model: MODEL,
            messages,
            temperature: 0.2,
            response_format: { type: "json_object" }
        });

        const raw = response.choices[0]?.message?.content ?? "{}";
        return safeJsonParse<T>(raw, fallback);
    } catch {
        return fallback;
    }
}

function fallbackExtractLeadBrief(rawMessage: string): LeadExtractionResult {
    const cities = Array.from(new Set(MOCK_VENUES.map((venue) => venue.city)));
    const city = detectCityFromList(rawMessage, cities);

    const service_need = detectServiceNeeds(rawMessage);
    const event_type = detectEventType(rawMessage);
    const guest_count = parseGuestCountFromText(rawMessage);
    const budget_inr = parseIndianBudgetFromText(rawMessage);
    const style = detectStyleHint(rawMessage);
    const events_count = normalizeText(rawMessage).match(/(\d+)\s*(events?|functions?)/)?.[1]
        ? parseInt(normalizeText(rawMessage).match(/(\d+)\s*(events?|functions?)/)?.[1]!, 10)
        : null;

    const brief: LeadBrief = {
        event_type,
        city,
        location_flexibility: city ? city : null,
        date_window: null,
        exact_date: null,
        guest_count,
        budget_inr,
        style,
        events_count,
        service_need,
        planning_stage: inferPlanningStage(rawMessage),
        must_haves: [],
        deal_breakers: [],
        food_preference: null,
        accommodation_required: detectAccomNeed(rawMessage),
        urgency: inferUrgency(rawMessage),
        lead_type: inferLeadType(service_need),
        confidence: {
            city: city ? 0.75 : 0,
            date: 0,
            guest_count: guest_count ? 0.7 : 0,
            budget: budget_inr ? 0.7 : 0,
            style: style ? 0.5 : 0,
            events_count: events_count ? 0.4 : 0,
            overall: 0.5
        },
        raw_message: rawMessage
    };

    const missing_questions = buildMissingQuestions(brief);

    return {
        raw_message: rawMessage,
        brief,
        missing_questions,
        notes: ["Fallback extraction used because LLM was unavailable or parsing failed."]
    };
}

function fallbackProposal(brief: LeadBrief, venues: Venue[]): ProposalResult {
    const ranked = rankVenuesForBrief(brief, venues).slice(0, 3);

    const recommended_venues = ranked.map((item) => ({
        venue_id: item.venue_id,
        venue_name: item.venue_name,
        fit_score: item.fit_score,
        reason: item.reason,
        possible_issue: item.possible_issue
    }));

    const proposal: ProposalResult = {
        client_summary: summarizeBrief(brief),
        requirements_summary: [
            brief.event_type ?? "event",
            brief.city ?? "location TBD",
            brief.guest_count ? `${brief.guest_count} guests` : "guest count TBD",
            brief.budget_inr ? `budget ${brief.budget_inr}` : "budget TBD",
            brief.style ?? "style TBD"
        ].join(" • "),
        recommended_venues,
        budget_split_suggestion: buildBudgetSplit(brief),
        tradeoffs: [
            "This is a first-draft recommendation based on the structured brief.",
            "Final selection should be adjusted once availability and exact requirements are confirmed."
        ],
        follow_up_questions: buildMissingQuestions(brief).slice(0, 4),
        whatsapp_summary: `Shortlist ready for ${brief.city ?? "your location"}${brief.guest_count ? ` • ${brief.guest_count} guests` : ""}${brief.budget_inr ? ` • budget around ${brief.budget_inr}` : ""}.`,
        proposal_copy: `Proposal draft: Based on the brief, the best-fit venues are ${recommended_venues
            .map((v) => v.venue_name)
            .join(", ")}. Next step: confirm exact date, preferences, and availability before finalizing.`
    };

    return proposal;
}

export async function extractLeadBrief(rawMessage: string): Promise<LeadExtractionResult> {
    const fallback = fallbackExtractLeadBrief(rawMessage);

    const payload = await chatJson(
        [
            { role: "system", content: EXTRACT_BRIEF_SYSTEM_PROMPT },
            {
                role: "user",
                content: `
Extract a structured wedding lead brief from this message:

${rawMessage}

Return JSON with keys:
- raw_message
- brief
- missing_questions
- notes

Brief must match the schema exactly.
`
            }
        ],
        fallback
    );

    const parsed = leadExtractionResultSchema.safeParse(payload);
    if (!parsed.success) return fallback;

    return parsed.data;
}

export async function generateProposal(
    brief: LeadBrief,
    venues: Venue[] = MOCK_VENUES
): Promise<ProposalResult> {
    const ranked = rankVenuesForBrief(brief, venues).slice(0, 4);
    const shortlist = ranked.map((item) => ({
        venue_id: item.venue_id,
        venue_name: item.venue_name,
        city: item.venue.city,
        locality: item.venue.locality,
        category: item.venue.category,
        capacity: item.venue.capacity,
        budget_range_inr: item.venue.budget_range_inr,
        styles: item.venue.styles,
        tags: item.venue.tags,
        rating: item.venue.rating,
        availability_hint: item.venue.availability_hint,
        fit_score: item.fit_score,
        reason: item.reason,
        possible_issue: item.possible_issue
    }));

    const fallback = fallbackProposal(brief, venues);

    const payload = await chatJson(
        [
            { role: "system", content: PROPOSAL_SYSTEM_PROMPT },
            {
                role: "user",
                content: `
Create a first-draft wedding proposal from this structured brief:

${JSON.stringify(brief, null, 2)}

Shortlisted venues:
${JSON.stringify(shortlist, null, 2)}

Rules:
- Use the shortlist as the main recommendation set.
- Do not invent exact commercial prices.
- Keep it practical and client-friendly.
- Return JSON only.
`
            }
        ],
        fallback
    );

    const parsed = proposalResultSchema.safeParse(payload);
    if (!parsed.success) return fallback;

    return parsed.data;
}

export async function generateWhatsAppSummary(brief: LeadBrief, proposalCopy?: string): Promise<{ message: string }> {
    const fallbackMessage = proposalCopy
        ? proposalCopy.slice(0, 240)
        : `Summary: ${brief.city ?? "location TBD"} • ${brief.guest_count ?? "guest count TBD"} guests • ${brief.budget_inr ? `budget ${brief.budget_inr}` : "budget TBD"}`;

    const payload = await chatJson(
        [
            { role: "system", content: WHATSAPP_SUMMARY_SYSTEM_PROMPT },
            {
                role: "user",
                content: `
Write a short WhatsApp summary from this brief and proposal:

Brief:
${JSON.stringify(brief, null, 2)}

Proposal:
${proposalCopy ?? ""}

Return JSON with key: message
`
            }
        ],
        { message: fallbackMessage }
    );

    const schema = z.object({ message: z.string() });
    const parsed = schema.safeParse(payload);
    return parsed.success ? parsed.data : { message: fallbackMessage };
}

export function getRankedVenuesForBrief(brief: LeadBrief, venues: Venue[] = MOCK_VENUES) {
    return rankVenuesForBrief(brief, venues).map((item) => ({
        venue_id: item.venue_id,
        venue_name: item.venue_name,
        fit_score: item.fit_score,
        reason: item.reason,
        possible_issue: item.possible_issue
    }));
}

export function explainShortlist(brief: LeadBrief, venues: Venue[] = MOCK_VENUES) {
    const ranked = rankVenuesForBrief(brief, venues).slice(0, 4);

    return {
        explanations: ranked.map((item) => ({
            venue_id: item.venue_id,
            venue_name: item.venue_name,
            why_it_fits: `${item.reason}. ${item.venue.usp}`,
            possible_issue: item.possible_issue
        }))
    };
}

export {
    leadBriefSchema,
    proposalResultSchema,
    venueMatchSchema,
    budgetSplitSuggestionSchema,
    leadExtractionResultSchema
};
export { titleCase };
export const hasGroqKey = Boolean(process.env.GROQ_API_KEY);
export const defaultVenueCatalog = MOCK_VENUES;