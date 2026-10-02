"use client";
import { useState } from "react";
import { ArrowUpRight, Check, ShieldX, LoaderCircle } from "lucide-react";
import { explorer } from "@/lib/solana/program";
import { short } from "@/lib/solana/pdas";
import type { Activity } from "@/lib/solana/types";
export default function ActivityFeed({
  activity,
  busy,
}: {
  activity: Activity[];
  busy: string;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <section className="activity-panel">
      <div className="section-line">
        <h2>On-chain activity</h2>
        <button
          className="text-button"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Show recent" : `View history (${activity.length})`}
        </button>
      </div>
      <div
        className={`transaction-lifecycle ${busy ? "pending" : ""}`}
        aria-live="polite"
      >
        {busy ? (
          <>
            <LoaderCircle size={13} className="spin" />
            <strong>{busy}</strong>
            <span>Awaiting confirmation</span>
          </>
        ) : (
          <>
            <Check size={13} />
            <span>
              {activity.length
                ? "State synchronized with confirmed transactions"
                : "Confirmed transactions will appear here"}
            </span>
          </>
        )}
      </div>
      <div className={`activity-list ${expanded ? "expanded" : ""}`}>
        {activity.slice(0, expanded ? 30 : 3).map((a, i) => (
          <div
            key={`${a.signature}-${i}`}
            className={`activity-row ${a.status}`}
          >
            {a.status === "rejected" ? (
              <ShieldX size={14} />
            ) : (
              <Check size={14} />
            )}
            <div>
              <strong>{a.title}</strong>
              <small>{a.detail}</small>
            </div>
            <time>{a.time}</time>
            {a.signature && (
              <a
                href={explorer(a.signature)}
                target="_blank"
                rel="noreferrer"
                title={a.signature}
              >
                {short(a.signature)}
                <ArrowUpRight size={12} />
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
