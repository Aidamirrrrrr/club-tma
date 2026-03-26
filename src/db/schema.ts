import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

/** Таблица пользователей. */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  telegramId: text("telegram_id").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").default(""),
  username: text("username").default(""),
  photoUrl: text("photo_url").default(""),
  bio: text("bio").default(""),
  instagram: text("instagram").default(""),
  telegram: text("telegram").default(""),
  phone: text("phone").default(""),
  profileGradient: text("profile_gradient").default("default"),
  role: text("role").$type<"user" | "admin">().notNull().default("user"),
  blocked: boolean("blocked").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** Таблица мероприятий. */
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  date: text("date").notNull(),
  time: text("time").notNull().default(""),
  location: text("location").notNull().default(""),
  coverUrl: text("cover_url").default(""),
  maxParticipants: integer("max_participants").default(0),
  status: text("status")
    .$type<"open" | "closed" | "cancelled" | "completed">()
    .notNull()
    .default("open"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** Таблица регистраций (связь пользователь — мероприятие). */
export const registrations = pgTable(
  "registrations",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [unique().on(t.userId, t.eventId)],
);

export const usersRelations = relations(users, ({ many }) => ({
  registrations: many(registrations),
  createdEvents: many(events),
  communityRequests: many(communityRequests),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  creator: one(users, {
    fields: [events.createdBy],
    references: [users.id],
  }),
  registrations: many(registrations),
}));

export const registrationsRelations = relations(registrations, ({ one }) => ({
  user: one(users, {
    fields: [registrations.userId],
    references: [users.id],
  }),
  event: one(events, {
    fields: [registrations.eventId],
    references: [events.id],
  }),
}));

/** Таблица запросов в сообщество. */
export const communityRequests = pgTable("community_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  status: text("status")
    .$type<"pending" | "reviewed">()
    .notNull()
    .default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** Таблица чатов и каналов. */
export const chats = pgTable("chats", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  description: text("description").default(""),
  sort: integer("sort").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const communityRequestsRelations = relations(
  communityRequests,
  ({ one }) => ({
    user: one(users, {
      fields: [communityRequests.userId],
      references: [users.id],
    }),
  }),
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type Registration = typeof registrations.$inferSelect;
export type NewRegistration = typeof registrations.$inferInsert;
export type CommunityRequest = typeof communityRequests.$inferSelect;
export type NewCommunityRequest = typeof communityRequests.$inferInsert;
export type Chat = typeof chats.$inferSelect;
export type NewChat = typeof chats.$inferInsert;
