"use client";

export default function QuestionChip({ text }: { text: string }) {
    return (
        <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">
            {text}
        </span>
    );
}