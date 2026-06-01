"use client";

import { useEffect, useRef } from "react";
import type { DestinationBriefInput } from "@/lib/briefs/types";

const DRAFT_KEY = "cba-form-draft";

export function loadFormDraft(): DestinationBriefInput | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DestinationBriefInput;
  } catch {
    return null;
  }
}

export function saveFormDraft(input: DestinationBriefInput): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(input));
  } catch {
    // ignore quota errors
  }
}

export function clearFormDraft(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DRAFT_KEY);
}

/** Debounced autosave of form input to localStorage. */
export function useFormDraftAutosave(input: DestinationBriefInput): void {
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    const timer = window.setTimeout(() => saveFormDraft(input), 500);
    return () => window.clearTimeout(timer);
  }, [input]);
}
