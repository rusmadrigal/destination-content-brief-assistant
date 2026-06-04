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
      <div className="rounded-xl border border-granicus-red/20 bg-granicus-red/5 px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-granicus-navy">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-granicus-red/20 border-t-granicus-red" />
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
    <div className="rounded-xl border border-granicus-blue/25 bg-gradient-to-br from-granicus-teal-soft to-white px-4 py-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-granicus-blue">
            <span className="h-1.5 w-1.5 rounded-full bg-granicus-blue ai-pulse-dot" />
            AI field suggestions
          </p>
          <p className="mt-1 text-sm text-slate-600">
            For <span className="font-medium text-granicus-navy">{destination}</span>
            {suggestions.source === "openai" ? (
              <span className="ml-2 rounded-full bg-granicus-red/10 px-2 py-0.5 text-[10px] text-granicus-red">
                OpenAI
              </span>
            ) : (
              <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
                Smart template
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="text-xs text-slate-500 hover:text-granicus-navy"
          aria-label="Dismiss suggestions"
        >
          Dismiss
        </button>
      </div>

      {suggestions.contextHints.length > 0 && (
        <ul className="mb-3 space-y-1 text-xs text-slate-500">
          {suggestions.contextHints.map((hint) => (
            <li key={hint} className="flex gap-2">
              <span className="text-granicus-red">→</span>
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
            className="group rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-left transition-colors hover:border-granicus-blue/40 hover:bg-granicus-blue/5"
            title={String(value)}
          >
            <span className="block text-[10px] font-medium uppercase tracking-wide text-slate-500">{label}</span>
            <span className="block max-w-[200px] truncate text-xs text-granicus-navy group-hover:text-granicus-blue">
              {value}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onApplyAll}
          className="rounded-full bg-granicus-red px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-granicus-red-dark"
        >
          Apply all to empty fields
        </button>
        <button
          type="button"
          onClick={() => onApplyField("secondaryQueries")}
          className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:border-slate-300 hover:text-granicus-navy"
        >
          + Secondary queries
        </button>
        <button
          type="button"
          onClick={() => onApplyField("internalLinks")}
          className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:border-slate-300 hover:text-granicus-navy"
        >
          + Internal links
        </button>
      </div>

      <p className="mt-2 text-[10px] text-slate-500">
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
      className="mt-1 flex w-full items-center gap-2 rounded-lg border border-dashed border-granicus-blue/30 bg-granicus-blue/5 px-2 py-1.5 text-left text-xs text-granicus-navy transition-colors hover:border-granicus-blue/50 hover:bg-granicus-blue/10"
    >
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-granicus-blue">AI</span>
      <span className="truncate">
        {label}: {preview}
      </span>
    </button>
  );
}
