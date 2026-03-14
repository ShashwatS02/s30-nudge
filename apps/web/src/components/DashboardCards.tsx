import { useMemo } from "react";
import type { Item } from "../lib/api";

type DashboardCardsProps = {
  items?: Item[] | null;
};

type MetricCard = {
  eyebrow: string;
  value: number;
  label: string;
  tone: "violet" | "blue" | "amber" | "emerald" | "slate";
};

export default function DashboardCards({ items }: DashboardCardsProps) {
  const safeItems = Array.isArray(items) ? items : [];

  const metrics = useMemo<MetricCard[]>(() => {
    const now = new Date();
    const start = startOfDay(now);
    const end = endOfDay(now);

    const activeItems = safeItems.filter((item) => item.status !== "cancelled");
    const overdue = activeItems.filter((item) => isOverdue(item, now)).length;
    const today = activeItems.filter((item) => isDueToday(item, start, end)).length;
    const upcoming = activeItems.filter((item) => isUpcoming(item, end)).length;
    const noDueDate = activeItems.filter((item) => !item.dueAt).length;
    const totalOpen = activeItems.length;

    return [
      {
        eyebrow: "Needs action now",
        value: overdue,
        label: "Overdue",
        tone: "amber"
      },
      {
        eyebrow: "On today’s radar",
        value: today,
        label: "Today",
        tone: "blue"
      },
      {
        eyebrow: "Already mapped ahead",
        value: upcoming,
        label: "Upcoming",
        tone: "emerald"
      },
      {
        eyebrow: "Flexible timing",
        value: noDueDate,
        label: "No due date",
        tone: "slate"
      },
      {
        eyebrow: "Open momentum",
        value: totalOpen,
        label: "Total open",
        tone: "violet"
      }
    ];
  }, [safeItems]);

  return (
    <section className="dashboard-metrics-shell">
      <div className="section-heading-row">
        <div>
          <span className="section-kicker">Operational pulse</span>
          <h3 className="section-title">A sharper read on what needs attention.</h3>
        </div>
        <p className="section-copy">
          Scan urgency, today’s workload, upcoming commitments, and total open momentum in one glance.
        </p>
      </div>

      <div className="dashboard-metrics-grid">
        {metrics.map((metric) => (
          <article
            key={metric.label}
            className={`metric-card metric-card-${metric.tone}`}
          >
            <div className="metric-card-topline">{metric.eyebrow}</div>
            <div className="metric-card-value-row">
              <span className="metric-card-value">{metric.value}</span>
              <span className="metric-card-label">{metric.label}</span>
            </div>
            <div className="metric-card-bar" />
          </article>
        ))}
      </div>
    </section>
  );
}

function isOverdue(item: Item, now: Date) {
  if (!item.dueAt) return false;
  if (item.status === "overdue") return true;
  const due = new Date(item.dueAt);
  return due.getTime() < now.getTime() && item.status !== "cancelled";
}

function isDueToday(item: Item, start: Date, end: Date) {
  if (!item.dueAt) return false;
  if (item.status === "cancelled") return false;
  const due = new Date(item.dueAt);
  return due.getTime() >= start.getTime() && due.getTime() <= end.getTime();
}

function isUpcoming(item: Item, end: Date) {
  if (!item.dueAt) return false;
  if (item.status === "cancelled") return false;
  const due = new Date(item.dueAt);
  return due.getTime() > end.getTime();
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}
