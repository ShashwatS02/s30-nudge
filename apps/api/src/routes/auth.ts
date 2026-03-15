import { Router, type CookieOptions } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { db, passwordResetTokens, refreshSessions, spaceMembers, spaces, users } from "@s30-nudge/db";
import { v4 as uuidv4 } from "uuid";
import { authEmailLimiter, authIpLimiter } from "../lib/authRateLimit.js";
import { OAuth2Client } from "google-auth-library";
import { sendPasswordResetEmail } from "../lib/email.js";

const router = Router();

router.use(authIpLimiter);


const ACCESS_TOKEN_TTL = "15m";
const REFRESH_COOKIE_NAME = "refreshToken";
const REFRESH_TOKEN_TTL_DAYS = Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 30);
const PASSWORD_RESET_TOKEN_TTL_MINUTES = Number(
  process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES ?? 30
);


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

type DbUser = typeof users.$inferSelect;
type NewUser = typeof users.$inferInsert;


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
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000
  };
}

function getRefreshClearCookieOptions(): CookieOptions {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
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

function buildResetPasswordUrl(rawToken: string) {
  const frontendUrl = (process.env.FRONTEND_URL ?? "http://localhost:5173").replace(/\/$/, "");
  return `${frontendUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;
}

async function createPasswordResetToken(userId: string) {
  const rawToken = createOpaqueToken();
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MINUTES * 60 * 1000);

  await db.insert(passwordResetTokens).values({
    id: uuidv4(),
    userId,
    tokenHash: hashOpaqueToken(rawToken),
    expiresAt
  });

  return rawToken;
}

async function markPasswordResetTokensUsedForUser(userId: string) {
  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(
      and(eq(passwordResetTokens.userId, userId), isNull(passwordResetTokens.usedAt))
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

const googleClient = new OAuth2Client();

function getGoogleClientId() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();

  if (!clientId) {
    throw new Error("Missing GOOGLE_CLIENT_ID");
  }

  return clientId;
}

async function verifyGoogleIdentity(
  idToken: string
): Promise<{ email: string; fullName: string }> {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: getGoogleClientId()
  });

  const payload = ticket.getPayload();

  if (!payload?.email || !payload.email_verified) {
    throw new Error("Google account email is not verified");
  }

  const atIndex = payload.email.indexOf("@");
  const fallbackName = atIndex > 0 ? payload.email.slice(0, atIndex) : "Google User";

  return {
    email: normalizeEmail(payload.email),
    fullName: payload.name?.trim() || payload.given_name?.trim() || fallbackName
  };
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

router.post("/google", async (req, res) => {
  const idToken = String(req.body?.idToken ?? "").trim();

  if (!idToken) {
    res.status(400).json({ error: "idToken is required" });
    return;
  }

  try {
    const googleIdentity = await verifyGoogleIdentity(idToken);

    const found = await db
      .select()
      .from(users)
      .where(sql`lower(${users.email}) = ${googleIdentity.email}`)
      .limit(1);

    const existingUser = found[0];

    let user: DbUser;

    if (existingUser) {
      user = existingUser;
    } else {
      const newUser: NewUser = {
        id: uuidv4(),
        fullName: googleIdentity.fullName,
        email: googleIdentity.email,
        passwordHash: await bcrypt.hash(randomBytes(32).toString("hex"), 12)
      };

      await db.insert(users).values(newUser);
      user = newUser as DbUser;
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

    const message = error instanceof Error ? error.message : "Google verification failed";

    if (message === "Missing GOOGLE_CLIENT_ID") {
      res.status(500).json({ error: "Google sign-in is not configured" });
      return;
    }

    if (message === "Google account email is not verified") {
      res.status(401).json({ error: "Invalid Google sign-in token" });
      return;
    }

    res.status(500).json({ error: "Failed to sign in with Google" });
  }
});


router.post("/forgot-password", authEmailLimiter, async (req, res) => {
  try {
    const email = normalizeEmail(String(req.body?.email ?? ""));

    if (!email) {
      res.status(400).json({ error: "email is required" });
      return;
    }

    const found = await db
      .select({
        id: users.id,
        email: users.email
      })
      .from(users)
      .where(sql`lower(${users.email}) = ${email}`)
      .limit(1);

    const user = found[0];

    if (user) {
      await markPasswordResetTokensUsedForUser(user.id);

      const rawToken = await createPasswordResetToken(user.id);
      const resetUrl = buildResetPasswordUrl(rawToken);

      await sendPasswordResetEmail({
  to: user.email,
  resetUrl
});

if (process.env.NODE_ENV !== "production") {
  console.log(`Password reset link for ${user.email}: ${resetUrl}`);
}

    }

    res.json({
      message: "If an account with that email exists, a reset link has been sent"
    });
  } catch (error) {
  console.error("Forgot password failed:", error);
  const message = error instanceof Error ? error.message : "Unknown error";
  res.status(500).json({ error: `Failed to start password reset: ${message}` });
}
});

router.post("/reset-password", async (req, res) => {
  try {
    const token = String(req.body?.token ?? "").trim();
    const password = String(req.body?.password ?? "");

    if (!token || !password) {
      res.status(400).json({ error: "token and password are required" });
      return;
    }

    if (!isValidPassword(password)) {
      res.status(400).json({
        error: "Password must be at least 10 characters and include 1 number and 1 special character"
      });
      return;
    }

    const found = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.tokenHash, hashOpaqueToken(token)),
          isNull(passwordResetTokens.usedAt),
          gt(passwordResetTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    const resetToken = found[0];

    if (!resetToken) {
      res.status(400).json({ error: "Invalid or expired reset token" });
      return;
    }

    await db
      .update(users)
      .set({
        passwordHash: await bcrypt.hash(password, 12),
        updatedAt: new Date()
      })
      .where(eq(users.id, resetToken.userId));

    await markPasswordResetTokensUsedForUser(resetToken.userId);
    await revokeAllRefreshSessionsForUser(resetToken.userId);

    res.clearCookie(REFRESH_COOKIE_NAME, getRefreshClearCookieOptions());
    res.json({ message: "Password has been reset successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to reset password" });
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

router.post("/change-password", async (req, res) => {
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
    const currentPassword = String(req.body?.currentPassword ?? "");
    const newPassword = String(req.body?.newPassword ?? "");

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: "currentPassword and newPassword are required" });
      return;
    }

    if (!isValidPassword(newPassword)) {
      res.status(400).json({
        error: "Password must be at least 10 characters and include 1 number and 1 special character"
      });
      return;
    }

    const found = await db.select().from(users).where(eq(users.id, payload.sub)).limit(1);
    const user = found[0];

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const passwordOk = await bcrypt.compare(currentPassword, user.passwordHash);

if (!passwordOk) {
  res.status(401).json({ error: "Current password is incorrect" });
  return;
}

const samePassword = await bcrypt.compare(newPassword, user.passwordHash);

if (samePassword) {
  res.status(400).json({ error: "New password must be different from current password" });
  return;
}

await db
  .update(users)
  .set({
    passwordHash: await bcrypt.hash(newPassword, 12),
    updatedAt: new Date()
  })
  .where(eq(users.id, user.id));


    await markPasswordResetTokensUsedForUser(user.id);
    await revokeAllRefreshSessionsForUser(user.id);

    res.clearCookie(REFRESH_COOKIE_NAME, getRefreshClearCookieOptions());
    res.json({ message: "Password updated successfully. Please sign in again." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to change password" });
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
