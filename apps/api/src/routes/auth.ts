import { Router, type CookieOptions } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { db, refreshSessions, spaceMembers, spaces, users } from "@s30-nudge/db";
import { v4 as uuidv4 } from "uuid";
import { authEmailLimiter, authIpLimiter } from "../lib/authRateLimit.js";


const router = Router();

router.use(authIpLimiter);


const ACCESS_TOKEN_TTL = "15m";
const REFRESH_COOKIE_NAME = "refreshToken";
const REFRESH_TOKEN_TTL_DAYS = Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 30);

type SafeUser = {
  id: string;
  fullName: string;
  email: string;
  defaultSpaceId: string;
};

type AccessTokenPayload = {
  sub: string;
  email: string;
  fullName: string;
  iat?: number;
  exp?: number;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isValidPassword(password: string) {
  return password.length >= 10 && /\d/.test(password) && /[^A-Za-z0-9]/.test(password);
}

function getAccessTokenSecret() {
  return process.env.ACCESS_TOKEN_SECRET ?? "dev-access-secret-change-me";
}

function getRefreshCookieOptions(): CookieOptions {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000
  };
}

function getRefreshClearCookieOptions(): CookieOptions {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/"
  };
}

function hashOpaqueToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function createOpaqueToken() {
  return randomBytes(48).toString("hex");
}

function getBearerToken(authorization?: string) {
  if (!authorization) return null;

  const [scheme, token] = authorization.split(" ");
  if (scheme !== "Bearer" || !token) return null;

  return token;
}

function buildPersonalSpaceName(fullName: string) {
  const firstName = fullName.trim().split(/\s+/)[0] || "Personal";
  return `${firstName}'s space`;
}

async function ensurePersonalSpace(userId: string, fullName: string) {
  const existing = await db
    .select({ id: spaces.id })
    .from(spaces)
    .where(and(eq(spaces.createdBy, userId), eq(spaces.spaceType, "personal")))
    .limit(1);

  if (existing[0]) {
    return existing[0].id;
  }

  const spaceId = uuidv4();

  await db.insert(spaces).values({
    id: spaceId,
    name: buildPersonalSpaceName(fullName),
    spaceType: "personal",
    createdBy: userId
  });

  await db.insert(spaceMembers).values({
    spaceId,
    userId,
    role: "owner"
  });

  return spaceId;
}

function toSafeUser(
  user: { id: string; fullName: string; email: string },
  defaultSpaceId: string
): SafeUser {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    defaultSpaceId
  };
}

function signAccessToken(user: SafeUser) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      fullName: user.fullName
    },
    getAccessTokenSecret(),
    { expiresIn: ACCESS_TOKEN_TTL }
  );
}

async function createRefreshSession(userId: string) {
  const rawToken = createOpaqueToken();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  await db.insert(refreshSessions).values({
    id: uuidv4(),
    userId,
    tokenHash: hashOpaqueToken(rawToken),
    expiresAt
  });

  return rawToken;
}

async function revokeRefreshToken(rawToken?: string | null) {
  if (!rawToken) return;

  await db
    .update(refreshSessions)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(refreshSessions.tokenHash, hashOpaqueToken(rawToken)),
        isNull(refreshSessions.revokedAt)
      )
    );
}

async function revokeAllRefreshSessionsForUser(userId: string) {
  await db
    .update(refreshSessions)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(refreshSessions.userId, userId),
        isNull(refreshSessions.revokedAt)
      )
    );
}


router.post("/signup", authEmailLimiter, async (req, res) => {
  try {
    const fullName = String(req.body?.fullName ?? "").trim();
    const email = normalizeEmail(String(req.body?.email ?? ""));
    const password = String(req.body?.password ?? "");

    if (!fullName || !email || !password) {
      res.status(400).json({
        error: "fullName, email, and password are required"
      });
      return;
    }

    if (!isValidPassword(password)) {
      res.status(400).json({
        error: "Password must be at least 10 characters and include 1 number and 1 special character"
      });
      return;
    }

    const existing = await db
      .select()
      .from(users)
      .where(sql`lower(${users.email}) = ${email}`)
      .limit(1);

    if (existing.length > 0) {
      res.status(409).json({ error: "Email already exists" });
      return;
    }

    const newUser = {
      id: uuidv4(),
      fullName,
      email,
      passwordHash: await bcrypt.hash(password, 12)
    };

    await db.insert(users).values(newUser);

    const defaultSpaceId = await ensurePersonalSpace(newUser.id, newUser.fullName);
    const safeUser = toSafeUser(newUser, defaultSpaceId);
    const accessToken = signAccessToken(safeUser);
    const refreshToken = await createRefreshSession(newUser.id);

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions());
    res.status(201).json({
      accessToken,
      user: safeUser
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

router.post("/login", authEmailLimiter, async (req, res) => {
  try {
    const email = normalizeEmail(String(req.body?.email ?? ""));
    const password = String(req.body?.password ?? "");

    if (!email || !password) {
      res.status(400).json({
        error: "email and password are required"
      });
      return;
    }

    const found = await db
      .select()
      .from(users)
      .where(sql`lower(${users.email}) = ${email}`)
      .limit(1);

    const user = found[0];

    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const passwordOk = await bcrypt.compare(password, user.passwordHash);

    if (!passwordOk) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const defaultSpaceId = await ensurePersonalSpace(user.id, user.fullName);
    const safeUser = toSafeUser(user, defaultSpaceId);
    const accessToken = signAccessToken(safeUser);
    const refreshToken = await createRefreshSession(user.id);

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions());
    res.json({
      accessToken,
      user: safeUser
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to sign in" });
  }
});

router.post("/refresh", async (req, res) => {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;

    if (!refreshToken) {
      res.status(204).send();
      return;
    }

    const found = await db
      .select()
      .from(refreshSessions)
      .where(
        and(
          eq(refreshSessions.tokenHash, hashOpaqueToken(refreshToken)),
          isNull(refreshSessions.revokedAt),
          gt(refreshSessions.expiresAt, new Date())
        )
      )
      .limit(1);

    const session = found[0];

    if (!session) {
      res.clearCookie(REFRESH_COOKIE_NAME, getRefreshClearCookieOptions());
      res.status(204).send();
      return;
    }

    const matchedUsers = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email
      })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    const user = matchedUsers[0];

    if (!user) {
      res.clearCookie(REFRESH_COOKIE_NAME, getRefreshClearCookieOptions());
      res.status(401).json({ error: "User not found" });
      return;
    }

    await db
      .update(refreshSessions)
      .set({ revokedAt: new Date() })
      .where(eq(refreshSessions.id, session.id));

    const defaultSpaceId = await ensurePersonalSpace(user.id, user.fullName);
    const safeUser = toSafeUser(user, defaultSpaceId);
    const nextRefreshToken = await createRefreshSession(user.id);
    const accessToken = signAccessToken(safeUser);

    res.cookie(REFRESH_COOKIE_NAME, nextRefreshToken, getRefreshCookieOptions());
    res.json({
      accessToken,
      user: safeUser
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to refresh session" });
  }
});

router.post("/logout", async (req, res) => {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;

    await revokeRefreshToken(refreshToken);
    res.clearCookie(REFRESH_COOKIE_NAME, getRefreshClearCookieOptions());
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to log out" });
  }
});

router.post("/logout-all", async (req, res) => {
  const token = getBearerToken(req.headers.authorization);

  if (!token) {
    res.status(401).json({ error: "Missing access token" });
    return;
  }

  let payload: AccessTokenPayload;

  try {
    payload = jwt.verify(token, getAccessTokenSecret()) as AccessTokenPayload;
  } catch {
    res.status(401).json({ error: "Invalid or expired access token" });
    return;
  }

  try {
    await revokeAllRefreshSessionsForUser(payload.sub);
    res.clearCookie(REFRESH_COOKIE_NAME, getRefreshClearCookieOptions());
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to log out everywhere" });
  }
});


router.get("/me", async (req, res) => {
  try {
    const token = getBearerToken(req.headers.authorization);

    if (!token) {
      res.status(401).json({ error: "Missing access token" });
      return;
    }

    const payload = jwt.verify(token, getAccessTokenSecret()) as AccessTokenPayload;

    const found = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email
      })
      .from(users)
      .where(eq(users.id, payload.sub))
      .limit(1);

    const user = found[0];

    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    const defaultSpaceId = await ensurePersonalSpace(user.id, user.fullName);

    res.json({
      user: toSafeUser(user, defaultSpaceId)
    });
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired access token" });
  }
});

export default router;
