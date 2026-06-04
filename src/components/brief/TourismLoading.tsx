"use client";

import { useEffect, useState } from "react";

const LOADING_MESSAGES = [
  "Charting the route to your content brief…",
  "Scanning search intent along the way…",
  "Mapping headers and internal links…",
  "Almost at your destination…",
] as const;

type VehicleKind = "plane" | "car" | "bike";

interface TourismLoadingProps {
  title?: string;
  subtitle?: string;
  compact?: boolean;
}

export function TourismLoading({
  title = "Generating your brief",
  subtitle = "Building structure, keywords, and planning sheet export…",
  compact = false,
}: TourismLoadingProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [vehicle, setVehicle] = useState<VehicleKind>("plane");

  useEffect(() => {
    const messageTimer = setInterval(() => {
      setMessageIndex((current) => (current + 1) % LOADING_MESSAGES.length);
    }, 2800);

    const vehicleTimer = setInterval(() => {
      setVehicle((current) => {
        if (current === "plane") return "car";
        if (current === "car") return "bike";
        return "plane";
      });
    }, 3200);

    return () => {
      clearInterval(messageTimer);
      clearInterval(vehicleTimer);
    };
  }, []);

  return (
    <div
      className={`relative flex flex-col items-center justify-center overflow-hidden text-center ${
        compact ? "min-h-[220px] px-4 py-8" : "min-h-[420px] p-10"
      }`}
      aria-live="polite"
      aria-busy="true"
    >
      <div className="pointer-events-none absolute inset-0 ai-shimmer opacity-60" />
      <div className="pointer-events-none absolute inset-x-0 top-8 h-24 bg-gradient-to-b from-ai-cyan-500/10 to-transparent" />

      <div className={`relative w-full ${compact ? "max-w-sm" : "max-w-md"}`}>
        <div className="tourism-scene">
          <div className="tourism-cloud tourism-cloud-a" />
          <div className="tourism-cloud tourism-cloud-b" />
          <div className="tourism-hill tourism-hill-left" />
          <div className="tourism-hill tourism-hill-right" />
          <div className="tourism-road">
            <span className="tourism-road-dash" />
            <span className="tourism-road-dash" />
            <span className="tourism-road-dash" />
            <span className="tourism-road-dash" />
          </div>

          <div className={`tourism-vehicle tourism-vehicle-${vehicle}`} key={vehicle}>
            {vehicle === "plane" && <PlaneIcon />}
            {vehicle === "car" && <CarIcon />}
            {vehicle === "bike" && <BikeIcon />}
          </div>
        </div>
      </div>

      <div className="relative mt-8 max-w-sm">
        <h3 className={`font-semibold text-gradient-ai ${compact ? "text-sm" : "text-base"}`}>{title}</h3>
        <p className={`mt-2 text-slate-500 ${compact ? "text-xs" : "text-sm"}`}>{subtitle}</p>
        <p className="mt-4 min-h-5 text-xs font-medium text-ai-cyan-300/90 transition-opacity duration-500">
          {LOADING_MESSAGES[messageIndex]}
        </p>
        <div className="mt-5 flex justify-center gap-1.5">
          {[0, 1, 2].map((index) => (
            <span
              key={index}
              className="h-1.5 w-1.5 rounded-full bg-ai-violet-400 ai-pulse-dot"
              style={{ animationDelay: `${index * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function PlaneIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-10 w-10 text-ai-cyan-300" aria-hidden="true">
      <path
        fill="currentColor"
        d="M56 18L8 30l12 4-2 14 6-2 8-10 10 2 2-8 12-4-2-4 12 6-2 18-32z"
      />
    </svg>
  );
}

function CarIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-9 w-14 text-ai-violet-300" aria-hidden="true">
      <path
        fill="currentColor"
        d="M10 38h44l-4-12a6 6 0 0 0-5.7-4H19.7A6 6 0 0 0 14 26L10 38zm2 4a6 6 0 1 0 0.1 0 6 6 0 0 0-.1 0zm40 0a6 6 0 1 0 0.1 0 6 6 0 0 0-.1 0zM8 40l3-14h42l3 14H8z"
      />
    </svg>
  );
}

function BikeIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-10 w-12 text-ai-fuchsia-300" aria-hidden="true">
      <circle cx="16" cy="42" r="8" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="48" cy="42" r="8" fill="none" stroke="currentColor" strokeWidth="3" />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        d="M16 42 28 22h10l6 8 8-2M34 22l8 8"
      />
    </svg>
  );
}
