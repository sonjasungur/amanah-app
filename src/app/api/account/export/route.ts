import { NextResponse } from "next/server";
import { getAuthenticatedUserId, getServerRepository } from "@/lib/server/auth-utils";

/** Art. 15 / 20 DSGVO: everything stored for the account, machine-readable. */
export async function GET(request: Request) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const repo = getServerRepository();
  const user = await repo.getUserById(userId);
  if (!user) {
    return NextResponse.json({ error: "Benutzer nicht gefunden." }, { status: 404 });
  }

  const body = {
    exportedAt: new Date().toISOString(),
    format: "amanah-account-export@1",
    account: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
    amanahData: await repo.getAmanahData(userId),
  };

  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="mein-wille-konto-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
