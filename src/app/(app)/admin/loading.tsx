import { Skel } from "@/components/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <Skel className="h-3 w-32" />
          <Skel className="h-9 w-28" />
        </div>
        <Skel className="h-6 w-24" />
      </div>

      <section className="card p-6">
        <Skel className="h-3 w-32" />
        <Skel className="mt-2 h-7 w-48" />
        <div className="mt-4 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-wrap items-center gap-4 border-t border-sand-line py-4 first:border-0"
            >
              <div className="min-w-0 flex-1 basis-48 space-y-2">
                <Skel className="h-4 w-32" />
                <Skel className="h-4 w-48" />
              </div>
              <Skel className="h-9 w-44" />
              <Skel className="h-9 w-44" />
            </div>
          ))}
        </div>

        <div className="mt-6 border-t border-sand-line pt-4">
          <Skel className="h-5 w-32" />
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Skel className="h-11 w-full" />
            <Skel className="h-11 w-full" />
            <Skel className="h-11 w-full" />
            <Skel className="h-11 w-full" />
            <Skel className="h-11 w-full" />
            <Skel className="h-11 w-full" />
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card p-6 lg:col-span-2">
          <Skel className="h-3 w-24" />
          <Skel className="mt-2 h-7 w-56" />
          <Skel className="mt-2 h-4 w-72" />

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Skel className="h-40 w-full" />
            <Skel className="h-40 w-full" />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-sand-line pt-4">
            <Skel className="h-11 flex-1" />
            <Skel className="h-11 w-28" />
            <Skel className="h-11 w-20" />
          </div>

          <div className="mt-6 border-t border-sand-line pt-5">
            <Skel className="h-3 w-16" />
            <Skel className="mt-2 h-6 w-40" />
            <Skel className="mt-1 h-4 w-72" />
            <Skel className="mt-3 h-40 w-full" />
            <div className="mt-3 flex justify-end">
              <Skel className="h-11 w-32" />
            </div>
          </div>
        </section>

        <section className="card p-6">
          <Skel className="h-3 w-28" />
          <Skel className="mt-2 h-7 w-40" />
          <div className="mt-4 flex items-center gap-2">
            <Skel className="h-11 flex-1" />
            <Skel className="h-11 w-24" />
          </div>
          <Skel className="mt-2 h-3 w-64" />
        </section>
      </div>

      <div className="mt-6 grid gap-6">
        <section className="card p-6">
          <Skel className="h-3 w-24" />
          <Skel className="mt-2 h-7 w-48" />
          <Skel className="mt-1 h-3 w-72" />
          <div className="mt-4 space-y-3">
            <Skel className="h-8 w-full" />
            <Skel className="h-8 w-full" />
            <Skel className="h-8 w-full" />
          </div>
        </section>
      </div>
    </div>
  );
}
