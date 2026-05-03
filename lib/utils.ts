import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { LeadBrief, Venue, VenueMatch } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function titleCase(value: string): string {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
}

export function stripCodeFences(text: string): string {
  return text.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
}

export function extractJsonObject<T = unknown>(text: string): T {
  const cleaned = stripCodeFences(text);
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON object found in text");
  }

  const jsonText = cleaned.slice(start, end + 1);
  return JSON.parse(jsonText) as T;
}

export function safeJsonParse<T>(text: string, fallback: T): T {
  try {
    return extractJsonObject<T>(text);
  } catch {
    return fallback;
  }
}

export function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export function parseIndianBudgetFromText(text: string): number | null {
  const normalized = normalizeText(text);

  const croreMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(cr|crore|crores)\b/);
  if (croreMatch) {
    return Math.round(parseFloat(croreMatch[1]) * 10000000);
  }

  const lakhMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(lakh|lakhs|lac|lacs|l)\b/);
  if (lakhMatch) {
    return Math.round(parseFloat(lakhMatch[1]) * 100000);
  }

  const plainMatch = normalized.match(/(?:₹|rs\.?|inr)?\s*(\d{2,8})/);
  if (plainMatch) {
    const num = parseInt(plainMatch[1], 10);
    if (num >= 10000) return num;
  }

  return null;
}

export function parseGuestCountFromText(text: string): number | null {
  const normalized = normalizeText(text);
  const guestMatch = normalized.match(/(\d{2,4})\s*(guests?|people|pax|persons?|heads?)\b/);
  if (guestMatch) return parseInt(guestMatch[1], 10);
  return null;
}

export function containsAny(text: string, keywords: string[]): boolean {
  const normalized = normalizeText(text);
  return keywords.some((keyword) => normalized.includes(keyword));
}

export function detectEventType(text: string): LeadBrief["event_type"] {
  const normalized = normalizeText(text);

  if (containsAny(normalized, ["engagement", "roka"])) return "engagement";
  if (containsAny(normalized, ["mehendi", "mehndi"])) return "mehendi";
  if (containsAny(normalized, ["haldi"])) return "haldi";
  if (containsAny(normalized, ["sangeet"])) return "sangeet";
  if (containsAny(normalized, ["reception"])) return "reception";
  if (containsAny(normalized, ["cocktail"])) return "cocktail";
  if (containsAny(normalized, ["wedding", "shaadi"])) return "wedding";

  return null;
}

export function detectServiceNeeds(text: string): LeadBrief["service_need"] {
  const normalized = normalizeText(text);
  const services: LeadBrief["service_need"] = [];

  if (containsAny(normalized, ["venue", "hall", "lawn", "banquet", "resort", "hotel"])) services.push("venue");
  if (containsAny(normalized, ["decor", "decoration", "flowers", "floral"])) services.push("decor");
  if (containsAny(normalized, ["photo", "photography", "videography"])) services.push("photography");
  if (containsAny(normalized, ["plan", "planning"])) services.push("planning");
  if (containsAny(normalized, ["logistics", "coordination", "ops", "operations"])) services.push("logistics");
  if (containsAny(normalized, ["cater", "food", "menu", "cuisine"])) services.push("catering");
  if (containsAny(normalized, ["cab", "car", "transport", "pickup", "drop"])) services.push("transport");
  if (containsAny(normalized, ["dj", "music", "entertainment", "band"])) services.push("entertainment");
  if (containsAny(normalized, ["stay", "rooms", "accommodation", "lodging"])) services.push("stay");

  return Array.from(new Set(services));
}

export function inferLeadType(services: LeadBrief["service_need"]): LeadBrief["lead_type"] {
  const hasVenue = services.includes("venue");
  const hasDecor = services.includes("decor");
  const hasPhotography = services.includes("photography");

  if (hasVenue && services.length === 1) return "venue_only";
  if (hasDecor && services.length === 1) return "decor_only";
  if (hasPhotography && services.length === 1) return "photography_only";
  if (services.includes("planning") || services.length >= 2) return "full_planning";
  return "other";
}

export function inferPlanningStage(text: string): LeadBrief["planning_stage"] {
  const normalized = normalizeText(text);

  if (containsAny(normalized, ["finalized", "booked", "last minute", "urgent", "immediately"])) return "late";
  if (containsAny(normalized, ["just exploring", "thinking", "shortlist", "curious", "not sure"])) return "early";
  return "mid";
}

export function inferUrgency(text: string): LeadBrief["urgency"] {
  const normalized = normalizeText(text);

  if (containsAny(normalized, ["urgent", "asap", "immediately", "tomorrow", "this week", "soon"])) return "high";
  if (containsAny(normalized, ["just exploring", "later", "planning", "next year"])) return "low";
  return "medium";
}

export function detectStyleHint(text: string): string | null {
  const normalized = normalizeText(text);

  const styleWords = [
    "palace-ish",
    "palace",
    "royal",
    "luxury",
    "premium",
    "minimal",
    "modern",
    "traditional",
    "heritage",
    "garden",
    "intimate",
    "budget-friendly",
    "contemporary",
    "destination",
    "elegant",
    "colorful"
  ];

  const hit = styleWords.find((word) => normalized.includes(word));
  return hit ?? null;
}

export function detectAccomNeed(text: string): boolean | null {
  const normalized = normalizeText(text);
  if (containsAny(normalized, ["rooms", "lodging", "stay", "accommodation", "family stay", "guest rooms"])) return true;
  if (containsAny(normalized, ["no stay", "no accommodation", "not needed"])) return false;
  return null;
}

export function detectCityFromList(text: string, cities: string[]): string | null {
  const normalized = normalizeText(text);
  const hit = cities.find((city) => normalized.includes(normalizeText(city)));
  return hit ?? null;
}

export function buildMissingQuestions(brief: LeadBrief): string[] {
  const questions: string[] = [];

  if (!brief.exact_date && !brief.date_window) questions.push("Exact date or date window?");
  if (!brief.city) questions.push("Preferred city or location?");
  if (brief.guest_count == null) questions.push("Approx guest count?");
  if (brief.budget_inr == null) questions.push("Approx budget?");
  if (!brief.style) questions.push("Preferred style or vibe?");
  if (brief.events_count == null) questions.push("How many events are you planning?");
  if (!brief.service_need.length) questions.push("Which services do you need: venue, decor, photography, or full planning?");
  if (brief.accommodation_required == null) questions.push("Do you need accommodation/rooms for guests or family?");
  if (!brief.food_preference) questions.push("Any food or catering preference?");
  if (!brief.must_haves.length) questions.push("Any must-haves or deal-breakers?");

  return questions.slice(0, 6);
}

export function scoreVenueFit(brief: LeadBrief, venue: Venue): number {
  let score = 0;

  const cityMatch =
    brief.city &&
    (normalizeText(brief.city) === normalizeText(venue.city) ||
      normalizeText(brief.city).includes(normalizeText(venue.city)) ||
      normalizeText(venue.city).includes(normalizeText(brief.city)));

  if (cityMatch) score += 22;

  if (brief.event_type && venue.event_types.includes(brief.event_type)) score += 14;

  if (brief.guest_count != null) {
    if (brief.guest_count >= venue.capacity.min && brief.guest_count <= venue.capacity.max) {
      score += 22;
    } else {
      const distance =
        brief.guest_count < venue.capacity.min
          ? venue.capacity.min - brief.guest_count
          : brief.guest_count - venue.capacity.max;

      const penalty = Math.min(18, Math.round(distance / 25));
      score += Math.max(0, 22 - penalty);
    }
  }

  if (brief.budget_inr != null) {
    if (brief.budget_inr >= venue.budget_range_inr.min && brief.budget_inr <= venue.budget_range_inr.max) {
      score += 20;
    } else {
      const distance =
        brief.budget_inr < venue.budget_range_inr.min
          ? venue.budget_range_inr.min - brief.budget_inr
          : brief.budget_inr - venue.budget_range_inr.max;

      const penalty = Math.min(18, Math.round(distance / 100000));
      score += Math.max(0, 20 - penalty);
    }
  }

  if (brief.style) {
    const style = normalizeText(brief.style);
    const venueStyles = [...venue.styles, ...venue.tags].map(normalizeText);
    const styleMatch = venueStyles.some((s) => s.includes(style) || style.includes(s));
    score += styleMatch ? 12 : 4;
  }

  const needs = brief.service_need;
  if (needs.includes("venue") && venue.recommended_for.includes("venue-only")) score += 5;
  if (needs.includes("decor") && venue.recommended_for.includes("decor")) score += 5;
  if (needs.includes("planning") && venue.recommended_for.includes("full planning")) score += 5;

  if (venue.availability_hint === "High") score += 5;
  if (venue.availability_hint === "Medium") score += 3;
  if (venue.availability_hint === "Low") score += 1;

  if (venue.rating >= 4.5) score += 4;
  if (venue.review_count >= 300) score += 3;

  return Math.max(0, Math.min(100, score));
}

export function explainVenueFit(brief: LeadBrief, venue: Venue): string {
  const pieces: string[] = [];

  if (brief.city) pieces.push(`${venue.city} fit`);
  if (brief.guest_count != null) pieces.push(`${venue.capacity.min}-${venue.capacity.max} capacity`);
  if (brief.budget_inr != null) pieces.push(`budget alignment`);
  if (brief.style) pieces.push(`style match`);
  if (brief.event_type && venue.event_types.includes(brief.event_type)) pieces.push(`${brief.event_type} friendly`);

  return pieces.length ? pieces.join(", ") : venue.usp;
}

export function rankVenuesForBrief(brief: LeadBrief, venues: Venue[]): Array<VenueMatch & { venue: Venue }> {
  return venues
    .map((venue) => {
      const fitScore = scoreVenueFit(brief, venue);
      const reason = explainVenueFit(brief, venue);
      const possibleIssue =
        brief.guest_count != null && (brief.guest_count < venue.capacity.min || brief.guest_count > venue.capacity.max)
          ? "Guest count may be slightly outside the ideal range."
          : brief.budget_inr != null &&
            (brief.budget_inr < venue.budget_range_inr.min || brief.budget_inr > venue.budget_range_inr.max)
            ? "Budget may need some flexibility."
            : null;

      return {
        venue,
        venue_id: venue.id,
        venue_name: venue.name,
        fit_score: fitScore,
        reason,
        possible_issue: possibleIssue
      };
    })
    .sort((a, b) => b.fit_score - a.fit_score);
}

export function buildBudgetSplit(brief: LeadBrief): {
  venue: string;
  decor: string;
  food: string;
  photo_video: string;
  misc: string;
} {
  const budget = brief.budget_inr ?? 0;

  if (!budget) {
    return {
      venue: "TBD",
      decor: "TBD",
      food: "TBD",
      photo_video: "TBD",
      misc: "TBD"
    };
  }

  const venuePct = brief.lead_type === "venue_only" ? 0.55 : 0.45;
  const decorPct = brief.service_need.includes("decor") ? 0.2 : 0.12;
  const photoPct = 0.08;
  const miscPct = 0.1;
  const foodPct = Math.max(0.05, 1 - venuePct - decorPct - photoPct - miscPct);

  const venueAmt = Math.round(budget * venuePct);
  const decorAmt = Math.round(budget * decorPct);
  const foodAmt = Math.round(budget * foodPct);
  const photoAmt = Math.round(budget * photoPct);
  const miscAmt = budget - venueAmt - decorAmt - foodAmt - photoAmt;

  return {
    venue: formatINR(venueAmt),
    decor: formatINR(decorAmt),
    food: formatINR(foodAmt),
    photo_video: formatINR(photoAmt),
    misc: formatINR(miscAmt)
  };
}

export function summarizeBrief(brief: LeadBrief): string {
  const parts = [
    brief.event_type ?? "event",
    brief.city ?? "location TBD",
    brief.guest_count ? `${brief.guest_count} guests` : "guest count TBD",
    brief.budget_inr ? `budget ${formatINR(brief.budget_inr)}` : "budget TBD"
  ];
  return parts.join(" • ");
}