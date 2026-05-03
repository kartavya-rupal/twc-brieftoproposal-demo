"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function LeadForm({
    onSubmit,
    loading,
    buttonLabel
}: {
    onSubmit: (message: string) => void;
    loading: boolean;
    buttonLabel?: string;
}) {
    const [message, setMessage] = useState("");

    return (
        <div className="w-full space-y-4">
            <textarea
                className="w-full min-h-[120px] p-3 border rounded-xl"
                placeholder="Describe your wedding requirement... (e.g. Feb Delhi 250 guests 20L palace vibe)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
            />

            <Button
                disabled={!message.trim() || loading}
                onClick={() => onSubmit(message)}
            >
                {/* ✅ FIX: dynamic label */}
                {buttonLabel || (loading ? "Processing..." : "Extract Brief")}
            </Button>
        </div>
    );
}