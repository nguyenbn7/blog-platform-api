import type { DatabaseError } from "pg-protocol";

import db from "../lib/database";
import { categoryTable } from "../lib/database/schema";
import { logDbError } from "../lib/database/error";
import { normalizeString } from "../lib";
import { eq, getTableColumns } from "drizzle-orm";
import slug from "slug";

const { normalizedName, ...columns } = getTableColumns(categoryTable);

export async function getCategories() {
  return db.select({ ...columns }).from(categoryTable);
}

type GetCategoryByIdErrorCode = "category_not_found" | "cannot_get_category";

export async function getCategoryById(searchParams: { id: string }) {
  const { id } = searchParams;

  try {
    const categories = await db
      .select({ ...columns })
      .from(categoryTable)
      .where(eq(categoryTable.id, id))
      .limit(1);

    const category = categories.at(0);

    if (!category) {
      const error = new Error("Category Not Found") as DatabaseError;
      error.code = "22P02";
      throw error;
    }

    return {
      data: category,
      errorCode: null,
    };
  } catch (e) {
    const error = e as DatabaseError;

    logDbError(getCategoryById, error);

    const result: { data: null; errorCode: GetCategoryByIdErrorCode } = {
      data: null,
      errorCode: "cannot_get_category",
    };

    switch (error.code) {
      case "22P02":
        result.errorCode = "category_not_found";
        break;

      default:
        break;
    }

    return result;
  }
}

type CreateCategoryErrorCode =
  | "cannot_create_category"
  | "duplicate_category_name";

export async function createCategory(data: {
  name: string;
  description: string | null;
}) {
  const { name, description } = data;

  try {
    const [category] = await db
      .insert(categoryTable)
      .values({
        name,
        description,
        normalizedName: normalizeString(name),
        slug: slug(name),
      })
      .returning({ ...columns });

    return {
      data: category,
      errorCode: null,
    };
  } catch (e) {
    const error = e as DatabaseError;

    logDbError(createCategory, error);

    const result: { data: null; errorCode: CreateCategoryErrorCode } = {
      data: null,
      errorCode: "cannot_create_category",
    };

    switch (error.code) {
      case "23505":
        result.errorCode = "duplicate_category_name";
        break;

      default:
        break;
    }

    return result;
  }
}

type UpdateCategoryErrorCode =
  | "cannot_update_category"
  | "duplicate_category_name";

export async function updateCategory(
  searchParams: { id: string },
  data: {
    name: string;
    description: string | null;
  }
) {
  const { id } = searchParams;

  const { name, description } = data;

  try {
    const [category] = await db
      .update(categoryTable)
      .set({
        name,
        description,
        normalizedName: normalizeString(name),
        slug: slug(name),
      })
      .where(eq(categoryTable.id, id))
      .returning({ ...columns });

    return {
      data: category,
      errorCode: null,
    };
  } catch (e) {
    const error = e as DatabaseError;

    logDbError(updateCategory, error);

    const result: { data: null; errorCode: UpdateCategoryErrorCode } = {
      data: null,
      errorCode: "cannot_update_category",
    };

    switch (error.code) {
      case "23505":
        result.errorCode = "duplicate_category_name";
        break;
      default:
        break;
    }

    return result;
  }
}

type DeleteCategoryErrorCode = "cannot_delete_category" | "category_not_found";

export async function deleteCategory(searchParams: { id: string }) {
  const { id } = searchParams;

  try {
    const categories = await db
      .delete(categoryTable)
      .where(eq(categoryTable.id, id))
      .returning({ id: categoryTable.id });

    const category = categories.at(0);

    if (!category) {
      const error = new Error("Category Not Found") as DatabaseError;
      error.code = "22P02";
      throw error;
    }

    return {
      data: category,
      errorCode: null,
    };
  } catch (e) {
    const error = e as DatabaseError;

    logDbError(deleteCategory, error);

    const result: { data: null; errorCode: DeleteCategoryErrorCode } = {
      data: null,
      errorCode: "cannot_delete_category",
    };

    switch (error.code) {
      case "22P02":
        result.errorCode = "category_not_found";
        break;

      default:
        break;
    }

    return result;
  }
}
