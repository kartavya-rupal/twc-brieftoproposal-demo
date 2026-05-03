import { z } from "zod";

export const eventTypeSchema = z.enum([
    "wedding",
    "engagement",
    "sangeet",
    "mehendi",
    "haldi",
    "reception",
    "roka",
    "cocktail",
    "intimate wedding",
    "other"
]);

export const serviceNeedSchema = z.enum([
    "venue",
    "decor",
    "photography",
    "planning",
    "logistics",
    "catering",
    "transport",
    "entertainment",
    "stay",
    "other"
]);

export const leadTypeSchema = z.enum([
    "venue_only",
    "decor_only",
    "photography_only",
    "full_planning",
    "other"
]);

export const planningStageSchema = z.enum(["early", "mid", "late"]);
export const urgencySchema = z.enum(["low", "medium", "high"]);

export const confidenceSchema = z.object({
    city: z.number().min(0).max(1),
    date: z.number().min(0).max(1),
    guest_count: z.number().min(0).max(1),
    budget: z.number().min(0).max(1),
    style: z.number().min(0).max(1),
    events_count: z.number().min(0).max(1),
    overall: z.number().min(0).max(1).optional()
});

export const leadBriefSchema = z.object({
    event_type: eventTypeSchema.nullable(),
    city: z.string().nullable(),
    location_flexibility: z.string().nullable(),
    date_window: z.string().nullable(),
    exact_date: z.string().nullable(),
    guest_count: z.number().nullable(),
    budget_inr: z.number().nullable(),
    style: z.string().nullable(),
    events_count: z.number().nullable(),
    service_need: z.array(serviceNeedSchema),
    planning_stage: planningStageSchema,
    must_haves: z.array(z.string()),
    deal_breakers: z.array(z.string()),
    food_preference: z.string().nullable(),
    accommodation_required: z.boolean().nullable(),
    urgency: urgencySchema,
    lead_type: leadTypeSchema,
    confidence: confidenceSchema,
    raw_message: z.string().optional()
});

export const leadExtractionResultSchema = z.object({
    raw_message: z.string(),
    brief: leadBriefSchema,
    missing_questions: z.array(z.string()),
    notes: z.array(z.string()).optional()
});

export const venueCapacitySchema = z.object({
    min: z.number().int().nonnegative(),
    max: z.number().int().nonnegative()
});

export const venueBudgetRangeSchema = z.object({
    min: z.number().int().nonnegative(),
    max: z.number().int().nonnegative()
});

export const venueSchema = z.object({
    id: z.string(),
    name: z.string(),
    city: z.string(),
    locality: z.string(),
    category: z.string(),
    capacity: venueCapacitySchema,
    budget_range_inr: venueBudgetRangeSchema,
    event_types: z.array(eventTypeSchema),
    styles: z.array(z.string()),
    tags: z.array(z.string()),
    amenities: z.array(z.string()),
    usp: z.string(),
    rating: z.number().min(0).max(5),
    review_count: z.number().int().nonnegative(),
    availability_hint: z.enum(["High", "Medium", "Low"]),
    recommended_for: z.array(
        z.enum([
            "venue-only",
            "decor",
            "full planning",
            "budget planning",
            "premium planning",
            "venue matching",
            "destination wedding"
        ])
    )
});

export const venueMatchSchema = z.object({
    venue_id: z.string(),
    venue_name: z.string(),
    fit_score: z.number().min(0).max(100),
    reason: z.string(),
    possible_issue: z.string().nullable()
});

export const budgetSplitSuggestionSchema = z.object({
    venue: z.string(),
    decor: z.string(),
    food: z.string(),
    photo_video: z.string(),
    misc: z.string()
});

export const proposalResultSchema = z.object({
    client_summary: z.string(),
    requirements_summary: z.string(),
    recommended_venues: z.array(venueMatchSchema),
    budget_split_suggestion: budgetSplitSuggestionSchema,
    tradeoffs: z.array(z.string()),
    follow_up_questions: z.array(z.string()),
    whatsapp_summary: z.string(),
    proposal_copy: z.string()
});

export type LeadBriefInput = z.infer<typeof leadBriefSchema>;
export type LeadExtractionResultInput = z.infer<typeof leadExtractionResultSchema>;
export type VenueInput = z.infer<typeof venueSchema>;
export type VenueMatchInput = z.infer<typeof venueMatchSchema>;
export type ProposalResultInput = z.infer<typeof proposalResultSchema>;