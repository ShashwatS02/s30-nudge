import {
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex
} from "drizzle-orm/pg-core";

export const spaceTypeEnum = pgEnum("space_type", ["personal", "home", "business"]);
export const memberRoleEnum = pgEnum("member_role", ["owner", "editor", "viewer"]);
export const itemTypeEnum = pgEnum("item_type", [
  "task",
  "bill",
  "renewal",
  "follow_up",
  "appointment",
  "document_request"
]);
export const itemStatusEnum = pgEnum("item_status", [
  "open",
  "in_progress",
  "done",
  "overdue",
  "cancelled"
]);

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    fullName: text("full_name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    emailUniqueIdx: uniqueIndex("users_email_unique_idx").on(table.email)
  })
);

export const spaces = pgTable("spaces", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  spaceType: spaceTypeEnum("space_type").notNull(),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const spaceMembers = pgTable(
  "space_members",
  {
    spaceId: text("space_id")
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: memberRoleEnum("role").notNull().default("viewer"),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    pk: primaryKey({ columns: [table.spaceId, table.userId] })
  })
);

export const items = pgTable("items", {
  id: text("id").primaryKey(),
  spaceId: text("space_id")
    .notNull()
    .references(() => spaces.id, { onDelete: "cascade" }),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  title: text("title").notNull(),
  description: text("description"),
  itemType: itemTypeEnum("item_type").notNull(),
  status: itemStatusEnum("status").notNull().default("open"),
  priority: integer("priority").notNull().default(50),
  dueAt: timestamp("due_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  snoozedUntil: timestamp("snoozed_until", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});
