import type { StatusFilterValue } from "./StatusFilterBar";

type ActiveFilterSummaryProps = {
  value: StatusFilterValue;
  visibleCount: number;
  dueCount: number;
  snoozedCount: number;
};

export default function ActiveFilterSummary({
  value,
  visibleCount,
  dueCount,
  snoozedCount
}: ActiveFilterSummaryProps) {
  return (
    <section className="filter-summary-grid">
      <article className="filter-summary-card">
        <span className="filter-summary-label">Viewing</span>
        <strong className="filter-summary-value">{formatFilterLabel(value)}</strong>
      </article>

      <article className="filter-summary-card">
        <span className="filter-summary-label">Visible items</span>
        <strong className="filter-summary-value">{visibleCount}</strong>
      </article>

      <article className="filter-summary-card">
        <span className="filter-summary-label">With due date</span>
        <strong className="filter-summary-value">{dueCount}</strong>
      </article>

      <article className="filter-summary-card">
        <span className="filter-summary-label">Snoozed</span>
        <strong className="filter-summary-value">{snoozedCount}</strong>
      </article>
    </section>
  );
}

function formatFilterLabel(value: StatusFilterValue) {
  switch (value) {
    case "all":
      return "All items";
    case "in_progress":
      return "In progress";
    case "open":
      return "Open";
    case "overdue":
      return "Overdue";
    case "cancelled":
      return "Cancelled";
    default:
      return value;
  }
}
