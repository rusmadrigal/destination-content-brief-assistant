import type { ReactNode } from "react";

interface BriefSectionProps {
  index: number;
  title: string;
  children: ReactNode;
}

export function BriefSection({ index, title, children }: BriefSectionProps) {
  return (
    <section className="glass-panel rounded-2xl p-5 transition-colors hover:border-white/12">
      <div className="mb-3 flex items-center gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-ai-violet-500 to-ai-cyan-500 text-xs font-bold text-white shadow-lg shadow-ai-violet-500/25">
          {index}
        </span>
        <h3 className="text-sm font-semibold tracking-tight text-slate-100">{title}</h3>
      </div>
      <div className="text-sm leading-relaxed text-slate-400">{children}</div>
    </section>
  );
}

export function Badge({
  children,
  tone = "violet",
}: {
  children: ReactNode;
  tone?: "violet" | "slate" | "cyan" | "fuchsia";
}) {
  const tones: Record<string, string> = {
    violet: "bg-ai-violet-500/15 text-ai-violet-400 ring-ai-violet-500/30",
    slate: "bg-white/5 text-slate-300 ring-white/10",
    cyan: "bg-ai-cyan-500/15 text-ai-cyan-400 ring-ai-cyan-500/30",
    fuchsia: "bg-ai-fuchsia-500/15 text-ai-fuchsia-400 ring-ai-fuchsia-500/30",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function KeyValueGrid({ items }: { items: { label: string; value: string }[] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
          <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{item.label}</dt>
          <dd className="mt-1 text-sm font-medium text-slate-200">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function BulletList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-r from-ai-violet-400 to-ai-cyan-400" />
          <span className="text-slate-300">{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function CheckList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5">
          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-white/15 bg-white/5 text-[10px] text-ai-cyan-400">
            ✓
          </span>
          <span className="text-slate-300">{item}</span>
        </li>
      ))}
    </ul>
  );
}
