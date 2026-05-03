"use client";

import type { ProposalResult } from "@/lib/types";
import QuestionChip from "./QuestionChip";

export default function ProposalPreview({
    proposal
}: {
    proposal: ProposalResult;
}) {
    if (!proposal) return null;

    return (
        <div className="border rounded-xl p-4 space-y-4">
            <h2 className="text-lg font-semibold">Proposal</h2>

            <div>
                <b>Summary:</b> {proposal.client_summary}
            </div>

            <div>
                <b>Requirements:</b> {proposal.requirements_summary}
            </div>

            <div>
                <b>Recommended Venues:</b>
                <ul className="list-disc ml-5">
                    {proposal.recommended_venues.map((v) => (
                        <li key={v.venue_id}>
                            <b>{v.venue_name}</b> ({v.fit_score})
                            <br />
                            {v.reason}
                            {v.possible_issue && (
                                <div className="text-red-500 text-sm">
                                    ⚠ {v.possible_issue}
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </div>

            <div>
                <b>Budget Split:</b>
                <ul className="ml-5">
                    <li>Venue: {proposal.budget_split_suggestion.venue}</li>
                    <li>Decor: {proposal.budget_split_suggestion.decor}</li>
                    <li>Food: {proposal.budget_split_suggestion.food}</li>
                    <li>Photo/Video: {proposal.budget_split_suggestion.photo_video}</li>
                    <li>Misc: {proposal.budget_split_suggestion.misc}</li>
                </ul>
            </div>

            <div>
                <b>Tradeoffs:</b>
                <ul className="list-disc ml-5">
                    {proposal.tradeoffs.map((t, i) => (
                        <li key={i}>{t}</li>
                    ))}
                </ul>
            </div>

            <div>
                <b>Follow-up Questions:</b>
                <div className="flex flex-wrap gap-2 mt-2">
                    {proposal.follow_up_questions.map((q, i) => (
                        <QuestionChip key={i} text={q} />
                    ))}
                </div>
            </div>

            <div>
                <b>WhatsApp Summary:</b>
                <div className="p-2 bg-green-50 rounded">{proposal.whatsapp_summary}</div>
            </div>
        </div>
    );
}