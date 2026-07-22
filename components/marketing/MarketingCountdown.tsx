"use client";

import { useEffect, useMemo, useState } from "react";

type TimeLeft = { days: number; hours: number; minutes: number; seconds: number };

function getTimeLeft(target: number): TimeLeft {
  const diff = Math.max(0, target - Date.now());
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

const pad = (n: number) => n.toString().padStart(2, "0");

/** Isolated countdown — keeps 1s re-renders out of the hero image tree. */
export default function MarketingCountdown({
  countdownTo,
}: {
  countdownTo?: string;
}) {
  const targetTs = useMemo(() => {
    if (countdownTo) {
      const t = new Date(countdownTo).getTime();
      if (!Number.isNaN(t)) return t;
    }
    return Date.now() + 48 * 60 * 60 * 1000;
  }, [countdownTo]);

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => getTimeLeft(targetTs));

  useEffect(() => {
    setTimeLeft(getTimeLeft(targetTs));
    const i = setInterval(() => setTimeLeft(getTimeLeft(targetTs)), 1000);
    return () => clearInterval(i);
  }, [targetTs]);

  return (
    <div className="mc-countdown" aria-label="Offer ends in">
      <div className="mc-countdown__unit">
        <span className="mc-countdown__value">{pad(timeLeft.days)}</span>
        <span className="mc-countdown__label">Days</span>
      </div>
      <div className="mc-countdown__unit">
        <span className="mc-countdown__value">{pad(timeLeft.hours)}</span>
        <span className="mc-countdown__label">Hrs</span>
      </div>
      <div className="mc-countdown__unit">
        <span className="mc-countdown__value">{pad(timeLeft.minutes)}</span>
        <span className="mc-countdown__label">Min</span>
      </div>
      <div className="mc-countdown__unit">
        <span className="mc-countdown__value">{pad(timeLeft.seconds)}</span>
        <span className="mc-countdown__label">Sec</span>
      </div>
    </div>
  );
}
