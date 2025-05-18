import { Hono } from "hono";

import categories from "./categories/router.js";
import posts from "./posts/router.js";
import tags from "./tags/router.js";

const app = new Hono()
  .route("/categories", categories)
  .route("/posts", posts)
  .route("/tags", tags);

export default app;
