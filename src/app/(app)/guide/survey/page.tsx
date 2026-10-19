import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Land Title Survey · Paine Pointe",
};

export default function SurveyPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Land Title Survey"
        action={
          <Link href="/guide" className="btn btn-quiet">
            ← Back to House Guide
          </Link>
        }
      />
      <iframe
        src="/documents/land-title-survey.pdf#view=FitH"
        title="Land Title Survey PDF"
        className="h-[76vh] min-h-[28rem] w-full rounded-lh border border-sand-line bg-white"
      />
    </div>
  );
}
