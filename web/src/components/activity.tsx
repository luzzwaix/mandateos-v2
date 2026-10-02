"use client";
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
  return (
    <section className="activity-panel">
      <div className="section-line">
        <h2>On-chain activity</h2>
        <span>CONFIRMED EVENTS & TRANSACTIONS</span>
      </div>
      {busy && (
        <div className="activity-row pending">
          <LoaderCircle size={16} className="spin" />
          <div>
            <strong>{busy}</strong>
            <small>Waiting for wallet / validator confirmation</small>
          </div>
          <span>Pending</span>
        </div>
      )}
      {!activity.length && !busy && (
        <p className="empty-activity">
          Confirmed transactions will appear here. No simulated activity.
        </p>
      )}
      {activity.slice(0, 9).map((a, i) => (
        <div key={`${a.signature}-${i}`} className={`activity-row ${a.status}`}>
          {a.status === "rejected" ? (
            <ShieldX size={16} />
          ) : (
            <Check size={16} />
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
              {short(a.signature)} <ArrowUpRight size={12} />
            </a>
          )}
        </div>
      ))}
    </section>
  );
}
