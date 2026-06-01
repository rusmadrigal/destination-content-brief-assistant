# Destination Content Brief Assistant

An internal MVP that helps SEO teams create structured, search-informed, **human-guided** content briefs for Destination Marketing Organizations (DMOs).

This tool does **not** generate final, AI-written content. It produces a strategic content brief that human writers and local stakeholders use to create better destination content. It never invents local places, businesses, events, dates, prices, hours, or distances — anything local is either supplied by the user or surfaced as a validation prompt.

## Stack

- **Next.js 16** (App Router) + **React 19** functional components
- **TypeScript** (strict, no `any`)
- **Tailwind CSS v4**
- Deterministic, template-driven generation — **no external AI API required**

## Getting started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The tool is also available at `/destination-content-brief`.

```bash
pnpm build   # production build + type check
pnpm lint    # eslint
```

## How it works

1. The user fills in SEO and planning details (destination, content type, primary keyword, audience, seasonality, goals, internal links, brand voice, local details, etc.).
2. Required fields (`Destination Name`, `Content Type`, `Primary Keyword`, `Target Audience`, `Business Goal`) are validated.
3. A deterministic generator assembles a 16-section brief that adapts to the chosen content type and business goal.
4. The brief can be copied as Markdown or downloaded as a `.md` file (filename derived from the destination + primary keyword).

## Project structure

```
src/
  app/
    page.tsx                          # Home route → renders the assistant
    destination-content-brief/page.tsx# Named route → renders the assistant
    layout.tsx, globals.css           # App shell + styling
  components/brief/
    BriefAssistant.tsx                # Client container: state, header, layout
    BriefForm.tsx                     # Input form
    BriefOutput.tsx                   # Rendered brief + copy/download actions
    BriefSection.tsx                  # Section card + Badge/List primitives
    FormField.tsx                     # Reusable input/select/textarea fields
  lib/briefs/
    types.ts                          # DestinationBriefInput / DestinationBrief + option types
    options.ts                        # Dropdown option sets + empty input
    validation.ts                     # Required-field validation
    briefTemplates.ts                 # Content-type structures, schema maps, intent maps
    generateDestinationBrief.ts       # Deterministic generator (the AI swap point)
```

Business logic lives entirely in `src/lib/briefs` and is decoupled from the UI.

## Swapping in a real AI API

`generateDestinationBrief(input: DestinationBriefInput): DestinationBrief` in
`src/lib/briefs/generateDestinationBrief.ts` is the single seam to replace.

To wire up OpenAI / Azure OpenAI / an internal API:

1. Create an async function (e.g. in a Route Handler or Server Action) that calls the provider and maps the response onto the `DestinationBrief` shape from `types.ts`.
2. In `BriefAssistant.tsx`, replace the `window.setTimeout(...)` block in `handleGenerate` with an `await` of that function.
3. Keep `generateDestinationBrief` as a deterministic fallback for offline use or when an API key is unavailable.

Because the UI only depends on the `DestinationBrief` type, no component changes are required.

## Guardrails

- No final article copy is generated.
- No local specifics are invented. If `Local Details Provided` is empty, the brief shows a **Local Knowledge Needed** checklist instead.
- Editorial guidelines and risks explicitly flag generic AI-sounding copy, unsupported claims, and missing local expertise.
