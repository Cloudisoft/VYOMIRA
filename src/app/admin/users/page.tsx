import { db } from "@/server/db";

/** Account-level summary. Birth details are intentionally NOT shown (they are encrypted and private). */
export default async function AdminUsers() {
  const users = await db.user.findMany({ orderBy: { createdAt: "desc" }, take: 100, select: { id: true, email: true, role: true, createdAt: true, _count: { select: { birthProfiles: true, conversations: true, payments: true } }, entitlements: { select: { kind: true, remaining: true } } } });
  return (
    <div>
      <h1 className="text-4xl">Users</h1>
      <p className="mt-2 text-sm text-slate">Latest 100 accounts. Birth data is never displayed here.</p>
      <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm">
        <thead className="text-xs tracking-widest text-slate uppercase"><tr><th className="py-2">Email</th><th>Role</th><th>Joined</th><th>Profiles</th><th>Conversations</th><th>Payments</th><th>AI balance</th></tr></thead>
        <tbody>{users.map((u) => <tr key={u.id} className="border-t hairline"><td className="py-2">{u.email}</td><td>{u.role}</td><td>{u.createdAt.toLocaleDateString("en-GB")}</td><td>{u._count.birthProfiles}</td><td>{u._count.conversations}</td><td>{u._count.payments}</td><td>{u.entitlements.filter((e) => e.kind === "ai_messages").reduce((s, e) => s + e.remaining, 0)}</td></tr>)}</tbody>
      </table></div>
    </div>
  );
}
