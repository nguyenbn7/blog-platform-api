import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const { DATABASE_URL } = process.env;

if (!DATABASE_URL) throw new Error("DATABASE_URL is not found");

const pool = new Pool({
  connectionString: DATABASE_URL,
});

const db = drizzle({
  client: pool,
  schema: { ...schema },
  logger: true,
});

export default db;
