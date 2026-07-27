import { Skel } from "@/components/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <Skel className="h-3 w-32" />
          <Skel className="h-9 w-40" />
        </div>
      </div>

      <section className="card p-6">
        <Skel className="h-3 w-24" />
        <Skel className="mt-2 h-7 w-56" />
        <div className="mt-4 space-y-4">
          <Skel className="h-12 w-full" />
          <Skel className="h-12 w-full" />
          <Skel className="h-12 w-full" />
        </div>
      </section>

      <section className="card mt-6 p-6">
        <Skel className="h-3 w-32" />
        <Skel className="mt-2 mb-4 h-7 w-48" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skel className="h-11 w-full" />
          <Skel className="h-11 w-full" />
          <Skel className="h-11 w-full" />
          <Skel className="h-11 w-full" />
        </div>
        <Skel className="mt-4 h-16 w-full" />
        <Skel className="mt-4 h-11 w-40" />
      </section>

      <section className="mt-10">
        <Skel className="h-3 w-28" />
        <Skel className="mt-2 h-7 w-72" />
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card flex flex-col p-5">
              <Skel className="h-6 w-20" />
              <Skel className="mt-3 h-6 w-32" />
              <Skel className="mt-2 h-4 w-24" />
              <Skel className="mt-2 h-4 w-full" />
              <div className="mt-3 border-t border-sand-line pt-3">
                <Skel className="h-10 w-full" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
