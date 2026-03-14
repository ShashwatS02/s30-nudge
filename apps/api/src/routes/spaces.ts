import { Router, type Router as ExpressRouter } from "express";
import { db, spaces, spaceMembers } from "@s30-nudge/db";
import { v4 as uuidv4 } from "uuid";

const router: ExpressRouter = Router();

router.post("/", async (req, res) => {
  try {
    const { name, spaceType, createdBy } = req.body ?? {};

    if (!name || !spaceType || !createdBy) {
      res.status(400).json({
        error: "name, spaceType, and createdBy are required"
      });
      return;
    }

    const newSpace = {
      id: uuidv4(),
      name,
      spaceType,
      createdBy
    };

    await db.insert(spaces).values(newSpace);
    await db.insert(spaceMembers).values({
      spaceId: newSpace.id,
      userId: createdBy,
      role: "owner"
    });

    res.status(201).json(newSpace);
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create space" });
    return;
  }
});

export default router;
