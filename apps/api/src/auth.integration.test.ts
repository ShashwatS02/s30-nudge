import "dotenv/config";
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { createApp } from "./app.js";

const app = createApp();

const uniqueEmail = `shash-${Date.now()}@example.com`;
const password = "StrongPass@123";

describe("auth flow", () => {
  it("returns health ok", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      ok: true,
      service: "api"
    });
  });

  it("signs up a new user", async () => {
    const res = await request(app).post("/auth/signup").send({
      fullName: "Shash Test",
      email: uniqueEmail,
      password
    });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(uniqueEmail.toLowerCase());
    expect(res.body.user.fullName).toBe("Shash Test");
    expect(res.body.user.defaultSpaceId).toBeTruthy();
    expect(res.body.accessToken).toBeTruthy();

    const setCookie = res.headers["set-cookie"];
    expect(setCookie).toBeTruthy();
  });

  it("rejects duplicate email signup", async () => {
    const res = await request(app).post("/auth/signup").send({
      fullName: "Shash Test",
      email: uniqueEmail,
      password
    });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("Email already exists");
  });

  it("rejects wrong password login", async () => {
    const res = await request(app).post("/auth/login").send({
      email: uniqueEmail,
      password: "WrongPass@123"
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid email or password");
  });

  it("logs in with correct credentials", async () => {
    const res = await request(app).post("/auth/login").send({
      email: uniqueEmail,
      password
    });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(uniqueEmail.toLowerCase());
    expect(res.body.user.defaultSpaceId).toBeTruthy();
    expect(res.body.accessToken).toBeTruthy();
    expect(res.headers["set-cookie"]).toBeTruthy();
  });

  it("returns 204 on refresh without cookie", async () => {
    const res = await request(app).post("/auth/refresh");

    expect(res.status).toBe(204);
  });

  it("refreshes session with cookie", async () => {
    const loginRes = await request(app).post("/auth/login").send({
      email: uniqueEmail,
      password
    });

    const cookies = loginRes.headers["set-cookie"] as string[] | undefined;
    expect(cookies).toBeTruthy();

    const refreshRes = await request(app).post("/auth/refresh").set("Cookie", cookies ?? []);


    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.user.email).toBe(uniqueEmail.toLowerCase());
    expect(refreshRes.body.user.defaultSpaceId).toBeTruthy();
    expect(refreshRes.body.accessToken).toBeTruthy();
    expect(refreshRes.headers["set-cookie"]).toBeTruthy();
  });

  it("logs out and clears cookie", async () => {
    const loginRes = await request(app).post("/auth/login").send({
      email: uniqueEmail,
      password
    });

    const cookies = loginRes.headers["set-cookie"] as string[] | undefined;
    expect(cookies).toBeTruthy();

    const logoutRes = await request(app).post("/auth/logout").set("Cookie", cookies ?? []);


    expect(logoutRes.status).toBe(204);
  });
});

  it("rejects weak password on signup", async () => {
    const res = await request(app).post("/auth/signup").send({
      fullName: "Weak Password",
      email: `weak-${Date.now()}@example.com`,
      password: "weakpass"
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe(
      "Password must be at least 10 characters and include 1 number and 1 special character"
    );
  });

  it("logs in with case-insensitive email", async () => {
    const res = await request(app).post("/auth/login").send({
      email: uniqueEmail.toUpperCase(),
      password
    });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(uniqueEmail.toLowerCase());
    expect(res.body.accessToken).toBeTruthy();
  });

  it("returns current user from /auth/me with access token", async () => {
    const loginRes = await request(app).post("/auth/login").send({
      email: uniqueEmail,
      password
    });

    const accessToken = loginRes.body.accessToken as string;
    expect(accessToken).toBeTruthy();

    const meRes = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.user.email).toBe(uniqueEmail.toLowerCase());
    expect(meRes.body.user.fullName).toBe("Shash Test");
    expect(meRes.body.user.defaultSpaceId).toBeTruthy();
  });

  it("rejects /auth/me without access token", async () => {
    const res = await request(app).get("/auth/me");

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Missing access token");
  });

  it("rejects /auth/me with invalid access token", async () => {
    const res = await request(app)
      .get("/auth/me")
      .set("Authorization", "Bearer not-a-real-token");

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid or expired access token");
  });

  it("returns 429 on the 6th failed login attempt for the same email and IP", async () => {
    const rateLimitedEmail = `rate-${Date.now()}@example.com`;

    await request(app).post("/auth/signup").send({
      fullName: "Rate Limit Test",
      email: rateLimitedEmail,
      password
    });

    for (let i = 0; i < 5; i++) {
      const res = await request(app).post("/auth/login").send({
        email: rateLimitedEmail,
        password: "WrongPass@123"
      });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Invalid email or password");
    }

    const blockedRes = await request(app).post("/auth/login").send({
      email: rateLimitedEmail,
      password: "WrongPass@123"
    });

    expect(blockedRes.status).toBe(429);
    expect(blockedRes.body.error).toBe(
      "Too many attempts for this email from this IP. Please try again later."
    );
  });

it("logs out from all sessions and blocks refresh with old cookies", async () => {
  const multiSessionEmail = `logout-all-${Date.now()}@example.com`;

  await request(app).post("/auth/signup").send({
    fullName: "Logout All Test",
    email: multiSessionEmail,
    password
  });

  const loginRes1 = await request(app).post("/auth/login").send({
    email: multiSessionEmail,
    password
  });

  const loginRes2 = await request(app).post("/auth/login").send({
    email: multiSessionEmail,
    password
  });

  const cookies1 = loginRes1.headers["set-cookie"] as string[] | undefined;
  const cookies2 = loginRes2.headers["set-cookie"] as string[] | undefined;
  const accessToken = loginRes1.body.accessToken as string;

  expect(cookies1).toBeTruthy();
  expect(cookies2).toBeTruthy();
  expect(accessToken).toBeTruthy();

  const logoutAllRes = await request(app)
    .post("/auth/logout-all")
    .set("Authorization", `Bearer ${accessToken}`);

  expect(logoutAllRes.status).toBe(204);

  const refreshRes1 = await request(app).post("/auth/refresh").set("Cookie", cookies1 ?? []);
  const refreshRes2 = await request(app).post("/auth/refresh").set("Cookie", cookies2 ?? []);

  expect(refreshRes1.status).toBe(204);
  expect(refreshRes2.status).toBe(204);
});
