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

      <section>
        <Skel className="h-4 w-full max-w-2xl" />
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card flex flex-col p-5">
              <Skel className="h-6 w-8" />
              <Skel className="mt-2 h-5 w-2/3" />
              <Skel className="mt-2 h-4 w-full" />
              <Skel className="mt-1 h-4 w-3/4" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
