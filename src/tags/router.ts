import { Hono } from "hono";

import { tagSchema } from "./schema";
import {
  createTag,
  deleteTag,
  getTags,
  getTagById,
  updateTag,
} from "./repository";

import { zValidator } from "../lib/middleware";

import { ReasonPhrases, StatusCodes } from "http-status-codes";

const app = new Hono()
  .get("/", async (c) => {
    const tags = await getTags();

    return c.json({
      tags,
    });
  })
  .get("/:id", async (c) => {
    const { id } = c.req.param();

    const { data: tag, errorCode } = await getTagById({ id });

    if (errorCode) {
      if (errorCode === "tag_not_found")
        return c.json(
          {
            title: ReasonPhrases.NOT_FOUND,
            status: StatusCodes.NOT_FOUND,
            detail: `Tag with id '${id}' not found`,
          },
          StatusCodes.NOT_FOUND
        );
      else
        return c.json(
          {
            title: "Unknown Error",
            status: -1,
            detail: `Cannot get tag due to unknown error`,
          },
          -1
        );
    }

    return c.json({
      tag,
    });
  })
  .post("/", zValidator("json", tagSchema), async (c) => {
    const { name, description } = c.req.valid("json");

    const { data: tag, errorCode } = await createTag({
      name,
      description: description ?? null,
    });

    if (errorCode) {
      if (errorCode === "duplicate_tag_name")
        return c.json(
          {
            title: ReasonPhrases.CONFLICT,
            detail: `Tag '${name}' existed`,
            status: StatusCodes.CONFLICT,
          },
          StatusCodes.CONFLICT
        );
      else
        return c.json(
          {
            title: ReasonPhrases.UNPROCESSABLE_ENTITY,
            detail: "Cannot create tag",
            status: StatusCodes.UNPROCESSABLE_ENTITY,
          },
          StatusCodes.UNPROCESSABLE_ENTITY
        );
    }

    return c.json(
      {
        tag,
      },
      StatusCodes.CREATED
    );
  })
  .put("/:id", zValidator("json", tagSchema.partial()), async (c) => {
    const { id } = c.req.param();
    const { name, description } = c.req.valid("json");

    const { data: existedTag, errorCode: getTagErrorCode } = await getTagById({
      id,
    });

    if (getTagErrorCode) {
      if (getTagErrorCode === "tag_not_found")
        return c.json(
          {
            status: StatusCodes.NOT_FOUND,
            title: ReasonPhrases.NOT_FOUND,
            detail: `Tag with id '${id}' not found`,
          },
          StatusCodes.NOT_FOUND
        );
      else
        return c.json(
          {
            title: "Unknown Error",
            detail: `Cannot get tag with id '${id}'`,
            status: -1,
          },
          -1
        );
    }

    const { data: tag, errorCode: updateTagErrorCode } = await updateTag(
      { id },
      {
        name: name ?? existedTag.name,
        description:
          description === undefined ? existedTag.description : description,
      }
    );

    if (updateTagErrorCode) {
      if (updateTagErrorCode === "duplicate_tag_name")
        return c.json(
          {
            title: ReasonPhrases.CONFLICT,
            detail: `Tag '${name}' existed`,
            status: StatusCodes.CONFLICT,
          },
          StatusCodes.CONFLICT
        );
      else
        return c.json(
          {
            title: ReasonPhrases.UNPROCESSABLE_ENTITY,
            detail: "Cannot update tag",
            status: StatusCodes.UNPROCESSABLE_ENTITY,
          },
          StatusCodes.UNPROCESSABLE_ENTITY
        );
    }

    return c.json({
      tag,
    });
  })
  .delete("/:id", async (c) => {
    const { id } = c.req.param();

    const { data: _, errorCode } = await deleteTag({ id });

    if (errorCode) {
      if (errorCode === "tag_not_found")
        return c.json(
          {
            title: ReasonPhrases.NOT_FOUND,
            detail: `Tag with id '${id}' not found`,
            status: StatusCodes.NOT_FOUND,
          },
          StatusCodes.NOT_FOUND
        );
      else
        return c.json(
          {
            title: "Unknown Error",
            detail: `Cannot delete tag with id '${id}'`,
            status: -1,
          },
          -1
        );
    }

    return c.body(null, StatusCodes.NO_CONTENT);
  });

export default app;
