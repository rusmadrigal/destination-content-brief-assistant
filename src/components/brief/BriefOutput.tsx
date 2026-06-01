"use client";

import { useEffect, useState } from "react";
import { buildBriefFilename } from "@/lib/briefs/generateDestinationBrief";
import type { DestinationBrief } from "@/lib/briefs/types";
import { Badge, BriefSection, BulletList, CheckList, KeyValueGrid } from "./BriefSection";

interface BriefOutputProps {
  brief: DestinationBrief | null;
  isGenerating: boolean;
}

export function BriefOutput({ brief, isGenerating }: BriefOutputProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function handleCopy() {
    if (!brief) return;
    try {
      await navigator.clipboard.writeText(brief.markdownOutput);
      setCopied(true);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = brief.markdownOutput;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
    }
  }

  function handleDownload() {
    if (!brief) return;
    const filename = buildBriefFilename(brief.overview.destination, brief.overview.primaryKeyword);
    const blob = new Blob([brief.markdownOutput], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  if (isGenerating && !brief) {
    return <GeneratingState />;
  }

  if (!brief) {
    return <EmptyState />;
  }

  const o = brief.overview;

  return (
    <div className="flex flex-col gap-4">
      <div className="glass-panel-strong sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-ai-cyan-400">Generated brief</p>
          <p className="text-sm font-semibold text-slate-100">{o.destination}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-ai-violet-500/40 hover:bg-ai-violet-500/10 focus:outline-none focus:ring-2 focus:ring-ai-violet-500/30"
          >
            {copied ? (
              <span className="text-ai-cyan-400">Copied ✓</span>
            ) : (
              "Copy Brief"
            )}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="btn-ai-primary inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-ai-cyan-400/40"
          >
            Download Markdown
          </button>
        </div>
      </div>

      <BriefSection index={1} title="Brief Overview">
        <KeyValueGrid
          items={[
            { label: "Destination", value: o.destination },
            { label: "Content type", value: o.contentType },
            { label: "Primary keyword", value: o.primaryKeyword },
            { label: "Audience", value: o.audience },
            { label: "Seasonality", value: o.seasonality },
            { label: "Business goal", value: o.businessGoal },
            { label: "CTA goal", value: o.ctaGoal || "Not provided" },
          ]}
        />
      </BriefSection>

      <BriefSection index={2} title="Strategic Objective">
        <p className="text-slate-300">{brief.strategicObjective}</p>
      </BriefSection>

      <BriefSection index={3} title="Search Intent Analysis">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge tone="violet">Primary: {brief.searchIntent.primaryIntent}</Badge>
          {brief.searchIntent.supportingIntents.map((intent) => (
            <Badge key={intent} tone="slate">
              {intent}
            </Badge>
          ))}
        </div>
        <p className="text-slate-300">{brief.searchIntent.explanation}</p>
      </BriefSection>

      <BriefSection index={4} title="Recommended H1">
        <BulletList items={brief.h1Options} />
      </BriefSection>

      <BriefSection index={5} title="Recommended Title Tags">
        <BulletList items={brief.titleTagOptions.map((t) => <span key={t}>{t}</span>)} />
      </BriefSection>

      <BriefSection index={6} title="Recommended Meta Descriptions">
        <BulletList items={brief.metaDescriptionOptions.map((m) => <span key={m}>{m}</span>)} />
      </BriefSection>

      <BriefSection index={7} title="Recommended Page Structure">
        <ul className="flex flex-col gap-2 font-mono text-xs">
          {brief.recommendedStructure.map((s, i) => (
            <li
              key={`${s.heading}-${i}`}
              className={
                s.level === "H1"
                  ? "font-semibold text-slate-100"
                  : s.level === "H2"
                    ? "text-slate-300"
                    : "pl-6 text-slate-500"
              }
            >
              <span className="mr-2 inline-block rounded-md border border-white/10 bg-ai-violet-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-ai-violet-300">
                {s.level}
              </span>
              {s.heading}
              {s.notes && <span className="ml-1 font-sans italic text-slate-500">— {s.notes}</span>}
            </li>
          ))}
        </ul>
      </BriefSection>

      <BriefSection index={8} title="Secondary Query Mapping">
        {brief.secondaryQueryMapping.length === 0 ? (
          <p className="italic text-slate-500">No secondary queries provided.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {brief.secondaryQueryMapping.map((m, i) => (
              <li
                key={i}
                className="flex flex-col gap-1 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="text-slate-300">&ldquo;{m.query}&rdquo;</span>
                <Badge tone="cyan">{m.suggestedSection}</Badge>
              </li>
            ))}
          </ul>
        )}
      </BriefSection>

      <BriefSection index={9} title="Local Knowledge Needed">
        {brief.localKnowledgeNeeded.detailsProvided.length > 0 ? (
          <div className="mb-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ai-cyan-400">Local Details Provided</p>
            <BulletList items={brief.localKnowledgeNeeded.detailsProvided} />
            <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wider text-ai-fuchsia-400">
              Additional Local Details to Confirm
            </p>
          </div>
        ) : (
          <div className="mb-3 rounded-xl border border-ai-fuchsia-500/25 bg-ai-fuchsia-500/10 px-3 py-2.5 text-xs text-ai-fuchsia-300">
            No local details were provided. Do not invent local specifics — validate the checklist below with a local
            stakeholder before writing.
          </div>
        )}
        <CheckList items={brief.localKnowledgeNeeded.additionalToConfirm} />
      </BriefSection>

      <BriefSection index={10} title="Internal Linking Recommendations">
        {brief.internalLinkRecommendations[0]?.source === "suggested-category" && (
          <p className="mb-3 text-xs italic text-slate-500">
            No internal links provided — recommended categories below (no URLs invented).
          </p>
        )}
        <ul className="flex flex-col gap-2">
          {brief.internalLinkRecommendations.map((r, i) => (
            <li key={i} className="flex flex-col gap-0.5 rounded-lg border border-white/5 px-2 py-1.5">
              <span className="font-medium text-slate-200">
                {r.link}
                {r.source === "suggested-category" && (
                  <span className="ml-2">
                    <Badge tone="slate">category</Badge>
                  </span>
                )}
              </span>
              <span className="text-xs text-slate-500">{r.placement}</span>
            </li>
          ))}
        </ul>
      </BriefSection>

      <BriefSection index={11} title="Schema Recommendations">
        <ul className="flex flex-col gap-2">
          {brief.schemaRecommendations.map((s) => (
            <li key={s.type} className="flex flex-col gap-1 sm:flex-row sm:gap-3">
              <span className="shrink-0">
                <Badge tone="cyan">{s.type}</Badge>
              </span>
              <span className="text-xs text-slate-500">{s.reason}</span>
            </li>
          ))}
        </ul>
      </BriefSection>

      <BriefSection index={12} title="FAQ Suggestions">
        <BulletList items={brief.faqSuggestions} />
      </BriefSection>

      <BriefSection index={13} title="AI Search Readiness Notes">
        <div className="rounded-xl border border-ai-cyan-500/20 bg-ai-cyan-500/5 p-3">
          <BulletList items={brief.aiSearchReadinessNotes} />
        </div>
      </BriefSection>

      <BriefSection index={14} title="Editorial Guidelines">
        <BulletList items={brief.editorialGuidelines} />
      </BriefSection>

      <BriefSection index={15} title="Risks and Watchouts">
        <BulletList items={brief.risksAndWatchouts} />
      </BriefSection>

      <BriefSection index={16} title="Final Writer Checklist">
        <CheckList items={brief.finalWriterChecklist} />
      </BriefSection>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="relative flex min-h-[420px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-48 w-48 rounded-full bg-ai-violet-500/20 blur-3xl" />
        <div className="absolute h-32 w-32 translate-x-16 rounded-full bg-ai-cyan-500/15 blur-3xl" />
      </div>
      <div className="relative mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-ai-violet-500/20 to-ai-cyan-500/20">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-ai-violet-400">
          <path
            d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
            fill="currentColor"
          />
        </svg>
      </div>
      <h3 className="relative text-sm font-semibold text-slate-200">Ready to generate</h3>
      <p className="relative mt-2 max-w-sm text-sm text-slate-500">
        Complete the inputs and select{" "}
        <span className="font-medium text-ai-violet-300">Generate Brief</span> to produce a structured,
        SEO-informed content brief powered by deterministic AI planning.
      </p>
    </div>
  );
}

function GeneratingState() {
  return (
    <div className="relative flex min-h-[420px] flex-col items-center justify-center overflow-hidden rounded-2xl glass-panel p-10 text-center">
      <div className="pointer-events-none absolute inset-0 ai-shimmer" />
      <div className="relative mb-6">
        <div className="absolute inset-0 h-16 w-16 rounded-full bg-gradient-to-r from-ai-violet-500 to-ai-cyan-500 opacity-40 blur-xl ai-orbit" />
        <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-ai-cyan-400" />
        </span>
      </div>
      <h3 className="relative text-sm font-semibold text-gradient-ai">Generating brief…</h3>
      <p className="relative mt-2 text-sm text-slate-500">
        Assembling structure, search intent, and local validation prompts.
      </p>
      <div className="relative mt-6 flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-ai-violet-400 ai-pulse-dot"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );
}
