import { test, expect } from "vitest";
import app from "../src/app";

test("GET /api/posts", async () => {
  const res = await app.request("/api/posts");

  expect(res.status).toBe(200);
  
  const data = await res.json();

  expect(data.data.length).toBeGreaterThanOrEqual(0);
});
