import { zValidator as zv } from "@hono/zod-validator";
import { ValidationTargets } from "hono/types";
import { ZodSchema } from "zod";
import { StatusCodes } from "http-status-codes";

export const zValidator = <
  Target extends keyof ValidationTargets,
  TSchema extends ZodSchema
>(
  target: Target,
  schema: TSchema
) =>
  zv(target, schema, (result, c) => {
    if (result.success) return;

    const { errors } = result.error;

    if (target === "json")
      return c.json({
        title: "Validation Error",
        detail: "The request body is invalid",
        status: StatusCodes.BAD_REQUEST,
        errors: errors.map((e) => ({
          detail: e.message,
          pointer: `/${e.path.join("/")}`,
          code: e.code,
        })),
      });
  });
