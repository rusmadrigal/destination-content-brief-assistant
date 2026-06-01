export function AppFooter() {
  return (
    <footer className="mt-12 border-t border-white/10 py-6">
      <div className="mx-auto max-w-7xl px-4 text-xs text-slate-500 sm:px-6 lg:px-8">
        <div className="max-w-xl space-y-2">
          <p className="font-medium text-slate-400">Internal tool · Granicus Destinations / Simpleview</p>
          <p>
            Form data may be sent to OpenAI when AI enhancement is enabled and{" "}
            <code className="rounded bg-white/5 px-1 text-slate-400">OPENAI_API_KEY</code> is set. Do not
            enter confidential client data unless approved by your team. Use &quot;Template only&quot; to keep
            processing on-server.
          </p>
        </div>
      </div>
    </footer>
  );
}
