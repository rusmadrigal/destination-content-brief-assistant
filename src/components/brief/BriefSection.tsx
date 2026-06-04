import type { ReactNode } from "react";

interface BriefSectionProps {
  index: number;
  title: string;
  children: ReactNode;
}

export function BriefSection({ index, title, children }: BriefSectionProps) {
  return (
    <section className="glass-panel rounded-2xl p-5 transition-colors hover:border-slate-300">
      <div className="mb-3 flex items-center gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-granicus-red text-xs font-bold text-white shadow-sm">
          {index}
        </span>
        <h3 className="text-sm font-semibold tracking-tight text-granicus-navy">{title}</h3>
      </div>
      <div className="text-sm leading-relaxed text-slate-600">{children}</div>
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
    violet: "bg-granicus-red/10 text-granicus-red ring-granicus-red/20",
    slate: "bg-slate-100 text-slate-600 ring-slate-200",
    cyan: "bg-granicus-blue/10 text-granicus-blue ring-granicus-blue/25",
    fuchsia: "bg-granicus-navy/5 text-granicus-navy ring-slate-200",
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
        <div key={item.label} className="rounded-lg border border-slate-200 bg-granicus-teal-soft/40 px-3 py-2">
          <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{item.label}</dt>
          <dd className="mt-1 text-sm font-medium text-granicus-navy">{item.value}</dd>
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
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-granicus-red" />
          <span className="text-slate-700">{item}</span>
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
          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-granicus-blue/40 bg-granicus-blue/10 text-[10px] text-granicus-blue">
            ✓
          </span>
          <span className="text-slate-700">{item}</span>
        </li>
      ))}
    </ul>
  );
}
