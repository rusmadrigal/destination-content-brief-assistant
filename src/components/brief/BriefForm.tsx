"use client";

import type { ChangeEvent } from "react";
import {
  BUSINESS_GOAL_OPTIONS,
  CONTENT_TYPE_OPTIONS,
  SEASONALITY_OPTIONS,
  TARGET_AUDIENCE_OPTIONS,
} from "@/lib/briefs/options";
import type { DestinationBriefInput } from "@/lib/briefs/types";
import type { ValidationErrors } from "@/lib/briefs/validation";
import { SelectField, TextAreaField, TextField } from "./FormField";

interface BriefFormProps {
  value: DestinationBriefInput;
  errors: ValidationErrors;
  isGenerating: boolean;
  onChange: (next: DestinationBriefInput) => void;
  onGenerate: () => void;
  onClear: () => void;
}

export function BriefForm({ value, errors, isGenerating, onChange, onGenerate, onClear }: BriefFormProps) {
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
          placeholder="Asheville, NC"
          value={value.destinationName}
          error={errors.destinationName}
          onChange={handleInput("destinationName")}
        />

        <SelectField
          id="contentType"
          label="Content Type"
          required
          options={CONTENT_TYPE_OPTIONS}
          value={value.contentType}
          error={errors.contentType}
          onChange={handleInput("contentType")}
        />

        <TextField
          id="primaryKeyword"
          label="Primary Keyword"
          required
          placeholder="things to do in Asheville in fall"
          value={value.primaryKeyword}
          error={errors.primaryKeyword}
          onChange={handleInput("primaryKeyword")}
        />

        <TextAreaField
          id="secondaryQueries"
          label="Secondary Queries"
          helperText="One query per line."
          placeholder={"best fall activities in Asheville\nAsheville fall foliage\nfall events in Asheville"}
          value={value.secondaryQueries}
          onChange={handleInput("secondaryQueries")}
        />
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 text-xs font-semibold uppercase tracking-wider text-ai-cyan-400/80">
          Audience &amp; Strategy
        </legend>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField
            id="targetAudience"
            label="Target Audience"
            required
            options={TARGET_AUDIENCE_OPTIONS}
            value={value.targetAudience}
            error={errors.targetAudience}
            onChange={handleInput("targetAudience")}
          />
          <SelectField
            id="seasonality"
            label="Seasonality"
            options={SEASONALITY_OPTIONS}
            value={value.seasonality}
            onChange={handleInput("seasonality")}
          />
        </div>

        <SelectField
          id="businessGoal"
          label="Business Goal"
          required
          options={BUSINESS_GOAL_OPTIONS}
          value={value.businessGoal}
          error={errors.businessGoal}
          onChange={handleInput("businessGoal")}
        />

        <TextField
          id="ctaGoal"
          label="CTA Goal"
          helperText="The primary action you want readers to take."
          placeholder="Explore upcoming fall events"
          value={value.ctaGoal}
          onChange={handleInput("ctaGoal")}
        />
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
          onChange={handleInput("currentUrl")}
        />

        <TextAreaField
          id="competitorUrls"
          label="Competitor URLs"
          helperText="One URL per line."
          placeholder={"https://competitor-a.com/things-to-do/\nhttps://competitor-b.com/fall-guide/"}
          value={value.competitorUrls}
          onChange={handleInput("competitorUrls")}
        />

        <TextAreaField
          id="internalLinks"
          label="Internal Links"
          helperText="One URL per line. Leave blank to get recommended link categories."
          placeholder={"/things-to-do/\n/events/\n/restaurants/\n/places-to-stay/\n/itineraries/"}
          value={value.internalLinks}
          onChange={handleInput("internalLinks")}
        />
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 text-xs font-semibold uppercase tracking-wider text-ai-fuchsia-400/80">
          Voice &amp; Local Context
        </legend>

        <TextAreaField
          id="brandVoiceNotes"
          label="Brand Voice Notes"
          rows={3}
          placeholder="Friendly, local, practical, not overly promotional."
          value={value.brandVoiceNotes}
          onChange={handleInput("brandVoiceNotes")}
        />

        <TextAreaField
          id="localDetailsProvided"
          label="Local Details Provided"
          helperText="Known local places, events, and facts the brief can reference. If left blank, the brief will ask the team to validate local details instead of inventing them."
          rows={5}
          placeholder={"Blue Ridge Parkway\nRiver Arts District\nBiltmore Estate\nLocal breweries\nFall foliage usually peaks in October"}
          value={value.localDetailsProvided}
          onChange={handleInput("localDetailsProvided")}
        />
      </fieldset>

      <p className="text-center text-[11px] text-slate-600">
        Set <code className="rounded bg-white/5 px-1 py-0.5 text-ai-violet-300">OPENAI_API_KEY</code> in{" "}
        <code className="rounded bg-white/5 px-1 py-0.5 text-slate-400">.env.local</code> for AI-enhanced briefs.
      </p>

      <div className="sticky bottom-0 -mx-6 -mb-6 flex flex-wrap gap-3 border-t border-white/10 bg-[#0c0c14]/90 px-6 py-4 backdrop-blur-xl">
        <button
          type="submit"
          disabled={isGenerating}
          className="btn-ai-primary inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-ai-violet-400/50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Generating…
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
