import { Hono } from "hono";

import { postSchema } from "./schema";
import {
  createPost,
  deletePost,
  getPostById,
  getPosts,
  updatePost,
} from "./repository";

import { zValidator } from "../lib/middleware";

import { ReasonPhrases, StatusCodes } from "http-status-codes";

const app = new Hono()
  .get("/", async (c) => {
    const posts = await getPosts();

    return c.json({
      posts,
    });
  })
  .get("/:id", async (c) => {
    const { id } = c.req.param();

    const { data, errorCode } = await getPostById({ id });

    if (errorCode) {
      if (errorCode === "post_not_found")
        return c.json(
          {
            title: ReasonPhrases.NOT_FOUND,
            detail: `Post with id '${id}' not found`,
            status: StatusCodes.NOT_FOUND,
          },
          StatusCodes.NOT_FOUND
        );
      else
        return c.json(
          {
            title: "Unknown Error",
            detail: `Cannot get post with id '${id}'`,
            status: -1,
          },
          -1
        );
    }

    const { categoryId, ...post } = data;

    return c.json({
      post,
    });
  })
  .post("/", zValidator("json", postSchema), async (c) => {
    const { title, categoryId, content, published } = c.req.valid("json");

    const { data: post, errorCode } = await createPost({
      title,
      categoryId,
      content,
      published,
    });

    if (errorCode) {
      if (errorCode === "duplicate_post_title")
        return c.json(
          {
            title: ReasonPhrases.CONFLICT,
            detail: `Post '${title}' existed`,
            status: StatusCodes.CONFLICT,
          },
          StatusCodes.CONFLICT
        );
      else if (errorCode === "category_not_found")
        return c.json(
          {
            title: ReasonPhrases.NOT_FOUND,
            detail: "Category not found",
            status: StatusCodes.NOT_FOUND,
          },
          StatusCodes.NOT_FOUND
        );
      else
        return c.json(
          {
            title: ReasonPhrases.UNPROCESSABLE_ENTITY,
            detail: "Cannot create post",
            status: StatusCodes.UNPROCESSABLE_ENTITY,
          },
          StatusCodes.UNPROCESSABLE_ENTITY
        );
    }

    return c.json(
      {
        post,
      },
      StatusCodes.CREATED
    );
  })
  .put("/:id", zValidator("json", postSchema.partial()), async (c) => {
    const { id } = c.req.param();
    const { title, categoryId, content, published } = c.req.valid("json");

    const { data: existedPost, errorCode: getPostErrorCode } =
      await getPostById({ id });

    if (getPostErrorCode) {
      if (getPostErrorCode === "post_not_found")
        return c.json(
          {
            status: StatusCodes.NOT_FOUND,
            title: ReasonPhrases.NOT_FOUND,
            detail: `Post with id '${id}' not found`,
          },
          StatusCodes.NOT_FOUND
        );
      else
        return c.json(
          {
            title: "Unknown Error",
            detail: `Cannot get post with id '${id}'`,
            status: -1,
          },
          -1
        );
    }

    const { data: updatedPost, errorCode: updatePostErrorCode } =
      await updatePost(
        { id },
        {
          title: title ?? existedPost.title,
          content: content ?? existedPost.content,
          categoryId:
            categoryId === undefined ? existedPost.categoryId : categoryId,
          published:
            published === undefined ? existedPost.published : published,
        }
      );

    if (updatePostErrorCode) {
      if (updatePostErrorCode === "duplicate_post_title")
        return c.json(
          {
            title: ReasonPhrases.CONFLICT,
            detail: `Post '${title}' existed`,
            status: StatusCodes.CONFLICT,
          },
          StatusCodes.CONFLICT
        );
      else if (updatePostErrorCode === "category_not_found")
        return c.json(
          {
            title: ReasonPhrases.NOT_FOUND,
            detail: "Category not found",
            status: StatusCodes.NOT_FOUND,
          },
          StatusCodes.NOT_FOUND
        );
      else
        return c.json(
          {
            title: ReasonPhrases.UNPROCESSABLE_ENTITY,
            detail: "Cannot update post",
            status: StatusCodes.UNPROCESSABLE_ENTITY,
          },
          StatusCodes.UNPROCESSABLE_ENTITY
        );
    }

    const { categoryId: _, ...post } = updatedPost;

    return c.json({
      post,
    });
  })
  .delete("/:id", async (c) => {
    const { id } = c.req.param();

    const { data: _, errorCode } = await deletePost({ id });

    if (errorCode) {
      if (errorCode === "post_not_found")
        return c.json(
          {
            title: ReasonPhrases.NOT_FOUND,
            detail: `Post with id '${id}' not found`,
            status: StatusCodes.NOT_FOUND,
          },
          StatusCodes.NOT_FOUND
        );
      else
        return c.json(
          {
            title: "Unknown Error",
            detail: `Cannot delete post with id '${id}'`,
            status: -1,
          },
          -1
        );
    }

    return c.body(null, StatusCodes.NO_CONTENT);
  });

export default app;
