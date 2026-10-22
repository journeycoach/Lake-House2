import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { ReportIssueForm } from "../report-issue-form";

export const metadata: Metadata = { title: "Report an Issue · Paine Pointe" };

export default async function ReportIssuePage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Report an Issue"
        action={
          <Link
            href="/upkeep?tab=fixit"
            className="btn btn-quiet"
          >
            ← Back to Property Care
          </Link>
        }
      />

      <section className="rounded-lh border border-water/30 border-l-4 bg-water-tint p-4 sm:p-6">
        <p className="section-label text-water">Property care</p>
        <h2 className="font-display mt-1 text-2xl">What needs fixing?</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Share what is happening so everyone knows what needs attention.
        </p>
        <div className="mt-5 border-t border-sand-line pt-5">
          <ReportIssueForm />
        </div>
      </section>
    </div>
  );
}
