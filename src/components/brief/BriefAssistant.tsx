"use client";

import { useEffect, useState } from "react";
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

  useFormDraftAutosave(input);

  useEffect(() => {
    const draft = loadFormDraft();
    if (draft) setInput(draft);
  }, []);

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

    setIsGenerating(true);
    setGenerateError(null);
    setGenerateNotice(null);

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
        setGenerateError("Invalid response from server.");
      }
    } catch {
      setBrief(generateDestinationBrief(input));
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
    clearFormDraft();
  }

  return (
    <div className="ai-mesh-bg relative min-h-screen">
      <div className="relative z-10">
        <Header />

        <main className="mx-auto w-full max-w-7xl px-4 pb-8 pt-6 sm:px-6 lg:px-8">
          {generateNotice && (
            <div
              className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200"
              role="status"
            >
              <span className="mt-0.5 shrink-0 text-amber-400">◇</span>
              <p>{generateNotice}</p>
            </div>
          )}

          {generateError && (
            <div
              className="mb-6 flex items-start gap-3 rounded-xl border border-ai-fuchsia-500/30 bg-ai-fuchsia-500/10 px-4 py-3 text-sm text-ai-fuchsia-200"
              role="status"
            >
              <span className="mt-0.5 shrink-0 text-ai-fuchsia-400">◇</span>
              <p>{generateError}</p>
            </div>
          )}

          {hasErrors(errors) && (
            <div
              className="mb-6 flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300 backdrop-blur"
              role="alert"
            >
              <span className="mt-0.5 font-semibold text-rose-400">!</span>
              <p>Please complete all required fields before generating a brief. Required fields are marked with an asterisk.</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
            <div className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:self-start lg:overflow-y-auto">
              <div className="glow-border brief-scroll">
                <div className="glow-border-inner p-6">
                  <div className="mb-5 flex items-center gap-2">
                    <span className="rounded-full bg-ai-violet-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ai-violet-400">
                      Inputs
                    </span>
                    <h2 className="text-base font-semibold text-slate-100">Content Brief Inputs</h2>
                  </div>
                  <p className="mb-5 text-sm text-slate-500">
                    Provide your SEO and planning details. Required fields are marked with an asterisk.
                  </p>
                  <BriefForm
                    value={input}
                    errors={errors}
                    warnings={warnings}
                    templateOnly={templateOnly}
                    isGenerating={isGenerating}
                    onChange={handleChange}
                    onTemplateOnlyChange={setTemplateOnly}
                    onGenerate={handleGenerate}
                    onClear={handleClear}
                  />
                </div>
              </div>
            </div>

            <div>
              <BriefOutput brief={brief} isGenerating={isGenerating} source={briefSource} />
            </div>
          </div>
        </main>

        <AppFooter />
      </div>
    </div>
  );
}

function AiSparkleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-white">
      <path
        d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
        fill="currentColor"
        opacity="0.95"
      />
      <path
        d="M19 3L19.6 5.4L22 6L19.6 6.6L19 9L18.4 6.6L16 6L18.4 5.4L19 3Z"
        fill="currentColor"
        opacity="0.7"
      />
      <path
        d="M5 15L5.5 16.8L7.5 17.3L5.5 17.8L5 19.5L4.5 17.8L2.5 17.3L4.5 16.8L5 15Z"
        fill="currentColor"
        opacity="0.6"
      />
    </svg>
  );
}

function Header() {
  return (
    <header className="glass-panel-strong sticky top-0 z-20 border-b border-white/10">
      <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-ai-violet-600 via-indigo-500 to-ai-cyan-500 shadow-lg shadow-ai-violet-500/30">
              <AiSparkleIcon />
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-ai-cyan-400 ai-pulse-dot ring-2 ring-[#06060b]" />
            </div>
            <div>
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-ai-violet-500/30 bg-ai-violet-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ai-violet-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-ai-cyan-400 ai-pulse-dot" />
                  AI-assisted
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                  Simpleview · DMO
                </span>
              </div>
              <h1 className="text-xl font-semibold tracking-tight text-gradient-ai sm:text-2xl">
                Destination Content Brief Assistant
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-400">
                Create SEO-informed content briefs for DMO teams. Strategic planning, not final AI-written copy.
              </p>
            </div>
          </div>
          <div className="shrink-0">
            <span className="inline-flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-xs text-slate-400 backdrop-blur">
              <span className="mt-0.5 text-ai-cyan-400">◇</span>
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
