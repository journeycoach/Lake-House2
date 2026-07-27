import { Skel } from "@/components/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <Skel className="h-3 w-32" />
          <Skel className="h-9 w-48" />
        </div>
      </div>

      <section className="card p-6">
        <Skel className="h-3 w-28" />
        <Skel className="mt-2 mb-4 h-7 w-40" />
        <Skel className="h-20 w-full" />
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <Skel className="h-11 w-full sm:w-64" />
          <Skel className="h-11 w-32" />
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card flex flex-col p-5">
            <Skel className="h-3 w-20" />
            <Skel className="mt-3 h-4 w-full" />
            <Skel className="mt-2 h-4 w-2/3" />
            <div className="mt-4 border-t border-sand-line pt-3">
              <Skel className="h-3 w-24" />
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
