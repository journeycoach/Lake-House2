import { Skel } from "@/components/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <Skel className="h-3 w-32" />
          <Skel className="h-9 w-44" />
        </div>
      </div>

      <section className="card p-6">
        <Skel className="h-3 w-32" />
        <Skel className="mt-2 h-7 w-48" />
        <Skel className="mt-2 h-4 w-full" />

        <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,3fr)_minmax(0,2fr)_auto]">
          <Skel className="h-11 w-full" />
          <Skel className="h-11 w-full" />
          <Skel className="h-11 w-32" />
        </div>

        <div className="mt-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 border-t border-sand-line py-3 first:border-0"
            >
              <Skel className="h-7 w-7 shrink-0" />
              <Skel className="h-5 flex-1" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
