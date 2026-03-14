import { Router, type Router as ExpressRouter } from "express";
import { db, items } from "@s30-nudge/db";
import { eq } from "drizzle-orm";

const router: ExpressRouter = Router();

router.get("/", async (req, res) => {
  try {
    const { spaceId } = req.query;

    if (typeof spaceId !== "string" || !spaceId) {
      res.status(400).json({ error: "spaceId is required" });
      return;
    }

    const rows = await db.select().from(items).where(eq(items.spaceId, spaceId));

    const now = new Date();

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

    const startOfNextWeek = new Date(startOfToday);
    startOfNextWeek.setDate(startOfNextWeek.getDate() + 7);

    const openItems = rows.filter(
      (item) =>
        item.status === "open" ||
        item.status === "in_progress" ||
        item.status === "overdue"
    );

    const overdue = openItems.filter((item) => {
      if (!item.dueAt) return false;
      const due = new Date(item.dueAt);
      return due < startOfToday;
    });

    const today = openItems.filter((item) => {
      if (!item.dueAt) return false;
      const due = new Date(item.dueAt);
      return due >= startOfToday && due < startOfTomorrow;
    });

    const upcoming = openItems.filter((item) => {
      if (!item.dueAt) return false;
      const due = new Date(item.dueAt);
      return due >= startOfTomorrow && due < startOfNextWeek;
    });

    const noDueDate = openItems.filter((item) => !item.dueAt);

    res.json({
      counts: {
        overdue: overdue.length,
        today: today.length,
        upcoming: upcoming.length,
        noDueDate: noDueDate.length,
        totalOpen: openItems.length
      },
      groups: {
        overdue,
        today,
        upcoming,
        noDueDate
      }
    });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to load dashboard" });
    return;
  }
});

export default router;
