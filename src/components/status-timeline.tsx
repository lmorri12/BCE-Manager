"use client";

import { Check } from "lucide-react";

const STAGES = [
  { key: "ENQUIRY", label: "Enquiry" },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "IN_PROGRESS", label: "Staff" },
  { key: "READY", label: "Ready" },
  { key: "POST_EVENT", label: "Post Event" },
  { key: "CLOSED", label: "Closed" },
];

export function StatusTimeline({ status }: { status: string }) {
  const currentIndex = STAGES.findIndex((s) => s.key === status);

  return (
    <div className="flex items-center w-full">
      {STAGES.map((stage, i) => {
        const isPast = i < currentIndex;
        const isCurrent = i === currentIndex;

        return (
          <div key={stage.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`
                  flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold shrink-0 transition-all duration-300
                  ${isPast ? "bg-[var(--success)] text-white shadow-sm" : ""}
                  ${isCurrent ? "bg-[var(--primary)] text-white ring-4 ring-[var(--primary)]/20 shadow-sm" : ""}
                  ${!isPast && !isCurrent ? "bg-[var(--muted)] text-[var(--muted-foreground)] border border-[var(--border)]" : ""}
                `}
              >
                {isPast ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
              </div>
              <span
                className={`text-[10px] mt-1.5 whitespace-nowrap font-medium ${
                  isCurrent ? "text-[var(--primary)]" : isPast ? "text-[var(--success)]" : "text-[var(--muted-foreground)]"
                }`}
              >
                {stage.label}
              </span>
            </div>
            {i < STAGES.length - 1 && (
              <div
                className={`h-[2px] flex-1 mx-2 rounded-full transition-colors duration-300 ${
                  i < currentIndex ? "bg-[var(--success)]" : "bg-[var(--border)]"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
