const path = require("node:path");
const dotenv = require("dotenv");
const { defineConfig } = require("drizzle-kit");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

if (!process.env.DATABASE_URL) {
  throw new Error("Missing DATABASE_URL in environment");
}

module.exports = defineConfig({
  out: "./drizzle",
  schema: "./src/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL
  }
});
