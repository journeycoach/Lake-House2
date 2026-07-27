import { Skel } from "@/components/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <Skel className="h-3 w-32" />
          <Skel className="h-9 w-32" />
        </div>
        <Skel className="h-6 w-24" />
      </div>

      <section className="card p-6">
        <Skel className="h-3 w-28" />
        <Skel className="mt-2 h-7 w-48" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-4 border-t border-sand-line pt-2 first:border-0 first:pt-0"
            >
              <Skel className="h-4 w-2/3" />
              <Skel className="h-3 w-16 shrink-0" />
            </div>
          ))}
        </div>
      </section>

      <section className="card mt-6 p-6">
        <Skel className="h-3 w-32" />
        <Skel className="mt-2 h-7 w-40" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-3">
              <Skel className="h-4 w-40" />
              <div className="flex shrink-0 items-center gap-3">
                <Skel className="h-5 w-14" />
                <Skel className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
