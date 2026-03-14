import { Router, type Router as ExpressRouter } from "express";
import { db, users } from "@s30-nudge/db";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

const router: ExpressRouter = Router();

router.post("/", async (req, res) => {
  try {
    const { fullName, email, password } = req.body ?? {};

    if (!fullName || !email || !password) {
      res.status(400).json({
        error: "fullName, email, and password are required"
      });
      return;
    }

    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing.length > 0) {
      res.status(409).json({ error: "Email already exists" });
      return;
    }

    const newUser = {
      id: uuidv4(),
      fullName,
      email,
      passwordHash: password
    };

    await db.insert(users).values(newUser);

    res.status(201).json({
      id: newUser.id,
      fullName: newUser.fullName,
      email: newUser.email
    });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create user" });
    return;
  }
});

export default router;
