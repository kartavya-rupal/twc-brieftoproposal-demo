"use client";

import { LeadBrief } from "@/lib/types";


export default function BriefPreview({ brief }: { brief: LeadBrief }) {
    if (!brief) return null;

    return (
        <div className="border rounded-xl p-4 space-y-2">
            <h2 className="text-lg font-semibold">Extracted Brief</h2>

            <div><b>Event:</b> {brief.event_type ?? "N/A"}</div>
            <div><b>City:</b> {brief.city ?? "N/A"}</div>
            <div><b>Guests:</b> {brief.guest_count ?? "N/A"}</div>
            <div><b>Budget:</b> {brief.budget_inr ?? "N/A"}</div>
            <div><b>Style:</b> {brief.style ?? "N/A"}</div>
            <div><b>Services:</b> {brief.service_need.join(", ") || "N/A"}</div>
            <div><b>Lead Type:</b> {brief.lead_type}</div>
            <div><b>Urgency:</b> {brief.urgency}</div>
        </div>
    );
}