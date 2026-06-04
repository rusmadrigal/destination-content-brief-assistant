"use client";

import { useEffect, useState } from "react";
import type { BriefGenerationSource } from "@/lib/briefs/generateBrief";
import type { DestinationBrief, DestinationBriefInput } from "@/lib/briefs/types";
import { Badge, BriefSection, BulletList, CheckList, KeyValueGrid } from "./BriefSection";
import { PlanningSheetExport } from "./PlanningSheetExport";
import { TourismLoading } from "./TourismLoading";

interface BriefOutputProps {
  brief: DestinationBrief | null;
  input: DestinationBriefInput;
  isGenerating: boolean;
  source: BriefGenerationSource | null;
}

export function BriefOutput({ brief, input, isGenerating, source }: BriefOutputProps) {
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

  if (isGenerating) {
    return (
      <div className="relative min-h-[420px] overflow-hidden rounded-2xl glass-panel">
        <TourismLoading
          title="Generating your brief"
          subtitle="Assembling keywords, page structure, and planning sheet export for your destination."
        />
      </div>
    );
  }

  if (!brief) {
    return <EmptyState />;
  }

  const o = brief.overview;

  return (
    <div className="relative flex flex-col gap-4">
      <div className="glass-panel-strong sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3">
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-granicus-blue">Generated brief</p>
            {source === "openai" ? (
              <Badge tone="violet">OpenAI enhanced</Badge>
            ) : (
              <Badge tone="slate">Template</Badge>
            )}
          </div>
          <p className="text-sm font-semibold text-granicus-navy">{o.destination}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-granicus-navy transition-colors hover:border-granicus-red/30 hover:bg-granicus-red/5 focus:outline-none focus:ring-2 focus:ring-granicus-red/20"
          >
            {copied ? (
              <span className="text-granicus-red">Copied ✓</span>
            ) : (
              "Copy Brief"
            )}
          </button>
        </div>
      </div>

      <PlanningSheetExport brief={brief} input={input} />

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
        <p className="text-slate-700">{brief.strategicObjective}</p>
      </BriefSection>

      <BriefSection index={3} title="Competitive & Content Refresh Notes">
        <BulletList items={brief.competitiveAndRefreshNotes} />
      </BriefSection>

      <BriefSection index={4} title="Simpleview Platform & Partner Notes">
        <BulletList items={brief.simpleviewPlatformNotes} />
      </BriefSection>

      <BriefSection index={5} title="Search Intent Analysis">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge tone="violet">Primary: {brief.searchIntent.primaryIntent}</Badge>
          {brief.searchIntent.supportingIntents.map((intent) => (
            <Badge key={intent} tone="slate">
              {intent}
            </Badge>
          ))}
        </div>
        <p className="text-slate-700">{brief.searchIntent.explanation}</p>
      </BriefSection>

      <BriefSection index={6} title="Recommended H1">
        <BulletList items={brief.h1Options} />
      </BriefSection>

      <BriefSection index={7} title="Recommended Title Tags">
        <BulletList items={brief.titleTagOptions.map((t) => <span key={t}>{t}</span>)} />
      </BriefSection>

      <BriefSection index={8} title="Recommended Meta Descriptions">
        <BulletList items={brief.metaDescriptionOptions.map((m) => <span key={m}>{m}</span>)} />
      </BriefSection>

      <BriefSection index={9} title="Recommended Page Structure">
        <ul className="flex flex-col gap-2 font-mono text-xs">
          {brief.recommendedStructure.map((s, i) => (
            <li
              key={`${s.heading}-${i}`}
              className={
                s.level === "H1"
                  ? "font-semibold text-granicus-navy"
                  : s.level === "H2"
                    ? "text-slate-700"
                    : "pl-6 text-slate-500"
              }
            >
              <span className="mr-2 inline-block rounded-md border border-granicus-red/20 bg-granicus-red/10 px-1.5 py-0.5 text-[10px] font-semibold text-granicus-red">
                {s.level}
              </span>
              {s.heading}
              {s.notes && <span className="ml-1 font-sans italic text-slate-500">({s.notes})</span>}
            </li>
          ))}
        </ul>
      </BriefSection>

      <BriefSection index={10} title="Secondary Query Mapping">
        {brief.secondaryQueryMapping.length === 0 ? (
          <p className="italic text-slate-500">No secondary queries provided.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {brief.secondaryQueryMapping.map((m, i) => (
              <li
                key={i}
                className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-granicus-teal-soft/30 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="text-slate-700">&ldquo;{m.query}&rdquo;</span>
                <Badge tone="cyan">{m.suggestedSection}</Badge>
              </li>
            ))}
          </ul>
        )}
      </BriefSection>

      <BriefSection index={11} title="Local Knowledge Needed">
        {brief.localKnowledgeNeeded.detailsProvided.length > 0 ? (
          <div className="mb-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-granicus-blue">Local Details Provided</p>
            <BulletList items={brief.localKnowledgeNeeded.detailsProvided} />
            <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wider text-granicus-red">
              Additional Local Details to Confirm
            </p>
          </div>
        ) : (
          <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
            No local details were provided. Do not invent local specifics. Validate the checklist below with a local
            stakeholder before writing.
          </div>
        )}
        <CheckList items={brief.localKnowledgeNeeded.additionalToConfirm} />
      </BriefSection>

      <BriefSection index={12} title="Internal Linking Recommendations">
        {brief.internalLinkRecommendations[0]?.source === "suggested-category" && (
          <p className="mb-3 text-xs italic text-slate-500">
            No internal links provided. Recommended categories below (no URLs invented).
          </p>
        )}
        {brief.internalLinkRecommendations.some((entry) => entry.source === "discovered-url") && (
          <p className="mb-3 text-xs italic text-slate-500">
            At least{" "}
            {brief.internalLinkRecommendations.filter((entry) => entry.source !== "suggested-category").length}{" "}
            strategic links from site crawl (navigation + in-page references prioritized). Verify each link before
            publishing.
          </p>
        )}
        {brief.internalLinkRecommendations.some((entry) => entry.source === "suggested-url") &&
          !brief.internalLinkRecommendations.some((entry) => entry.source === "discovered-url") && (
          <p className="mb-3 text-xs italic text-slate-500">
            Recommended on-site URLs inferred from your current page URL and content type. Verify each link before
            publishing.
          </p>
        )}
        <ul className="flex flex-col gap-2">
          {brief.internalLinkRecommendations.map((r, i) => (
            <li key={i} className="flex flex-col gap-0.5 rounded-lg border border-slate-200 bg-white px-2 py-1.5">
              <span className="font-medium text-granicus-navy">
                {r.link}
                {r.source === "suggested-category" && (
                  <span className="ml-2">
                    <Badge tone="slate">category</Badge>
                  </span>
                )}
                {r.source === "suggested-url" && (
                  <span className="ml-2">
                    <Badge tone="cyan">suggested URL</Badge>
                  </span>
                )}
                {r.source === "discovered-url" && (
                  <span className="ml-2">
                    <Badge tone="violet">from site</Badge>
                  </span>
                )}
              </span>
              <span className="text-xs text-slate-500">{r.placement}</span>
            </li>
          ))}
        </ul>
      </BriefSection>

      <BriefSection index={13} title="Schema Recommendations">
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

      <BriefSection index={14} title="FAQ Suggestions">
        <BulletList items={brief.faqSuggestions} />
      </BriefSection>

      <BriefSection index={15} title="AI Search Readiness Notes">
        <div className="rounded-xl border border-granicus-blue/20 bg-granicus-blue/5 p-3">
          <BulletList items={brief.aiSearchReadinessNotes} />
        </div>
      </BriefSection>

      <BriefSection index={16} title="Editorial Guidelines">
        <BulletList items={brief.editorialGuidelines} />
      </BriefSection>

      <BriefSection index={17} title="Risks and Watchouts">
        <BulletList items={brief.risksAndWatchouts} />
      </BriefSection>

      <BriefSection index={18} title="Final Writer Checklist">
        <CheckList items={brief.finalWriterChecklist} />
      </BriefSection>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="relative flex min-h-[420px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-granicus-teal-soft/40 p-10 text-center">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-48 w-48 rounded-full bg-granicus-red/10 blur-3xl" />
        <div className="absolute h-32 w-32 translate-x-16 rounded-full bg-granicus-blue/10 blur-3xl" />
      </div>
      <div className="relative mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-granicus-red">
          <path
            d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
            fill="currentColor"
          />
        </svg>
      </div>
      <h3 className="relative text-sm font-semibold text-granicus-navy">Ready to generate</h3>
      <p className="relative mt-2 max-w-sm text-sm text-slate-600">
        Complete the inputs and select{" "}
        <span className="font-medium text-granicus-red">Generate Brief</span> to produce a structured,
        SEO-informed content brief powered by deterministic AI planning.
      </p>
    </div>
  );
}
