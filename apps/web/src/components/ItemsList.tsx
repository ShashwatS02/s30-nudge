import { useState } from "react";
import type { Item, ItemStatus } from "../lib/api";
import { formatDateTime } from "../lib/format";
import EmptyState from "./EmptyState";

type Props = {
  items: Item[];
  activeFilter: "all" | ItemStatus;
  onRefresh: () => Promise<void>;
  onEdit: (item: Item) => void;
  onDelete: (item: Item) => Promise<void>;
  onUpdateStatus: (id: string, status: ItemStatus) => Promise<void>;
  onSnoozeTomorrow: (id: string) => Promise<void>;
  onClearSnooze: (id: string) => Promise<void>;
};

function prettyFilterLabel(filter: "all" | ItemStatus) {
  if (filter === "all") return "items";
  if (filter === "in_progress") return "in progress items";
  return `${filter} items`;
}

function formatTypeLabel(value: string) {
  return value.replaceAll("_", " ");
}

function formatStatusLabel(value: ItemStatus) {
  return value.replaceAll("_", " ");
}

function getStatusTone(status: ItemStatus) {
  switch (status) {
    case "open":
      return "status-tone-open";
    case "in_progress":
      return "status-tone-progress";
    case "done":
      return "status-tone-done";
    case "overdue":
      return "status-tone-overdue";
    case "cancelled":
      return "status-tone-cancelled";
    default:
      return "status-tone-neutral";
  }
}

const statusOptions: ItemStatus[] = [
  "open",
  "in_progress",
  "overdue",
  "cancelled"
];

export default function ItemsList({
  items,
  activeFilter,
  onRefresh,
  onEdit,
  onDelete,
  onUpdateStatus,
  onSnoozeTomorrow,
  onClearSnooze
}: Props) {
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function runAction(key: string, action: () => Promise<void>) {
    try {
      setPendingKey(key);
      await action();
    } finally {
      setPendingKey(null);
    }
  }

  async function runRefresh() {
    try {
      setRefreshing(true);
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <section className="items-shell">
      <div className="items-toolbar">
        <div>
          <span className="section-kicker">Items</span>
          <h3 className="section-title">Live work, cleaner actions, better scanning.</h3>
        </div>

        <button
          type="button"
          onClick={() => void runRefresh()}
          className="items-reload-btn"
          disabled={refreshing}
        >
          {refreshing ? "Reloading..." : "Reload"}
        </button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="No items here yet"
          description={`There are no ${prettyFilterLabel(activeFilter)} right now. Try another filter or add a new item.`}
        />
      ) : (
        <div className="items-grid">
          {items.map((item) => {
            const statusTone = getStatusTone(item.status);

            return (
              <article key={item.id} className="item-shell fade-in">
                <div className="item-head">
                  <div className="item-title-block">
                    <div className="item-kicker">{formatTypeLabel(item.itemType)}</div>
                    <h3 className="item-title">{item.title}</h3>
                    {item.description ? (
                      <p className="item-description">{item.description}</p>
                    ) : (
                      <p className="item-description item-description-muted">
                        No extra notes added yet.
                      </p>
                    )}
                  </div>

                  <span className={`item-status-pill ${statusTone}`}>
                    {formatStatusLabel(item.status)}
                  </span>
                </div>

                <div className="item-meta-grid">
                  <div className="item-meta-card">
                    <span className="item-meta-label">Due date</span>
                    <strong className="item-meta-value">
                      {formatDateTime(item.dueAt) ?? "No due date"}
                    </strong>
                  </div>

                  <div className="item-meta-card">
                    <span className="item-meta-label">Snoozed until</span>
                    <strong className="item-meta-value">
                      {formatDateTime(item.snoozedUntil) ?? "Not snoozed"}
                    </strong>
                  </div>
                </div>

                <div className="item-actions-stack">
                  <div className="item-status-actions">
                    {statusOptions.map((status) => {
                      const actionKey = `${item.id}-${status}`;
                      const active = item.status === status;

                      return (
                        <button
                          key={status}
                          type="button"
                          onClick={() =>
                            void runAction(actionKey, () => onUpdateStatus(item.id, status))
                          }
                          className={
                            active
                              ? "item-chip-btn item-chip-btn-active"
                              : "item-chip-btn"
                          }
                          disabled={pendingKey !== null}
                        >
                          {pendingKey === actionKey ? "Saving..." : formatStatusLabel(status)}
                        </button>
                      );
                    })}
                  </div>

                  <div className="item-utility-actions">
                    <button
                      type="button"
                      onClick={() => onEdit(item)}
                      className="item-action-btn"
                      disabled={pendingKey !== null}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        void runAction(`${item.id}-snooze`, () => onSnoozeTomorrow(item.id))
                      }
                      className="item-action-btn"
                      disabled={pendingKey !== null}
                    >
                      {pendingKey === `${item.id}-snooze` ? "Snoozing..." : "Snooze"}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        void runAction(`${item.id}-clear`, () => onClearSnooze(item.id))
                      }
                      className="item-action-btn"
                      disabled={pendingKey !== null}
                    >
                      {pendingKey === `${item.id}-clear` ? "Clearing..." : "Clear snooze"}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        void runAction(`${item.id}-delete`, async () => {
                          const confirmed = window.confirm(`Delete "${item.title}"?`);
                          if (!confirmed) return;
                          await onDelete(item);
                        })
                      }
                      className="item-action-btn item-action-btn-danger"
                      disabled={pendingKey !== null}
                    >
                      {pendingKey === `${item.id}-delete` ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
