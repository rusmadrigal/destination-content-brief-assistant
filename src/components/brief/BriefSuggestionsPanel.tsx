"use client";

import type { BriefInputSuggestions, SuggestionFieldKey } from "@/lib/briefs/suggestTypes";
import { SUGGESTION_FIELD_LABELS } from "@/lib/briefs/suggestTypes";

interface BriefSuggestionsPanelProps {
  destination: string;
  suggestions: BriefInputSuggestions | null;
  isLoading: boolean;
  onApplyAll: () => void;
  onApplyField: (field: SuggestionFieldKey) => void;
  onDismiss: () => void;
}

export function BriefSuggestionsPanel({
  destination,
  suggestions,
  isLoading,
  onApplyAll,
  onApplyField,
  onDismiss,
}: BriefSuggestionsPanelProps) {
  if (!destination.trim() || destination.trim().length < 3) return null;

  if (isLoading) {
    return (
      <div className="rounded-xl border border-ai-violet-500/25 bg-ai-violet-500/10 px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-ai-violet-200">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-ai-violet-400/30 border-t-ai-violet-300" />
          Generating suggestions for {destination}…
        </div>
      </div>
    );
  }

  if (!suggestions) return null;

  const previewFields = (
    ["contentType", "primaryKeyword", "targetAudience", "seasonality", "businessGoal"] as SuggestionFieldKey[]
  ).map((key) => ({
    key,
    label: SUGGESTION_FIELD_LABELS[key],
    value: suggestions[key],
  }));

  return (
    <div className="rounded-xl border border-ai-cyan-500/25 bg-gradient-to-br from-ai-violet-500/10 to-ai-cyan-500/5 px-4 py-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ai-cyan-400">
            <span className="h-1.5 w-1.5 rounded-full bg-ai-cyan-400 ai-pulse-dot" />
            AI field suggestions
          </p>
          <p className="mt-1 text-sm text-slate-300">
            For <span className="font-medium text-slate-100">{destination}</span>
            {suggestions.source === "openai" ? (
              <span className="ml-2 rounded-full bg-ai-violet-500/20 px-2 py-0.5 text-[10px] text-ai-violet-300">
                OpenAI
              </span>
            ) : (
              <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-slate-500">
                Smart template
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="text-xs text-slate-500 hover:text-slate-300"
          aria-label="Dismiss suggestions"
        >
          Dismiss
        </button>
      </div>

      {suggestions.contextHints.length > 0 && (
        <ul className="mb-3 space-y-1 text-xs text-slate-500">
          {suggestions.contextHints.map((hint) => (
            <li key={hint} className="flex gap-2">
              <span className="text-ai-cyan-500">→</span>
              {hint}
            </li>
          ))}
        </ul>
      )}

      <div className="mb-3 flex flex-wrap gap-2">
        {previewFields.map(({ key, label, value }) => (
          <button
            key={key}
            type="button"
            onClick={() => onApplyField(key)}
            className="group rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-left transition-colors hover:border-ai-cyan-500/40 hover:bg-ai-cyan-500/10"
            title={String(value)}
          >
            <span className="block text-[10px] font-medium uppercase tracking-wide text-slate-500">{label}</span>
            <span className="block max-w-[200px] truncate text-xs text-slate-200 group-hover:text-ai-cyan-200">
              {value}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onApplyAll}
          className="rounded-lg bg-ai-violet-500/20 px-3 py-1.5 text-xs font-semibold text-ai-violet-200 transition-colors hover:bg-ai-violet-500/30"
        >
          Apply all to empty fields
        </button>
        <button
          type="button"
          onClick={() => onApplyField("secondaryQueries")}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-400 hover:border-white/20 hover:text-slate-200"
        >
          + Secondary queries
        </button>
        <button
          type="button"
          onClick={() => onApplyField("internalLinks")}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-400 hover:border-white/20 hover:text-slate-200"
        >
          + Internal links
        </button>
      </div>

      <p className="mt-2 text-[10px] text-slate-600">
        Suggestions are SEO planning patterns only. Add real local details yourself before generating the brief.
      </p>
    </div>
  );
}

/** Inline chip under a field when a suggestion differs from current value. */
export function FieldSuggestionChip({
  label,
  suggestedValue,
  onApply,
}: {
  label: string;
  suggestedValue: string;
  onApply: () => void;
}) {
  const preview = suggestedValue.length > 48 ? `${suggestedValue.slice(0, 48)}…` : suggestedValue;
  return (
    <button
      type="button"
      onClick={onApply}
      className="mt-1 flex w-full items-center gap-2 rounded-lg border border-dashed border-ai-cyan-500/30 bg-ai-cyan-500/5 px-2 py-1.5 text-left text-xs text-ai-cyan-300/90 transition-colors hover:border-ai-cyan-500/50 hover:bg-ai-cyan-500/10"
    >
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-ai-cyan-500">AI</span>
      <span className="truncate">
        {label}: {preview}
      </span>
    </button>
  );
}
