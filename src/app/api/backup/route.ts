import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { buildBackup, backupFilename } from "@/lib/backup";
import { logActivity } from "@/lib/activity";

/* Admin-only download of everything, as one JSON file. */
export async function GET() {
  const admin = await requireAdmin();
  const backup = await buildBackup();
  await logActivity(admin, "downloaded a backup");

  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${backupFilename(backup.takenAt)}"`,
      "Cache-Control": "no-store",
    },
  });
}
