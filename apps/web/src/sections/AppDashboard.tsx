import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import ActiveFilterSummary from "../components/ActiveFilterSummary";
import CreateItemForm from "../components/CreateItemForm";
import DashboardCards from "../components/DashboardCards";
import EditItemModal from "../components/EditItemModal";
import ItemsList from "../components/ItemsList";
import StatusFilterBar, { type StatusFilterValue } from "../components/StatusFilterBar";
import Toast from "../components/Toast";
import {
  createItem,
  deleteItem,
  getDashboard,
  getItems,
  snoozeItem,
  updateItem,
  updateItemStatus,
  type DashboardResponse,
  type Item,
  type ItemStatus,
  type ItemType
} from "../lib/api";

type AppDashboardProps = {
  searchQuery: string;
  newItemRequest: number;
};

export default function AppDashboard({
  searchQuery,
  newItemRequest
}: AppDashboardProps) {
  const { user } = useAuth();
  const spaceId = user?.defaultSpaceId ?? null;
  const userId = user?.id ?? null;

  const [items, setItems] = useState<Item[]>([]);
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  const createSectionRef = useRef<HTMLElement | null>(null);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  }

  async function loadData() {
    if (!spaceId) {
      setItems([]);
      setDashboard(null);
      setError("No personal space found for this account yet.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [itemsData, dashboardData] = await Promise.all([
        getItems({
          spaceId,
          sort: "oldest"
        }),
        getDashboard(spaceId)
      ]);

      setItems(itemsData.items);
      setDashboard(dashboardData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  function handleFilterChange(filter: StatusFilterValue) {
    setStatusFilter(filter);
  }

  async function handleCreateItem(input: {
    title: string;
    description: string;
    itemType: ItemType;
    dueAt: string;
  }) {
    if (!spaceId || !userId) {
      showToast("Missing workspace context");
      return;
    }

    try {
      await createItem({
        spaceId,
        createdBy: userId,
        title: input.title,
        description: input.description || undefined,
        itemType: input.itemType,
        dueAt: input.dueAt ? new Date(input.dueAt).toISOString() : undefined
      });

      await loadData();
      showToast("Item added");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to add item");
    }
  }

  async function handleSaveEdit(input: {
    id: string;
    title: string;
    description: string;
    itemType: ItemType;
    dueAt: string;
  }) {
    try {
      await updateItem(input.id, {
        title: input.title,
        description: input.description || "",
        itemType: input.itemType,
        dueAt: input.dueAt ? new Date(input.dueAt).toISOString() : null
      });

      setEditingItem(null);
      await loadData();
      showToast("Item updated");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update item";
      showToast(message);
    }
  }

  async function handleDeleteItem(item: Item) {
    try {
      if (editingItem?.id === item.id) {
        setEditingItem(null);
      }

      await deleteItem(item.id);
      await loadData();
      showToast("Item deleted");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete item";
      showToast(message);
    }
  }

  async function handleUpdateStatus(id: string, status: ItemStatus) {
    try {
      await updateItemStatus(id, status);
      await loadData();
      showToast("Status updated");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to update status");
    }
  }

  async function handleSnoozeTomorrow(id: string) {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);

      await snoozeItem(id, tomorrow.toISOString());
      await loadData();
      showToast("Item snoozed");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to snooze item");
    }
  }

  async function handleClearSnooze(id: string) {
    try {
      await snoozeItem(id, null);
      await loadData();
      showToast("Snooze cleared");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to clear snooze");
    }
  }

  useEffect(() => {
    if (!spaceId) {
      setItems([]);
      setDashboard(null);
      setLoading(false);
      return;
    }

    setStatusFilter("all");
    void loadData();
  }, [spaceId]);

  useEffect(() => {
    if (!newItemRequest) return;

    createSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

    window.setTimeout(() => {
      const titleInput = document.getElementById("title") as HTMLInputElement | null;
      titleInput?.focus();
    }, 150);
  }, [newItemRequest]);

  const heroStats = useMemo(() => {
    return [
      {
        label: "Open momentum",
        value: dashboard?.counts.totalOpen ?? 0,
        foot: "Active nudges in motion"
      },
      {
        label: "Due now",
        value: dashboard ? dashboard.counts.today + dashboard.counts.overdue : 0,
        foot: "Needs attention first"
      },
      {
        label: "Upcoming flow",
        value: dashboard?.counts.upcoming ?? 0,
        foot: "Already mapped ahead"
      }
    ];
  }, [dashboard]);

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesStatus = statusFilter === "all" ? true : item.status === statusFilter;

      const matchesSearch = normalizedSearchQuery
        ? [item.title, item.description ?? "", item.itemType, item.status]
            .join(" ")
            .toLowerCase()
            .includes(normalizedSearchQuery)
        : true;

      return matchesStatus && matchesSearch;
    });
  }, [items, normalizedSearchQuery, statusFilter]);

  const filterCounts = useMemo(
    () => ({
      all: items.length,
      open: items.filter((item) => item.status === "open").length,
      in_progress: items.filter((item) => item.status === "in_progress").length,
      overdue: items.filter((item) => item.status === "overdue").length,
      cancelled: items.filter((item) => item.status === "cancelled").length
    }),
    [items]
  );

  return (
    <main className="app-shell">
      <div className="app-container">
        {toast && <Toast message={toast} />}

        <section className="hero-panel fade-up">
          <div className="hero-grid">
            <div>
              <div className="eyebrow">Personal operations cockpit</div>
              <h1 className="hero-title">s30-nudge</h1>
              <p className="hero-subtitle">
                A calmer, sharper way to manage bills, renewals, follow-ups and life admin with
                clarity, urgency, and elegance.
              </p>

              <div className="hero-metrics">
                {heroStats.map((stat) => (
                  <div key={stat.label} className="metric-card">
                    <div className="metric-label">{stat.label}</div>
                    <div className="metric-value">{stat.value}</div>
                    <div className="metric-foot">{stat.foot}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card fade-up" style={{ minHeight: 240 }}>
              <p
                style={{
                  margin: 0,
                  color: "var(--text-faint)",
                  fontSize: 13,
                  letterSpacing: "0.03em",
                  textTransform: "uppercase"
                }}
              >
                Why it feels better
              </p>

              <h3
                style={{
                  margin: "14px 0 10px",
                  fontSize: 28,
                  lineHeight: 1.1,
                  letterSpacing: "-0.04em"
                }}
              >
                Life admin, but with energy.
              </h3>

              <p style={{ margin: 0, color: "var(--text-soft)", lineHeight: 1.75 }}>
                Instead of a dry list of tasks, this becomes a focused dashboard with urgency,
                rhythm, and visual calm — something that feels useful the second it opens.
              </p>

              <div className="pill-row" style={{ marginTop: 18 }}>
                <span className="pill">Premium shell</span>
                <span className="pill">Faster scanning</span>
                <span className="pill">Better action flow</span>
              </div>
            </div>
          </div>
        </section>

        <div className="section-stack">
          {error && (
            <section className="glass-section fade-up">
              <h2 className="section-title" style={{ color: "#fecaca" }}>
                Something went wrong
              </h2>
              <p className="section-copy">{error}</p>
            </section>
          )}

          {loading && (
            <section className="glass-section fade-up">
              <h2 className="section-title">Loading workspace</h2>
              <p className="section-copy">
                Pulling items, dashboard counts, and activity state into your workspace.
              </p>
            </section>
          )}

          {!loading && !error && (
            <>
              <section className="glass-section fade-up" ref={createSectionRef}>
                <h2 className="section-title">Capture a new nudge</h2>
                <p className="section-copy" style={{ marginBottom: 18 }}>
                  Add a task, bill, renewal, follow-up, or appointment and place it into motion.
                </p>
                <CreateItemForm onSubmit={handleCreateItem} />
              </section>

              {dashboard && (
                <section className="glass-section fade-up">
                  <h2 className="section-title">Operational pulse</h2>
                  <p className="section-copy" style={{ marginBottom: 18 }}>
                    A quick read on what needs action now, what is approaching, and what is still
                    waiting in your system.
                  </p>
                  <DashboardCards items={items} />
                </section>
              )}

              <section className="glass-section fade-up">
                <h2 className="section-title">Control layer</h2>
                <p className="section-copy" style={{ marginBottom: 18 }}>
                  Filter the workspace, narrow the list, and move quickly through the items that
                  matter right now.
                </p>

                <StatusFilterBar
                  value={statusFilter}
                  onChange={handleFilterChange}
                  counts={filterCounts}
                />

                <div style={{ height: 16 }} />

                <ActiveFilterSummary
                  value={statusFilter}
                  visibleCount={filteredItems.length}
                  dueCount={filteredItems.filter((item) => Boolean(item.dueAt)).length}
                  snoozedCount={filteredItems.filter((item) => Boolean(item.snoozedUntil)).length}
                />
              </section>

              {searchQuery ? (
                <section className="glass-section fade-up">
                  <h2 className="section-title">Search results</h2>
                  <p className="section-copy">
                    Showing {filteredItems.length} matching item
                    {filteredItems.length === 1 ? "" : "s"} for "{searchQuery}".
                  </p>
                </section>
              ) : null}

              <section className="glass-section fade-up">
                <h2 className="section-title">Live items</h2>
                <p className="section-copy" style={{ marginBottom: 18 }}>
                  Edit, delete, snooze, and update status without losing context.
                </p>
                <ItemsList
                  items={filteredItems}
                  activeFilter={statusFilter}
                  onRefresh={loadData}
                  onEdit={setEditingItem}
                  onDelete={handleDeleteItem}
                  onUpdateStatus={handleUpdateStatus}
                  onSnoozeTomorrow={handleSnoozeTomorrow}
                  onClearSnooze={handleClearSnooze}
                />
              </section>
            </>
          )}
        </div>

        <EditItemModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={handleSaveEdit}
        />
      </div>
    </main>
  );
}
