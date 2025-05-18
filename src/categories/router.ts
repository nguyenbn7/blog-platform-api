import { Hono } from "hono";

import { categorySchema } from "./schema.js";
import {
  createCategory,
  deleteCategory,
  getCategories,
  getCategoryById,
  updateCategory,
} from "./repository.js";

import { zValidator } from "../lib/middleware.js";

import { ReasonPhrases, StatusCodes } from "http-status-codes";

const app = new Hono()
  .get("/", async (c) => {
    const categories = await getCategories();

    return c.json({
      categories,
    });
  })
  .get("/:id", async (c) => {
    const { id } = c.req.param();

    const { data: category, errorCode } = await getCategoryById({ id });

    if (errorCode) {
      if (errorCode === "category_not_found")
        return c.json(
          {
            title: ReasonPhrases.NOT_FOUND,
            status: StatusCodes.NOT_FOUND,
            detail: `Category with id '${id}' not found`,
          },
          StatusCodes.NOT_FOUND
        );
      else
        return c.json(
          {
            title: "Unknown Error",
            status: -1,
            detail: `Cannot get post due to unknown error`,
          },
          -1
        );
    }

    return c.json({
      category,
    });
  })
  .post("/", zValidator("json", categorySchema), async (c) => {
    const { name, description } = c.req.valid("json");

    const { data: category, errorCode } = await createCategory({
      name,
      description: description ?? null,
    });

    if (errorCode) {
      if (errorCode === "duplicate_category_name")
        return c.json(
          {
            title: ReasonPhrases.CONFLICT,
            detail: `Category '${name}' existed`,
            status: StatusCodes.CONFLICT,
          },
          StatusCodes.CONFLICT
        );
      else
        return c.json(
          {
            title: ReasonPhrases.UNPROCESSABLE_ENTITY,
            detail: "Cannot create category",
            status: StatusCodes.UNPROCESSABLE_ENTITY,
          },
          StatusCodes.UNPROCESSABLE_ENTITY
        );
    }

    return c.json(
      {
        category,
      },
      StatusCodes.CREATED
    );
  })
  .put("/:id", zValidator("json", categorySchema.partial()), async (c) => {
    const { id } = c.req.param();
    const { name, description } = c.req.valid("json");

    const { data: existedCategory, errorCode: getCategoryErrorCode } =
      await getCategoryById({ id });

    if (getCategoryErrorCode) {
      if (getCategoryErrorCode === "category_not_found")
        return c.json(
          {
            status: StatusCodes.NOT_FOUND,
            title: ReasonPhrases.NOT_FOUND,
            detail: `Category with id '${id}' not found`,
          },
          StatusCodes.NOT_FOUND
        );
      else
        return c.json(
          {
            title: "Unknown Error",
            detail: `Cannot get category with id '${id}'`,
            status: -1,
          },
          -1
        );
    }

    const { data: category, errorCode: updateCategoryErrorCode } =
      await updateCategory(
        { id },
        {
          name: name ?? existedCategory.name,
          description:
            description === undefined
              ? existedCategory.description
              : description,
        }
      );

    if (updateCategoryErrorCode) {
      if (updateCategoryErrorCode === "duplicate_category_name")
        return c.json(
          {
            title: ReasonPhrases.CONFLICT,
            detail: `Category '${name}' existed`,
            status: StatusCodes.CONFLICT,
          },
          StatusCodes.CONFLICT
        );
      else
        return c.json(
          {
            title: ReasonPhrases.UNPROCESSABLE_ENTITY,
            detail: "Cannot update category",
            status: StatusCodes.UNPROCESSABLE_ENTITY,
          },
          StatusCodes.UNPROCESSABLE_ENTITY
        );
    }

    return c.json({
      category,
    });
  })
  .delete("/:id", async (c) => {
    const { id } = c.req.param();

    const { data: _, errorCode } = await deleteCategory({ id });

    if (errorCode) {
      if (errorCode === "category_not_found")
        return c.json(
          {
            title: ReasonPhrases.NOT_FOUND,
            detail: `Category with id '${id}' not found`,
            status: StatusCodes.NOT_FOUND,
          },
          StatusCodes.NOT_FOUND
        );
      else
        return c.json(
          {
            title: "Unknown Error",
            detail: `Cannot delete category with id '${id}'`,
            status: -1,
          },
          -1
        );
    }

    return c.body(null, StatusCodes.NO_CONTENT);
  });

export default app;
