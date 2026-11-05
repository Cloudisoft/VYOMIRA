import { authed, json } from "@/server/http";
import { balance } from "@/server/billing/entitlements";

export const GET = authed("usage", async (_req, { user }) => json({ balance: await balance(user.id) }));
