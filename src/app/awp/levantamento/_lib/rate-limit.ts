import { db } from "./db";

export type AttemptScope = "participant" | "admin";

export const MAX_FAILURES = 5;
export const WINDOW_MINUTES = 15;

/** Bloqueio temporário após várias tentativas erradas do mesmo IP. */
export async function isBlocked(scope: AttemptScope, ipHash: string): Promise<boolean> {
  const [row] = await db()`
    select count(*)::int as failures from awp.access_attempts
    where scope = ${scope} and ip_hash = ${ipHash} and not success
      and created_at > now() - make_interval(mins => ${WINDOW_MINUTES}::int)
  `;
  return (row?.failures as number) >= MAX_FAILURES;
}

export async function recordAttempt(scope: AttemptScope, ipHash: string, success: boolean) {
  await db()`
    insert into awp.access_attempts (scope, ip_hash, success) values (${scope}, ${ipHash}, ${success})
  `;
  await db()`delete from awp.access_attempts where created_at < now() - interval '2 days'`;
}
