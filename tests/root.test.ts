import { expect, test } from "vitest";
import app from "../src/app";

test("GET /", async () => {
  const res = await app.request("/");

  expect(res.status).toBe(200);
  expect(await res.text()).toEqual("Hello Hono!");
});
