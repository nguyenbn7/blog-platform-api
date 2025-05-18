import type { DatabaseError } from "pg-protocol";

import db from "../lib/database";
import { tagTable } from "../lib/database/schema";
import { logDbError } from "../lib/database/error";
import { normalizeString } from "../lib";
import { eq, getTableColumns } from "drizzle-orm";

const { normalizedName, ...columns } = getTableColumns(tagTable);

export async function getTags() {
  return db.select({ ...columns }).from(tagTable);
}

type GetTagByIdErrorCode = "tag_not_found" | "cannot_get_tag";

export async function getTagById(searchParams: { id: string }) {
  const { id } = searchParams;

  try {
    const tags = await db
      .select({ ...columns })
      .from(tagTable)
      .where(eq(tagTable.id, id))
      .limit(1);

    const tag = tags.at(0);

    if (!tag) {
      const error = new Error("Tag Not Found") as DatabaseError;
      error.code = "22P02";
      throw error;
    }

    return {
      data: tag,
      errorCode: null,
    };
  } catch (e) {
    const error = e as DatabaseError;

    logDbError(getTagById, error);

    const result: { data: null; errorCode: GetTagByIdErrorCode } = {
      data: null,
      errorCode: "cannot_get_tag",
    };

    switch (error.code) {
      case "22P02":
        result.errorCode = "tag_not_found";
        break;

      default:
        break;
    }

    return result;
  }
}

type CreateTagErrorCode = "cannot_create_tag" | "duplicate_tag_name";

export async function createTag(data: {
  name: string;
  description: string | null;
}) {
  const { name, description } = data;

  try {
    const [tag] = await db
      .insert(tagTable)
      .values({
        name,
        description,
        normalizedName: normalizeString(name),
      })
      .returning({ ...columns });

    return {
      data: tag,
      errorCode: null,
    };
  } catch (e) {
    const error = e as DatabaseError;

    logDbError(createTag, error);

    const result: { data: null; errorCode: CreateTagErrorCode } = {
      data: null,
      errorCode: "cannot_create_tag",
    };

    switch (error.code) {
      case "23505":
        result.errorCode = "duplicate_tag_name";
        break;

      default:
        break;
    }

    return result;
  }
}

type UpdateTagErrorCode = "cannot_update_tag" | "duplicate_tag_name";

export async function updateTag(
  searchParams: { id: string },
  data: {
    name: string;
    description: string | null;
  }
) {
  const { id } = searchParams;

  const { name, description } = data;

  try {
    const [tag] = await db
      .update(tagTable)
      .set({
        name,
        description,
        normalizedName: normalizeString(name),
      })
      .where(eq(tagTable.id, id))
      .returning({ ...columns });

    return {
      data: tag,
      errorCode: null,
    };
  } catch (e) {
    const error = e as DatabaseError;

    logDbError(updateTag, error);

    const result: { data: null; errorCode: UpdateTagErrorCode } = {
      data: null,
      errorCode: "cannot_update_tag",
    };

    switch (error.code) {
      case "23505":
        result.errorCode = "duplicate_tag_name";
        break;
      default:
        break;
    }

    return result;
  }
}

type DeleteTagErrorCode = "cannot_delete_tag" | "tag_not_found";

export async function deleteTag(searchParams: { id: string }) {
  const { id } = searchParams;

  try {
    const tags = await db
      .delete(tagTable)
      .where(eq(tagTable.id, id))
      .returning({ id: tagTable.id });

    const tag = tags.at(0);

    if (!tag) {
      const error = new Error("Tag Not Found") as DatabaseError;
      error.code = "22P02";
      throw error;
    }

    return {
      data: tag,
      errorCode: null,
    };
  } catch (e) {
    const error = e as DatabaseError;

    logDbError(deleteTag, error);

    const result: { data: null; errorCode: DeleteTagErrorCode } = {
      data: null,
      errorCode: "cannot_delete_tag",
    };

    switch (error.code) {
      case "22P02":
        result.errorCode = "tag_not_found";
        break;

      default:
        break;
    }

    return result;
  }
}
