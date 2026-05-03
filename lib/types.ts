export type EventType =
    | "wedding"
    | "engagement"
    | "sangeet"
    | "mehendi"
    | "haldi"
    | "reception"
    | "roka"
    | "cocktail"
    | "other"
    | "intimate wedding"

export type ServiceNeed =
    | "venue"
    | "decor"
    | "photography"
    | "planning"
    | "logistics"
    | "catering"
    | "transport"
    | "entertainment"
    | "stay"
    | "other";

export type LeadType =
    | "venue_only"
    | "decor_only"
    | "photography_only"
    | "full_planning"
    | "other";

export type PlanningStage = "early" | "mid" | "late";
export type Urgency = "low" | "medium" | "high";

export interface ConfidenceMap {
    city: number;
    date: number;
    guest_count: number;
    budget: number;
    style: number;
    events_count: number;
    overall?: number;
}

export interface LeadBrief {
    event_type: EventType | null;
    city: string | null;
    location_flexibility: string | null;
    date_window: string | null;
    exact_date: string | null;
    guest_count: number | null;
    budget_inr: number | null;
    style: string | null;
    events_count: number | null;
    service_need: ServiceNeed[];
    planning_stage: PlanningStage;
    must_haves: string[];
    deal_breakers: string[];
    food_preference: string | null;
    accommodation_required: boolean | null;
    urgency: Urgency;
    lead_type: LeadType;
    confidence: ConfidenceMap;
    raw_message?: string;
}

export interface LeadExtractionResult {
    raw_message: string;
    brief: LeadBrief;
    missing_questions: string[];
    notes?: string[];
}

export interface VenueCapacity {
    min: number;
    max: number;
}

export interface VenueBudgetRange {
    min: number;
    max: number;
}

export interface Venue {
    id: string;
    name: string;
    city: string;
    locality: string;
    category: string;
    capacity: VenueCapacity;
    budget_range_inr: VenueBudgetRange;
    event_types: EventType[];
    styles: string[];
    tags: string[];
    amenities: string[];
    usp: string;
    rating: number;
    review_count: number;
    availability_hint: "High" | "Medium" | "Low";
    recommended_for: Array<"venue-only" | "decor" | "full planning" | "budget planning" | "premium planning" | "venue matching" | "destination wedding">;
}

export interface VenueMatch {
    venue_id: string;
    venue_name: string;
    fit_score: number;
    reason: string;
    possible_issue: string | null;
}

export interface BudgetSplitSuggestion {
    venue: string;
    decor: string;
    food: string;
    photo_video: string;
    misc: string;
}

export interface ProposalResult {
    client_summary: string;
    requirements_summary: string;
    recommended_venues: VenueMatch[];
    budget_split_suggestion: BudgetSplitSuggestion;
    tradeoffs: string[];
    follow_up_questions: string[];
    whatsapp_summary: string;
    proposal_copy: string;
}

export const EMPTY_CONFIDENCE: ConfidenceMap = {
    city: 0,
    date: 0,
    guest_count: 0,
    budget: 0,
    style: 0,
    events_count: 0,
    overall: 0
};