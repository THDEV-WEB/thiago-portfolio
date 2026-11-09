import { cookies } from "next/headers";
import { db } from "./db";
import { ADMIN_COOKIE, PARTICIPANT_COOKIE, hashToken, verifyAdminSession } from "./security";
import type { Slot } from "./divergence";

export type CurrentParticipant = {
  id: string;
  declaredName: string;
  kind: "participant" | "admin";
  slot: Slot | null;
  tokenHash: string;
};

/** Participante dono do cookie desta requisição, se houver. */
export async function currentParticipant(): Promise<CurrentParticipant | null> {
  const token = (await cookies()).get(PARTICIPANT_COOKIE)?.value;
  if (!token) return null;
  const tokenHash = hashToken(token);
  const rows = await db()`
    select id, declared_name, kind, slot from awp.participants where token_hash = ${tokenHash}
  `;
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id as string,
    declaredName: row.declared_name as string,
    kind: row.kind as CurrentParticipant["kind"],
    slot: (row.slot as Slot | null) ?? null,
    tokenHash,
  };
}

export async function isAdmin(): Promise<boolean> {
  return verifyAdminSession((await cookies()).get(ADMIN_COOKIE)?.value);
}
