"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { CountdownBlock } from "@/lib/blocks/types";
import { cx } from "@/lib/utils";

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

export default function CountdownStrip({ block }: { block: CountdownBlock }) {
  const targetTs = useMemo(() => {
    const t = new Date(block.targetDate).getTime();
    return Number.isNaN(t) ? Date.now() + 48 * 60 * 60 * 1000 : t;
  }, [block.targetDate]);

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => getTimeLeft(targetTs));

  useEffect(() => {
    setTimeLeft(getTimeLeft(targetTs));
    const i = setInterval(() => setTimeLeft(getTimeLeft(targetTs)), 1000);
    return () => clearInterval(i);
  }, [targetTs]);

  const isInternal =
    block.ctaHref &&
    !block.ctaHref.startsWith("http") &&
    !block.ctaHref.startsWith("mailto:");

  return (
    <section
      className={cx(
        "mc-block mc-block--countdown",
        block.variant && `is-variant-${block.variant}`,
      )}
    >
      <div className="mc-container mc-block--countdown__inner">
        <div className="mc-block--countdown__copy">
          <h2>{block.heading}</h2>
          {block.body && <p>{block.body}</p>}
        </div>
        <div className="mc-countdown mc-countdown--inline" aria-label="Offer ends in">
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
        {block.ctaLabel && block.ctaHref && (
          isInternal ? (
            <Link href={block.ctaHref} className="mc-btn mc-btn--countdown">
              {block.ctaLabel}
            </Link>
          ) : (
            <a href={block.ctaHref} className="mc-btn mc-btn--countdown">
              {block.ctaLabel}
            </a>
          )
        )}
      </div>
    </section>
  );
}
