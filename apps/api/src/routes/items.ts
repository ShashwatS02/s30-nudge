import { Router, type Router as ExpressRouter } from "express";
import { and, asc, desc, eq, isNotNull, isNull } from "drizzle-orm";
import { db, items } from "@s30-nudge/db";
import { v4 as uuidv4 } from "uuid";

const router: ExpressRouter = Router();

const allowedItemTypes = [
  "task",
  "bill",
  "renewal",
  "follow_up",
  "appointment",
  "document_request"
] as const;

const allowedStatuses = ["open", "in_progress", "done", "overdue", "cancelled"] as const;

router.post("/", async (req, res) => {
  try {
    const { spaceId, createdBy, title, description, itemType, priority, dueAt } = req.body ?? {};

    if (!spaceId || !createdBy || !title || !itemType) {
      res.status(400).json({
        error: "spaceId, createdBy, title, and itemType are required"
      });
      return;
    }

    if (!allowedItemTypes.includes(itemType)) {
      res.status(400).json({
        error:
          "itemType must be one of: task, bill, renewal, follow_up, appointment, document_request"
      });
      return;
    }

    if (dueAt !== undefined && dueAt !== null) {
      if (typeof dueAt !== "string" || Number.isNaN(new Date(dueAt).getTime())) {
        res.status(400).json({
          error: "dueAt must be a valid ISO date string or null"
        });
        return;
      }
    }

    const newItem: typeof items.$inferInsert = {
      id: uuidv4(),
      spaceId,
      createdBy,
      title: String(title).trim(),
      description: description ? String(description).trim() : null,
      itemType,
      priority: Number.isFinite(priority) ? priority : 50,
      dueAt: dueAt ? new Date(dueAt) : null
    };

    await db.insert(items).values(newItem);

    res.status(201).json(newItem);
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create item" });
    return;
  }
});

router.get("/", async (req, res) => {
  try {
    const { spaceId, status, sort, snoozed } = req.query;

    const conditions = [];

    if (typeof spaceId === "string" && spaceId) {
      conditions.push(eq(items.spaceId, spaceId));
    }

    if (typeof status === "string" && status) {
      conditions.push(eq(items.status, status as (typeof allowedStatuses)[number]));
    }

    if (snoozed === "true") {
      conditions.push(isNotNull(items.snoozedUntil));
    }

    if (snoozed === "false") {
      conditions.push(isNull(items.snoozedUntil));
    }

    let query = db.select().from(items).$dynamic();

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    query =
      sort === "oldest"
        ? query.orderBy(asc(items.createdAt))
        : query.orderBy(desc(items.createdAt));

    const rows = await query;

    res.json({ items: rows });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch items" });
    return;
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, itemType, dueAt } = req.body ?? {};

    const existing = await db.select().from(items).where(eq(items.id, id)).limit(1);
    const existingItem = existing[0];

    if (!existingItem) {
      res.status(404).json({ error: "Item not found" });
      return;
    }

    if (title !== undefined && !String(title).trim()) {
      res.status(400).json({ error: "title cannot be empty" });
      return;
    }

    if (itemType !== undefined) {
      if (
        typeof itemType !== "string" ||
        !allowedItemTypes.includes(itemType as (typeof allowedItemTypes)[number])
      ) {
        res.status(400).json({
          error:
            "itemType must be one of: task, bill, renewal, follow_up, appointment, document_request"
        });
        return;
      }
    }

    if (dueAt !== undefined && dueAt !== null) {
      if (typeof dueAt !== "string" || Number.isNaN(new Date(dueAt).getTime())) {
        res.status(400).json({ error: "dueAt must be a valid ISO date string or null" });
        return;
      }
    }

    const updateData: Partial<typeof items.$inferSelect> = {
      updatedAt: new Date()
    };

    if (title !== undefined) {
      updateData.title = String(title).trim();
    }

    if (description !== undefined) {
      updateData.description = String(description).trim() || null;
    }

    if (itemType !== undefined) {
      updateData.itemType = itemType as (typeof allowedItemTypes)[number];
    }

    if (dueAt !== undefined) {
      updateData.dueAt = dueAt ? new Date(dueAt) : null;
    }

    await db.update(items).set(updateData).where(eq(items.id, id));

    const updated = await db.select().from(items).where(eq(items.id, id)).limit(1);
    const updatedItem = updated[0];

    if (!updatedItem) {
      res.status(404).json({ error: "Item not found after update" });
      return;
    }

    res.json(updatedItem);
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update item" });
    return;
  }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body ?? {};

    if (!allowedStatuses.includes(status)) {
      res.status(400).json({
        error: "status must be one of: open, in_progress, done, overdue, cancelled"
      });
      return;
    }

    const existing = await db.select().from(items).where(eq(items.id, id)).limit(1);

    if (existing.length === 0) {
      res.status(404).json({ error: "Item not found" });
      return;
    }

    await db
      .update(items)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(eq(items.id, id));

    const updated = await db.select().from(items).where(eq(items.id, id)).limit(1);

    res.json(updated[0]);
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update item status" });
    return;
  }
});

router.patch("/:id/snooze", async (req, res) => {
  try {
    const { id } = req.params;
    const { snoozedUntil } = req.body ?? {};

    if (snoozedUntil !== null && typeof snoozedUntil !== "string") {
      res.status(400).json({
        error: "snoozedUntil must be an ISO date string or null"
      });
      return;
    }

    if (typeof snoozedUntil === "string" && Number.isNaN(new Date(snoozedUntil).getTime())) {
      res.status(400).json({
        error: "snoozedUntil must be a valid ISO date string"
      });
      return;
    }

    const existing = await db.select().from(items).where(eq(items.id, id)).limit(1);

    if (existing.length === 0) {
      res.status(404).json({ error: "Item not found" });
      return;
    }

    await db
      .update(items)
      .set({
        snoozedUntil: snoozedUntil ? new Date(snoozedUntil) : null,
        updatedAt: new Date()
      })
      .where(eq(items.id, id));

    const updated = await db.select().from(items).where(eq(items.id, id)).limit(1);

    res.json(updated[0]);
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to snooze item" });
    return;
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await db.select().from(items).where(eq(items.id, id)).limit(1);

    if (existing.length === 0) {
      res.status(404).json({ error: "Item not found" });
      return;
    }

    await db.delete(items).where(eq(items.id, id));

    res.status(204).send();
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete item" });
    return;
  }
});

export default router;
