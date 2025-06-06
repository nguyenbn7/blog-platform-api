import type { DatabaseError } from "pg-protocol";

import db from "../lib/database/index.js";
import {
  categoryTable,
  postsToTags,
  postTable,
  tagTable,
} from "../lib/database/schema.js";
import { logDbError } from "../lib/database/error.js";
import { normalizeString } from "../lib/index.js";
import { eq, getTableColumns, inArray } from "drizzle-orm";
import slug from "slug";

const { normalizedTitle, categoryId, ...columns } = getTableColumns(postTable);

export async function getPosts() {
  return db.query.postTable.findMany({
    with: {
      category: {
        columns: {
          name: true,
        },
      },
      postsToTags: {
        columns: {},
        with: {
          tag: {
            columns: {
              name: true,
            },
          },
        },
      },
    },
    columns: {
      id: true,
      title: true,
      slug: true,
      published: true,
      createdAt: true,
      updatedAt: true,
      content: true,
    },
  });
}

type GetPostByIdErrorCode = "post_not_found" | "cannot_get_post";

export async function getPostById(searchParams: { id: string }) {
  const { id } = searchParams;

  try {
    const posts = await db
      .select({
        ...columns,
        categoryId,
        category: categoryTable.name,
      })
      .from(postTable)
      .leftJoin(categoryTable, eq(postTable.categoryId, categoryTable.id))
      .where(eq(postTable.id, id))
      .limit(1);

    const post = posts.at(0);

    if (!post) {
      const error = new Error("Post Not Found") as DatabaseError;
      error.code = "22P02";
      throw error;
    }

    const tags = await db
      .select({ name: tagTable.name })
      .from(tagTable)
      .innerJoin(postsToTags, eq(postsToTags.tagId, tagTable.id))
      .where(eq(postsToTags.postId, post.id));

    return {
      data: { ...post, tags: tags.map((t) => t.name) },
      errorCode: null,
    };
  } catch (e) {
    const error = e as DatabaseError;

    logDbError(getPostById, error);

    const result: { data: null; errorCode: GetPostByIdErrorCode } = {
      data: null,
      errorCode: "cannot_get_post",
    };

    switch (error.code) {
      case "22P02":
        result.errorCode = "post_not_found";
        break;
      default:
        break;
    }

    return result;
  }
}

type CreatePostErrorCode =
  | "duplicate_post_title"
  | "category_not_found"
  | "cannot_create_post";

export async function createPost(data: {
  title: string;
  content: string;
  categoryId?: string | null;
  published?: boolean;
  tagIds: string[];
}) {
  const { title, content, categoryId, published, tagIds } = data;

  try {
    const [post] = await db
      .insert(postTable)
      .values({
        title,
        content,
        normalizedTitle: normalizeString(title),
        published,
        slug: slug(title),
        categoryId,
      })
      .returning({
        ...columns,
        categoryId: postTable.categoryId,
      });

    if (post.categoryId) {
      const [category] = await db
        .select({ name: categoryTable.name })
        .from(categoryTable)
        .where(eq(categoryTable.id, post.categoryId));

      return {
        data: { ...post, category: category.name },
        errorCode: null,
      };
    }
    let tags: { id: string; name: string }[] = [];

    if (tagIds.length > 0) {
      const selectedTags = await db
        .select({ id: tagTable.id, name: tagTable.name })
        .from(tagTable)
        .where(inArray(tagTable.id, tagIds));

      await db
        .insert(postsToTags)
        .values(
          selectedTags.map((tag) => ({ postId: post.id, tagId: tag.id }))
        );

      tags = selectedTags;
    }

    return {
      data: { ...post, category: null, tags: tags.map((t) => t.name) },
      errorCode: null,
    };
  } catch (e) {
    const error = e as DatabaseError;

    logDbError(createPost, error);

    const result: { data: null; errorCode: CreatePostErrorCode } = {
      data: null,
      errorCode: "cannot_create_post",
    };

    switch (error.code) {
      case "23505":
        result.errorCode = "duplicate_post_title";
        break;
      case "23503":
      case "22P02":
        result.errorCode = "category_not_found";
        break;
      default:
        break;
    }

    return result;
  }
}

type UpdatePostErrorCode =
  | "cannot_update_post"
  | "category_not_found"
  | "duplicate_post_title";

export async function updatePost(
  searchParams: { id: string },
  data: {
    title: string;
    content: string;
    categoryId: string | null;
    published: boolean | null;
    tagIds: string[] | undefined;
  }
) {
  const { id } = searchParams;

  const { title, content, categoryId, published, tagIds } = data;

  try {
    const [post] = await db
      .update(postTable)
      .set({
        title,
        content,
        normalizedTitle: normalizeString(title),
        published,
        slug: slug(title),
        categoryId: categoryId ?? null,
      })
      .where(eq(postTable.id, id))
      .returning({
        ...columns,
        categoryId: postTable.categoryId,
      });

    if (tagIds) {
      await db.delete(postsToTags).where(eq(postsToTags.postId, post.id));
    }
    let tags: { id: string; name: string }[] = [];

    if (tagIds && tagIds.length > 0) {
      const selectedTags = await db
        .select({ id: tagTable.id, name: tagTable.name })
        .from(tagTable)
        .where(inArray(tagTable.id, tagIds));

      await db
        .insert(postsToTags)
        .values(
          selectedTags.map((tag) => ({ postId: post.id, tagId: tag.id }))
        );

      tags = selectedTags;
    }

    if (post.categoryId) {
      const [category] = await db
        .select({ name: categoryTable.name })
        .from(categoryTable)
        .where(eq(categoryTable.id, post.categoryId));

      return {
        data: {
          ...post,
          category: category.name,
          tags: tags.map((t) => t.name),
        },
        errorCode: null,
      };
    }

    return {
      data: { ...post, category: null },
      errorCode: null,
    };
  } catch (e) {
    const error = e as DatabaseError;

    logDbError(updatePost, error);

    const result: { data: null; errorCode: UpdatePostErrorCode } = {
      data: null,
      errorCode: "cannot_update_post",
    };

    switch (error.code) {
      case "23505":
        result.errorCode = "duplicate_post_title";
        break;
      case "23503":
      case "22P02":
        result.errorCode = "category_not_found";
        break;
      default:
        break;
    }

    return result;
  }
}

type DeletePostErrorCode = "post_not_found" | "cannot_delete_post";

export async function deletePost(searchParams: { id: string }) {
  const { id } = searchParams;

  try {
    const posts = await db
      .delete(postTable)
      .where(eq(postTable.id, id))
      .returning({ id: postTable.id });

    const post = posts.at(0);

    if (!post) {
      const error = new Error("Post Not Found") as DatabaseError;
      error.code = "22P02";
      throw error;
    }

    return {
      data: post,
      errorCode: null,
    };
  } catch (e) {
    const error = e as DatabaseError;

    logDbError(deletePost, error);

    const result: { data: null; errorCode: DeletePostErrorCode } = {
      data: null,
      errorCode: "cannot_delete_post",
    };

    switch (error.code) {
      case "22P02":
        result.errorCode = "post_not_found";
        break;

      default:
        break;
    }

    return result;
  }
}
