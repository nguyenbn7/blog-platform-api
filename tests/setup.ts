import { execSync } from "node:child_process";
import { GenericContainer, type StartedTestContainer } from "testcontainers";

const TEST_DATABASE = "blog_test_db";
const TEST_PASSWORD = "test";
const PORT = 5433;
const DATABASE_URL = `postgresql://postgres:${TEST_PASSWORD}@localhost:${PORT}/${TEST_DATABASE}`;

const globalThisExtended = globalThis as typeof globalThis & {
  container: StartedTestContainer;
};

export async function setup() {
  try {
    console.log("Starting postgres docker");
    const container = await new GenericContainer("postgres:17-alpine")
      .withEnvironment({ POSTGRES_DB: TEST_DATABASE })
      .withEnvironment({ POSTGRES_PASSWORD: TEST_PASSWORD })
      .withExposedPorts({ container: 5432, host: PORT })
      .start();

    if (!globalThisExtended.container) {
      globalThisExtended.container = container;

      execSync("bun run db:push", {
        env: {
          DATABASE_URL,
        },
      });
    }

    console.log("Done setup");
  } catch (error) {
    console.log("Something went wrong:", error);
    throw error;
  }
}

export async function teardown() {
  try {
    if (globalThisExtended.container) {
      await globalThisExtended.container.stop();
    }
  } catch {}
}
