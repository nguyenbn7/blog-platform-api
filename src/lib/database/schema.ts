import { relations, sql } from "drizzle-orm";
import {
  boolean,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const categoryTable = pgTable(
  "category",
  {
    id: uuid().primaryKey().defaultRandom(),
    name: varchar({ length: 255 }).notNull(),
    normalizedName: varchar("normalized_name", { length: 255 })
      .notNull()
      .unique(),
    slug: varchar({ length: 255 }).notNull().unique(),
    description: text(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    uniqueIndex("name_idx").on(table.normalizedName),
    uniqueIndex("slug_category_idx").on(table.slug),
  ]
);

export const categoryRelations = relations(categoryTable, ({ many }) => ({
  posts: many(postTable),
}));

export const postTable = pgTable(
  "post",
  {
    id: uuid().primaryKey().defaultRandom(),
    title: varchar({ length: 255 }).notNull(),
    normalizedTitle: varchar("normalized_title", { length: 255 })
      .notNull()
      .unique(),
    slug: varchar({ length: 255 }).notNull().unique(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdateFn(() => new Date()),
    published: boolean().default(false),
    content: text().notNull(),
    categoryId: uuid("category_id").references(() => categoryTable.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    uniqueIndex("title_idx").on(table.normalizedTitle),
    uniqueIndex("slug_post_idx").on(table.slug),
  ]
);

export const postRelations = relations(postTable, ({ one, many }) => ({
  category: one(categoryTable, {
    fields: [postTable.categoryId],
    references: [categoryTable.id],
  }),
  postsToTags: many(postsToTags),
}));

export const tagTable = pgTable("tag", {
  id: uuid().defaultRandom().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  normalizedName: varchar("normalized_name", { length: 255 })
    .notNull()
    .unique(),
  description: text(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});

export const tagRelations = relations(tagTable, ({ many }) => ({
  postsToTags: many(postsToTags),
}));

export const postsToTags = pgTable(
  "posts_to_tags",
  {
    postId: uuid("post_id")
      .notNull()
      .references(() => postTable.id),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tagTable.id),
  },
  (t) => [primaryKey({ columns: [t.postId, t.tagId] })]
);

export const postsToTagsRelations = relations(postsToTags, ({ one }) => ({
  post: one(postTable, {
    fields: [postsToTags.postId],
    references: [postTable.id],
  }),
  tag: one(tagTable, {
    fields: [postsToTags.tagId],
    references: [tagTable.id],
  }),
}));
