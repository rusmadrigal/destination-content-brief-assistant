"use client";

import { useEffect, useRef, useState } from "react";
import { GranicusDestinationsLogo } from "@/components/brand/GranicusDestinationsLogo";
import { generateDestinationBrief } from "@/lib/briefs/generateDestinationBrief";
import type { BriefGenerationSource } from "@/lib/briefs/generateBrief";
import { EMPTY_BRIEF_INPUT } from "@/lib/briefs/options";
import type { DestinationBrief, DestinationBriefInput } from "@/lib/briefs/types";
import {
  hasErrors,
  validateBriefInput,
  validateBriefWarnings,
  type ValidationErrors,
  type ValidationWarnings,
} from "@/lib/briefs/validation";
import {
  applySuggestionsToInput,
  type BriefInputSuggestions,
  type SuggestionFieldKey,
} from "@/lib/briefs/suggestTypes";
import {
  clearFormDraft,
  loadFormDraft,
  useFormDraftAutosave,
} from "@/lib/hooks/useFormDraft";
import { AppFooter } from "./AppFooter";
import { BriefForm } from "./BriefForm";
import { BriefOutput } from "./BriefOutput";

export function BriefAssistant() {
  const [input, setInput] = useState<DestinationBriefInput>({ ...EMPTY_BRIEF_INPUT });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [warnings, setWarnings] = useState<ValidationWarnings>({});
  const [templateOnly, setTemplateOnly] = useState(false);
  const [brief, setBrief] = useState<DestinationBrief | null>(null);
  const [briefSource, setBriefSource] = useState<BriefGenerationSource | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generateNotice, setGenerateNotice] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<BriefInputSuggestions | null>(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsDismissed, setSuggestionsDismissed] = useState(false);
  const suggestDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFormDraftAutosave(input);

  useEffect(() => {
    const draft = loadFormDraft();
    if (draft) setInput(draft);
  }, []);

  useEffect(() => {
    setSuggestionsDismissed(false);
  }, [input.destinationName]);

  useEffect(() => {
    const destination = input.destinationName.trim();
    if (destination.length < 3 || suggestionsDismissed) {
      setSuggestions(null);
      setSuggestionsLoading(false);
      return;
    }

    if (suggestDebounceRef.current) clearTimeout(suggestDebounceRef.current);
    suggestDebounceRef.current = setTimeout(async () => {
      setSuggestionsLoading(true);
      try {
        const response = await fetch("/api/suggest-inputs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            destinationName: destination,
            useOpenAI: !templateOnly,
          }),
        });
        const data = (await response.json()) as { suggestions?: BriefInputSuggestions };
        if (response.ok && data.suggestions) {
          setSuggestions(data.suggestions);
        }
      } catch {
        setSuggestions(null);
      } finally {
        setSuggestionsLoading(false);
      }
    }, 750);

    return () => {
      if (suggestDebounceRef.current) clearTimeout(suggestDebounceRef.current);
    };
  }, [input.destinationName, suggestionsDismissed, templateOnly]);

  function applySuggestionField(field: SuggestionFieldKey) {
    if (!suggestions) return;
    const suggested = suggestions[field];
    if (typeof suggested !== "string") return;
    setInput((prev) => ({ ...prev, [field]: suggested }));
  }

  function applyAllSuggestions() {
    if (!suggestions) return;
    setInput((prev) => applySuggestionsToInput(prev, suggestions));
  }

  function handleChange(next: DestinationBriefInput) {
    setInput(next);
    setWarnings(validateBriefWarnings(next));
    if (hasErrors(errors)) {
      setErrors(validateBriefInput(next));
    }
  }

  async function handleGenerate() {
    const validation = validateBriefInput(input);
    setErrors(validation);
    setWarnings(validateBriefWarnings(input));
    if (hasErrors(validation)) return;

    setGenerateError(null);
    setGenerateNotice(null);
    setBrief(null);
    setBriefSource(null);
    setIsGenerating(true);

    const instantBrief = generateDestinationBrief(input);

    if (templateOnly) {
      await waitForLoadingAnimation(1000);
      setBrief(instantBrief);
      setBriefSource("deterministic");
      setIsGenerating(false);
      return;
    }

    try {
      const response = await fetch("/api/generate-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, preferDeterministic: templateOnly }),
      });

      const data = (await response.json()) as {
        brief?: DestinationBrief;
        source?: BriefGenerationSource;
        openaiError?: string;
        error?: string;
      };

      if (!response.ok) {
        setBrief(instantBrief);
        setBriefSource("deterministic");
        setGenerateError(data.error ?? "Failed to generate brief.");
        return;
      }

      if (data.brief && data.source) {
        setBrief(data.brief);
        setBriefSource(data.source);
        if (data.openaiError && data.source === "deterministic" && !templateOnly) {
          setGenerateNotice(
            `OpenAI could not enhance this brief (${data.openaiError}). A template-based brief was used.`,
          );
        }
      } else {
        setBrief(instantBrief);
        setBriefSource("deterministic");
        setGenerateError("Invalid response from server.");
      }
    } catch {
      setBrief(instantBrief);
      setBriefSource("deterministic");
      setGenerateError(
        "Could not reach the server. A template-based brief was generated locally instead.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  function handleClear() {
    setInput({ ...EMPTY_BRIEF_INPUT });
    setErrors({});
    setWarnings({});
    setBrief(null);
    setBriefSource(null);
    setGenerateError(null);
    setGenerateNotice(null);
    setSuggestions(null);
    setSuggestionsDismissed(false);
    clearFormDraft();
  }

  return (
    <div className="ai-mesh-bg relative min-h-screen">
      <div className="relative z-10">
        <Header />

        <main className="mx-auto w-full max-w-7xl px-4 pb-8 pt-6 sm:px-6 lg:px-8">
          {generateNotice && (
            <div
              className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
              role="status"
            >
              <span className="mt-0.5 shrink-0 text-amber-600">◇</span>
              <p>{generateNotice}</p>
            </div>
          )}

          {generateError && (
            <div
              className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
              role="status"
            >
              <span className="mt-0.5 shrink-0 text-granicus-red">◇</span>
              <p>{generateError}</p>
            </div>
          )}

          {hasErrors(errors) && (
            <div
              className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              role="alert"
            >
              <span className="mt-0.5 font-semibold text-granicus-red">!</span>
              <p>Please complete all required fields before generating a brief. Required fields are marked with an asterisk.</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
            <div className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:self-start lg:overflow-y-auto">
              <div className="glow-border brief-scroll">
                <div className="glow-border-inner p-6">
                  <div className="mb-5 flex items-center gap-2">
                    <span className="rounded-full bg-granicus-red/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-granicus-red">
                      Inputs
                    </span>
                    <h2 className="text-base font-semibold text-granicus-navy">Content Brief Inputs</h2>
                  </div>
                  <p className="mb-5 text-sm text-slate-600">
                    Provide your SEO and planning details. Required fields are marked with an asterisk.
                  </p>
                  <BriefForm
                    value={input}
                    errors={errors}
                    warnings={warnings}
                    suggestions={suggestionsDismissed ? null : suggestions}
                    suggestionsLoading={suggestionsLoading && !suggestionsDismissed}
                    templateOnly={templateOnly}
                    isGenerating={isGenerating}
                    onChange={handleChange}
                    onTemplateOnlyChange={setTemplateOnly}
                    onApplySuggestionField={applySuggestionField}
                    onApplyAllSuggestions={applyAllSuggestions}
                    onDismissSuggestions={() => setSuggestionsDismissed(true)}
                    onGenerate={handleGenerate}
                    onClear={handleClear}
                  />
                </div>
              </div>
            </div>

            <div>
              <BriefOutput
                brief={brief}
                input={input}
                isGenerating={isGenerating}
                source={briefSource}
              />
            </div>
          </div>
        </main>

        <AppFooter />
      </div>
    </div>
  );
}

function waitForLoadingAnimation(minMs: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, minMs);
  });
}

function Header() {
  return (
    <header className="glass-panel-strong sticky top-0 z-20 border-b border-slate-200">
      <div className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <GranicusDestinationsLogo size="md" />
            <div className="hidden h-9 w-px bg-slate-200 sm:block sm:h-10" aria-hidden="true" />
            <div className="min-w-0">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-granicus-red/20 bg-granicus-red/5 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-granicus-red">
                  <span className="h-1.5 w-1.5 rounded-full bg-granicus-red ai-pulse-dot" />
                  AI-assisted
                </span>
                <span className="rounded-full border border-slate-200 bg-granicus-teal-soft px-2 py-0.5 text-[10px] font-medium text-granicus-navy">
                  DMO Content Planning
                </span>
              </div>
              <h1 className="text-xl font-semibold tracking-tight text-granicus-navy sm:text-2xl">
                Content Brief Assistant
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-600">
                Create SEO-informed content briefs for destination marketing teams. Strategic planning, not final
                AI-written copy.
              </p>
            </div>
          </div>
          <div className="shrink-0">
            <span className="inline-flex items-start gap-2 rounded-xl border border-slate-200 bg-granicus-teal-soft/60 px-3 py-2.5 text-xs text-slate-600">
              <span className="mt-0.5 text-granicus-blue">◇</span>
              <span className="max-w-xs leading-relaxed">
                Briefs are planning outputs. Final content should be written or reviewed by local experts.
              </span>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
