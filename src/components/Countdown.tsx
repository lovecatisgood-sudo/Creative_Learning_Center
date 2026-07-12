"use client";

import { useEffect, useState } from "react";

// Live countdown to a pickup time. Ticks client-side every second; goes red and
// switches to "OVERDUE +M:SS" once past pickup (A1 / PRD §6.8).
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function fmt(totalSec: number): string {
  const s = Math.abs(totalSec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function Countdown({
  plannedEndAt,
  now,
  overdueLabel,
  className = "",
}: {
  plannedEndAt: string;
  now: number;
  overdueLabel: string;
  className?: string;
}) {
  const remainingSec = Math.round((new Date(plannedEndAt).getTime() - now) / 1000);
  const overdue = remainingSec < 0;
  return (
    <span className={`${className} ${overdue ? "text-danger" : "text-ink"}`}>
      {overdue ? `${overdueLabel} +${fmt(remainingSec)}` : fmt(remainingSec)}
    </span>
  );
}

export function isOverdue(plannedEndAt: string, now: number): boolean {
  return new Date(plannedEndAt).getTime() - now < 0;
}
