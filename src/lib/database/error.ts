import type { DatabaseError } from "pg-protocol";

export async function logDbError(func: Function, error: DatabaseError) {
  const functionName = func.name;

  console.error(`Error when calling ${functionName}():`);
  console.log(error);
}
