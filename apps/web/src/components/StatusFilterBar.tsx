import type { ItemStatus } from "../lib/api";

export type StatusFilterValue = "all" | ItemStatus;

type StatusFilterBarProps = {
  value: StatusFilterValue;
  onChange: (value: StatusFilterValue) => void;
  counts?: Partial<Record<StatusFilterValue, number>>;
};

const options: { value: StatusFilterValue; label: string; hint: string }[] = [
  { value: "all", label: "All items", hint: "Everything in motion" },
  { value: "open", label: "Open", hint: "Ready for action" },
  { value: "in_progress", label: "In progress", hint: "Already moving" },
  { value: "overdue", label: "Overdue", hint: "Needs attention fast" },
  { value: "cancelled", label: "Cancelled", hint: "Closed out" }
];

export default function StatusFilterBar({
  value,
  onChange,
  counts = {}
}: StatusFilterBarProps) {
  return (
    <section className="filter-shell">
      <div className="section-heading-row">
        <div>
          <span className="section-kicker">Control layer</span>
          <h3 className="section-title">Move faster through the items that matter.</h3>
        </div>
        <p className="section-copy">
          Narrow the workspace instantly, keep visual context, and stay oriented while switching focus.
        </p>
      </div>

      <div className="filter-pill-grid">
        {options.map((option) => {
          const active = option.value === value;
          const count = counts[option.value] ?? 0;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={active ? "filter-pill filter-pill-active" : "filter-pill"}
            >
              <div className="filter-pill-top">
                <span className="filter-pill-label">{option.label}</span>
                <span className="filter-pill-count">{count}</span>
              </div>
              <div className="filter-pill-hint">{option.hint}</div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
