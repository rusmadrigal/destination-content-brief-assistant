"use client";

import { useEffect, useState } from "react";
import {
  buildPlanningSheetRow,
  formatPlanningSheetRowTsv,
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
    <section className="glass-panel rounded-2xl border border-ai-cyan-500/20 p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge tone="cyan">Planning Sheet</Badge>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Excel columns B–G
            </span>
          </div>
          <h3 className="text-sm font-semibold text-slate-100">Export to Content Planning Sheet</h3>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500">
            Copy a row formatted for the Premium Content Planning spreadsheet. Paste starting at column B
            in your quarterly sheet. Leave Client Feedback (H) and Status (I) for the client workflow.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CopyButton
            label={copiedKey === "row" ? "Row copied ✓" : "Copy Excel Row"}
            onClick={() => handleCopy("row", formatPlanningSheetRowTsv(row))}
            primary
          />
          <CopyButton
            label={copiedKey === "headersTopics" ? "Column F copied ✓" : "Copy Column F"}
            onClick={() => handleCopy("headersTopics", row.headersTopics)}
          />
        </div>
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

function CopyButton({
  label,
  onClick,
  primary = false,
}: {
  label: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        primary
          ? "btn-ai-primary inline-flex items-center rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-ai-cyan-400/40"
          : "inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-ai-violet-500/40 hover:bg-ai-violet-500/10 focus:outline-none focus:ring-2 focus:ring-ai-violet-500/30"
      }
    >
      {label}
    </button>
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
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-ai-violet-300">{label}</p>
        <button
          type="button"
          onClick={onCopy}
          className="shrink-0 text-[11px] font-medium text-ai-cyan-400 hover:text-ai-cyan-300"
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>
      <pre
        className={`whitespace-pre-wrap font-sans text-xs leading-relaxed text-slate-300 ${isLong ? "max-h-40 overflow-y-auto brief-scroll pr-1" : ""}`}
      >
        {value}
      </pre>
    </div>
  );
}
