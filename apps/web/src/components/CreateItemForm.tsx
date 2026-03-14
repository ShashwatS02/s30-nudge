import { useMemo, useState } from "react";
import type { ItemType } from "../lib/api";

type CreateItemFormProps = {
  onSubmit: (input: {
    title: string;
    description: string;
    itemType: ItemType;
    dueAt: string;
  }) => Promise<void>;
};

const itemTypes: { value: ItemType; label: string }[] = [
  { value: "task", label: "Task" },
  { value: "bill", label: "Bill" },
  { value: "renewal", label: "Renewal" },
  { value: "follow_up", label: "Follow-up" },
  { value: "appointment", label: "Appointment" },
  { value: "document_request", label: "Document request" }
];

export default function CreateItemForm({ onSubmit }: CreateItemFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [itemType, setItemType] = useState<ItemType>("task");
  const [dueAt, setDueAt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const quickDueOptions = useMemo(
    () => [
      {
        label: "Tonight · 9 PM",
        value: getQuickDate({ addDays: 0, hour: 21, minute: 0 })
      },
      {
        label: "Tomorrow · 9 AM",
        value: getQuickDate({ addDays: 1, hour: 9, minute: 0 })
      },
      {
        label: "This weekend",
        value: getUpcomingSaturday()
      },
      {
        label: "Next Monday",
        value: getNextWeekday(1, 10, 0)
      }
    ],
    []
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;

    try {
      setIsSubmitting(true);
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        itemType,
        dueAt
      });

      setTitle("");
      setDescription("");
      setItemType("task");
      setDueAt("");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="create-form">
      <div className="create-form-grid">
        <div className="field-block field-span-2">
          <label className="field-label" htmlFor="title">
            Title
          </label>
          <input
            id="title"
            className="input-shell"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Pay internet bill"
            maxLength={120}
          />
        </div>

        <div className="field-block field-span-2">
          <label className="field-label" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            className="textarea-shell create-textarea"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Optional notes"
            rows={4}
            maxLength={400}
          />
        </div>

        <div className="field-block field-span-2">
          <label className="field-label">Type</label>
          <div className="type-grid">
            {itemTypes.map((option) => {
              const active = option.value === itemType;

              return (
                <button
                  key={option.value}
                  type="button"
                  className={active ? "type-chip type-chip-active" : "type-chip"}
                  onClick={() => setItemType(option.value)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="field-block field-span-2">
          <label className="field-label">Quick due date</label>
          <div className="quick-grid">
            {quickDueOptions.map((option) => (
              <button
                key={option.label}
                type="button"
                className="quick-chip"
                onClick={() => setDueAt(option.value)}
              >
                {option.label}
              </button>
            ))}

            <button
              type="button"
              className="quick-chip"
              onClick={() => setDueAt("")}
            >
              Clear due date
            </button>
          </div>
        </div>

        <div className="field-block">
          <label className="field-label" htmlFor="dueAt">
            Custom due date
          </label>
          <input
            id="dueAt"
            className="input-shell"
            type="datetime-local"
            value={dueAt}
            onChange={(event) => setDueAt(event.target.value)}
          />
        </div>

        <div className="field-block create-actions">
          <div className="field-hint">
            Build momentum with cleaner capture, better timing, and sharper categorisation.
          </div>

          <button className="primary-btn create-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Adding..." : "Add item"}
          </button>
        </div>
      </div>
    </form>
  );
}

function getQuickDate({
  addDays,
  hour,
  minute
}: {
  addDays: number;
  hour: number;
  minute: number;
}) {
  const date = new Date();
  date.setDate(date.getDate() + addDays);
  date.setHours(hour, minute, 0, 0);
  return toDateTimeLocalValue(date);
}

function getUpcomingSaturday() {
  const date = new Date();
  const currentDay = date.getDay();
  const daysUntilSaturday = (6 - currentDay + 7) % 7 || 7;
  date.setDate(date.getDate() + daysUntilSaturday);
  date.setHours(10, 0, 0, 0);
  return toDateTimeLocalValue(date);
}

function getNextWeekday(targetDay: number, hour: number, minute: number) {
  const date = new Date();
  const currentDay = date.getDay();
  let delta = (targetDay - currentDay + 7) % 7;
  if (delta === 0) delta = 7;
  date.setDate(date.getDate() + delta);
  date.setHours(hour, minute, 0, 0);
  return toDateTimeLocalValue(date);
}

function toDateTimeLocalValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}`;
}
