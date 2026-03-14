import { useEffect, useState } from "react";
import type { Item } from "../lib/api";

type ItemType =
  | "task"
  | "bill"
  | "renewal"
  | "follow_up"
  | "appointment"
  | "document_request";

type Props = {
  item: Item | null;
  onClose: () => void;
  onSave: (input: {
    id: string;
    title: string;
    description: string;
    itemType: ItemType;
    dueAt: string;
  }) => Promise<void>;
};

const typeOptions: ItemType[] = [
  "task",
  "bill",
  "renewal",
  "follow_up",
  "appointment",
  "document_request"
];

function toLocalDateTimeValue(value: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (n: number) => String(n).padStart(2, "0");

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function prettyItemType(value: ItemType) {
  switch (value) {
    case "follow_up":
      return "Follow-up";
    case "document_request":
      return "Document request";
    default:
      return value.charAt(0).toUpperCase() + value.slice(1);
  }
}

function isValidItemType(value: string): value is ItemType {
  return typeOptions.includes(value as ItemType);
}

export default function EditItemModal({ item, onClose, onSave }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [itemType, setItemType] = useState<ItemType>("task");
  const [dueAt, setDueAt] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!item) return;

    setTitle(item.title ?? "");
    setDescription(item.description ?? "");
    setItemType(isValidItemType(item.itemType) ? item.itemType : "task");
    setDueAt(toLocalDateTimeValue(item.dueAt));
  }, [item]);

  useEffect(() => {
    if (!item) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !saving) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [item, saving, onClose]);

  if (!item) return null;

  const currentItem = item;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;

    try {
      setSaving(true);
      await onSave({
        id: currentItem.id,
        title: title.trim(),
        description: description.trim(),
        itemType,
        dueAt
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="modal-overlay fade-in"
      onClick={() => {
        if (!saving) onClose();
      }}
    >
      <div
        className="modal-shell"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-topline">
          <div>
            <span className="section-kicker">Edit item</span>
            <h3 className="section-title">Refine the item without losing momentum.</h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="modal-close-btn"
            disabled={saving}
          >
            Close
          </button>
        </div>

        <p className="section-copy modal-copy">
          Update the title, description, type, or due date while keeping the same premium workflow.
        </p>

        <form onSubmit={handleSubmit} className="modal-form-grid">
          <div className="field-block field-span-2">
            <label className="field-label" htmlFor="edit-title">
              Title
            </label>
            <input
              id="edit-title"
              className="input-shell"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Pay internet bill"
              maxLength={120}
            />
          </div>

          <div className="field-block field-span-2">
            <label className="field-label" htmlFor="edit-description">
              Description
            </label>
            <textarea
              id="edit-description"
              className="textarea-shell modal-textarea"
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
              {typeOptions.map((option) => {
                const active = option === itemType;

                return (
                  <button
                    key={option}
                    type="button"
                    className={active ? "type-chip type-chip-active" : "type-chip"}
                    onClick={() => setItemType(option)}
                  >
                    {prettyItemType(option)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="field-block">
            <label className="field-label" htmlFor="edit-dueAt">
              Due date
            </label>
            <input
              id="edit-dueAt"
              className="input-shell"
              type="datetime-local"
              value={dueAt}
              onChange={(event) => setDueAt(event.target.value)}
            />
          </div>

          <div className="field-block modal-actions-block">
            <div className="field-hint">
              Small edits should still feel deliberate, calm, and visually polished.
            </div>

            <div className="modal-action-row">
              <button
                type="button"
                onClick={onClose}
                className="secondary-btn"
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-btn"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
