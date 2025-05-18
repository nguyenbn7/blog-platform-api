import { Hono } from "hono";

import categories from "./categories/router";
import posts from "./posts/router";
import tags from "./tags/router";

const app = new Hono()
  .route("/categories", categories)
  .route("/posts", posts)
  .route("/tags", tags);

export default app;
