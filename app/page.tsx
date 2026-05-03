"use client";

import { useState } from "react";

import type { LeadExtractionResult, ProposalResult } from "@/lib/types";
import LeadForm from "@/components/LeadForm";
import BriefPreview from "@/components/BriefPreview";
import ProposalPreview from "@/components/ProposalPreview";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"idle" | "brief" | "proposal">("idle");

  const [briefData, setBriefData] = useState<LeadExtractionResult | null>(null);
  const [proposal, setProposal] = useState<ProposalResult | null>(null);

  // =========================
  // STEP 1: Extract Brief
  // =========================
  const handleExtractBrief = async (message: string) => {
    console.log("🚀 EXTRACT BRIEF START");

    try {
      setLoading(true);
      setStep("idle");
      setBriefData(null);
      setProposal(null);

      const res = await fetch("/api/extractbrief", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message })
      });

      console.log("📥 Extract Status:", res.status);

      if (!res.ok) {
        const err = await res.text();
        console.error("❌ Extract Error:", err);
        throw new Error("Failed to extract brief");
      }

      const data: LeadExtractionResult = await res.json();

      console.log("✅ Extracted Brief:", data);

      setBriefData(data);
      setStep("brief");
    } catch (err) {
      console.error("🔥 Extract Error:", err);
      alert("Something went wrong while extracting brief");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // STEP 2: Generate Proposal
  // =========================
  const handleGenerateProposal = async () => {
    if (!briefData) return;

    console.log("🚀 GENERATE PROPOSAL START");

    try {
      setLoading(true);

      const res = await fetch("/api/generateproposal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ brief: briefData.brief })
      });

      console.log("📥 Proposal Status:", res.status);

      if (!res.ok) {
        const err = await res.text();
        console.error("❌ Proposal Error:", err);
        throw new Error("Failed to generate proposal");
      }

      const data: ProposalResult = await res.json();

      console.log("✅ Proposal Generated:", data);

      setProposal(data);
      setStep("proposal");
    } catch (err) {
      console.error("🔥 Proposal Error:", err);
      alert("Something went wrong while generating proposal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">
        AI Wedding Planner Demo
      </h1>

      {/* INPUT */}
      <LeadForm
        onSubmit={handleExtractBrief}
        loading={loading}
        buttonLabel={loading ? "Extracting..." : "Extract Brief"}
      />

      {/* BRIEF VIEW */}
      {step === "brief" && briefData && (
        <div className="space-y-4">
          <BriefPreview brief={briefData.brief} />

          {briefData.missing_questions.length > 0 && (
            <div className="border rounded-xl p-4">
              <h3 className="font-semibold">Missing Info</h3>
              <ul className="list-disc ml-5">
                {briefData.missing_questions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>
          )}

          {/* ✅ SHOW ONLY AFTER BRIEF */}
          <button
            className="px-4 py-2 bg-black text-white rounded-lg"
            onClick={handleGenerateProposal}
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate Proposal"}
          </button>
        </div>
      )}

      {/* PROPOSAL VIEW */}
      {step === "proposal" && proposal && (
        <ProposalPreview proposal={proposal} />
      )}
    </main>
  );
}