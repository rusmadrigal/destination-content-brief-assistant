"use client";

import { useEffect, useState } from "react";
import {
  buildPlanningSheetRow,
  getPlanningSheetColumnLabel,
  getPlanningSheetColumnValue,
  type PlanningSheetColumnKey,
} from "@/lib/briefs/planningSheetExport";
import type { DestinationBrief, DestinationBriefInput } from "@/lib/briefs/types";
import { Badge } from "./BriefSection";

interface PlanningSheetExportProps {
  brief: DestinationBrief;
  input: DestinationBriefInput;
}

const COLUMN_ORDER: PlanningSheetColumnKey[] = [
  "topic",
  "contentType",
  "url",
  "targetKeywords",
  "headersTopics",
  "internalLinks",
];

async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }
}

export function PlanningSheetExport({ brief, input }: PlanningSheetExportProps) {
  const row = buildPlanningSheetRow(brief, input);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!copiedKey) return;
    const timer = setTimeout(() => setCopiedKey(null), 2000);
    return () => clearTimeout(timer);
  }, [copiedKey]);

  async function handleCopy(key: string, value: string) {
    await copyText(value);
    setCopiedKey(key);
  }

  return (
    <section className="glass-panel rounded-2xl border border-granicus-teal/60 bg-granicus-teal-soft/30 p-5">
      <div className="mb-4">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge tone="cyan">Planning Sheet</Badge>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Excel columns B–G
          </span>
        </div>
        <h3 className="text-sm font-semibold text-granicus-navy">Export to Content Planning Sheet</h3>
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500">
          Copy a row formatted for the Premium Content Planning spreadsheet. Paste starting at column B
          in your quarterly sheet. Leave Client Feedback (H) and Status (I) for the client workflow.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {COLUMN_ORDER.map((key) => (
          <PlanningColumnPreview
            key={key}
            label={getPlanningSheetColumnLabel(key)}
            value={getPlanningSheetColumnValue(row, key)}
            copied={copiedKey === key}
            onCopy={() => handleCopy(key, getPlanningSheetColumnValue(row, key))}
          />
        ))}
      </div>
    </section>
  );
}

function PlanningColumnPreview({
  label,
  value,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  const isLong = value.length > 180;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-granicus-red">{label}</p>
        <button
          type="button"
          onClick={onCopy}
          className="shrink-0 text-[11px] font-medium text-granicus-blue hover:text-granicus-navy"
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>
      <pre
        className={`whitespace-pre-wrap font-sans text-xs leading-relaxed text-slate-700 ${isLong ? "max-h-40 overflow-y-auto brief-scroll pr-1" : ""}`}
      >
        {value}
      </pre>
    </div>
  );
}
