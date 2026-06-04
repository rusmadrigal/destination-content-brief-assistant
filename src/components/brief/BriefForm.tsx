"use client";

import type { ChangeEvent } from "react";
import {
  BUSINESS_GOAL_OPTIONS,
  CONTENT_TYPE_OPTIONS,
  SEASONALITY_OPTIONS,
  TARGET_AUDIENCE_OPTIONS,
} from "@/lib/briefs/options";
import type { BriefInputSuggestions, SuggestionFieldKey } from "@/lib/briefs/suggestTypes";
import { SUGGESTION_FIELD_LABELS } from "@/lib/briefs/suggestTypes";
import type { DestinationBriefInput } from "@/lib/briefs/types";
import type { ValidationErrors, ValidationWarnings } from "@/lib/briefs/validation";
import { BriefSuggestionsPanel, FieldSuggestionChip } from "./BriefSuggestionsPanel";
import { SelectField, TextAreaField, TextField } from "./FormField";

interface BriefFormProps {
  value: DestinationBriefInput;
  errors: ValidationErrors;
  warnings: ValidationWarnings;
  suggestions: BriefInputSuggestions | null;
  suggestionsLoading: boolean;
  templateOnly: boolean;
  isGenerating: boolean;
  onChange: (next: DestinationBriefInput) => void;
  onTemplateOnlyChange: (checked: boolean) => void;
  onApplySuggestionField: (field: SuggestionFieldKey) => void;
  onApplyAllSuggestions: () => void;
  onDismissSuggestions: () => void;
  onGenerate: () => void;
  onClear: () => void;
}

export function BriefForm({
  value,
  errors,
  warnings,
  suggestions,
  suggestionsLoading,
  templateOnly,
  isGenerating,
  onChange,
  onTemplateOnlyChange,
  onApplySuggestionField,
  onApplyAllSuggestions,
  onDismissSuggestions,
  onGenerate,
  onClear,
}: BriefFormProps) {
  function update<K extends keyof DestinationBriefInput>(key: K, fieldValue: DestinationBriefInput[K]) {
    onChange({ ...value, [key]: fieldValue });
  }

  function handleInput(key: keyof DestinationBriefInput) {
    return (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      update(key, e.target.value as DestinationBriefInput[typeof key]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onGenerate();
  }

  function chip(field: SuggestionFieldKey) {
    if (!suggestions) return null;
    const suggested = suggestions[field];
    if (typeof suggested !== "string" || !suggested.trim()) return null;
    const current = value[field];
    if (typeof current === "string" && current.trim() === suggested.trim()) return null;
    return (
      <FieldSuggestionChip
        label={SUGGESTION_FIELD_LABELS[field]}
        suggestedValue={suggested}
        onApply={() => onApplySuggestionField(field)}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 text-xs font-semibold uppercase tracking-wider text-ai-violet-400/80">
          Destination &amp; Content
        </legend>

        <TextField
          id="destinationName"
          label="Destination Name"
          required
          placeholder="Panama City Beach, FL"
          value={value.destinationName}
          error={errors.destinationName}
          onChange={handleInput("destinationName")}
        />

        <BriefSuggestionsPanel
          destination={value.destinationName}
          suggestions={suggestions}
          isLoading={suggestionsLoading}
          onApplyAll={onApplyAllSuggestions}
          onApplyField={onApplySuggestionField}
          onDismiss={onDismissSuggestions}
        />

        <div>
          <SelectField
            id="contentType"
            label="Content Type"
            required
            options={CONTENT_TYPE_OPTIONS}
            value={value.contentType}
            error={errors.contentType}
            onChange={handleInput("contentType")}
          />
          {chip("contentType")}
        </div>

        <div>
          <TextField
            id="primaryKeyword"
            label="Primary Keyword"
            required
            placeholder="things to do in Panama City Beach"
            value={value.primaryKeyword}
            error={errors.primaryKeyword}
            onChange={handleInput("primaryKeyword")}
          />
          {chip("primaryKeyword")}
        </div>

        <div>
          <TextAreaField
            id="secondaryQueries"
            label="Secondary Queries"
            helperText="One query per line."
            placeholder={"best beaches in Panama City Beach\nfamily activities in Panama City Beach"}
            value={value.secondaryQueries}
            onChange={handleInput("secondaryQueries")}
          />
          {chip("secondaryQueries")}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 text-xs font-semibold uppercase tracking-wider text-ai-cyan-400/80">
          Audience &amp; Strategy
        </legend>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <SelectField
              id="targetAudience"
              label="Target Audience"
              required
              options={TARGET_AUDIENCE_OPTIONS}
              value={value.targetAudience}
              error={errors.targetAudience}
              onChange={handleInput("targetAudience")}
            />
            {chip("targetAudience")}
          </div>
          <div>
            <SelectField
              id="seasonality"
              label="Seasonality"
              options={SEASONALITY_OPTIONS}
              value={value.seasonality}
              onChange={handleInput("seasonality")}
            />
            {chip("seasonality")}
          </div>
        </div>

        <div>
          <SelectField
            id="businessGoal"
            label="Business Goal"
            required
            options={BUSINESS_GOAL_OPTIONS}
            value={value.businessGoal}
            error={errors.businessGoal}
            onChange={handleInput("businessGoal")}
          />
          {chip("businessGoal")}
        </div>

        <div>
          <TextField
            id="ctaGoal"
            label="CTA Goal"
            helperText="The primary action you want readers to take."
            placeholder="Start planning your beach getaway"
            value={value.ctaGoal}
            onChange={handleInput("ctaGoal")}
          />
          {chip("ctaGoal")}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
          URLs &amp; Linking
        </legend>

        <TextField
          id="currentUrl"
          label="Current URL"
          helperText="Optional. The page being created or refreshed."
          placeholder="https://www.example.com/things-to-do/"
          value={value.currentUrl}
          warning={warnings.currentUrl}
          onChange={handleInput("currentUrl")}
        />

        <TextAreaField
          id="competitorUrls"
          label="Competitor URLs"
          helperText="One URL per line."
          placeholder={"https://competitor-a.com/things-to-do/\nhttps://competitor-b.com/fall-guide/"}
          value={value.competitorUrls}
          warning={warnings.competitorUrls}
          onChange={handleInput("competitorUrls")}
        />

        <div>
          <TextAreaField
            id="internalLinks"
            label="Internal Links"
            helperText="One URL or path per line. Leave blank to auto-discover at least 3 strategic links from your site."
            placeholder={"/things-to-do/\n/events/\n/restaurants/\n/places-to-stay/\n/itineraries/"}
            value={value.internalLinks}
            onChange={handleInput("internalLinks")}
          />
          {chip("internalLinks")}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 text-xs font-semibold uppercase tracking-wider text-ai-fuchsia-400/80">
          Voice &amp; Local Context
        </legend>

        <div>
          <TextAreaField
            id="brandVoiceNotes"
            label="Brand Voice Notes"
            rows={3}
            placeholder="Friendly, local, practical, not overly promotional."
            value={value.brandVoiceNotes}
            onChange={handleInput("brandVoiceNotes")}
          />
          {chip("brandVoiceNotes")}
        </div>

        <TextAreaField
          id="localDetailsProvided"
          label="Local Details Provided"
          helperText="Known local places, events, and facts the brief can reference. If left blank, the brief will ask the team to validate local details instead of inventing them."
          rows={5}
          placeholder={"Pier Park\nSt. Andrews State Park\nLocal seafood spots (add names your team approves)"}
          value={value.localDetailsProvided}
          onChange={handleInput("localDetailsProvided")}
        />
      </fieldset>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-3">
        <input
          type="checkbox"
          checked={templateOnly}
          onChange={(e) => onTemplateOnlyChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 text-ai-violet-500 focus:ring-ai-violet-500/40"
        />
        <span className="text-sm text-slate-300">
          <span className="font-medium text-slate-200">Template only</span>
          <span className="mt-0.5 block text-xs text-slate-500">
            Skip OpenAI for brief generation and field suggestions.
          </span>
        </span>
      </label>

      <div className="sticky bottom-0 -mx-6 -mb-6 flex flex-wrap gap-3 border-t border-white/10 bg-[#0c0c14]/90 px-6 py-4 backdrop-blur-xl">
        <button
          type="submit"
          disabled={isGenerating}
          className="btn-ai-primary inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-ai-violet-400/50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <span className="inline-flex h-4 w-4 items-center justify-center text-white/90 tourism-btn-plane" aria-hidden="true">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                  <path d="M21 8L3 14l4 1.5-1 4 2-1 3-3 4 1 1-3 4-1.5-1.5 4 2-1 6-10z" />
                </svg>
              </span>
              Planning your route…
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              Generate Brief
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onClear}
          disabled={isGenerating}
          className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-300 transition-colors hover:border-white/20 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Clear Form
        </button>
      </div>
    </form>
  );
}
