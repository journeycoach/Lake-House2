import { Skel } from "@/components/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <Skel className="h-3 w-32" />
          <Skel className="h-9 w-64" />
        </div>
        <Skel className="h-10 w-32" />
      </div>

      <section className="card p-6 lg:p-8">
        <div className="flex items-start justify-between gap-4">
          <Skel className="h-3 w-20" />
          <Skel className="h-6 w-28" />
        </div>
        <div className="mt-3 space-y-3">
          <Skel className="h-10 w-3/4" />
          <Skel className="h-4 w-1/2" />
        </div>
        <div className="mt-5 border-t border-sand-line pt-4">
          <Skel className="h-4 w-2/3" />
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <section className="card p-6 lg:col-span-3">
          <div className="flex items-baseline justify-between gap-4">
            <div className="space-y-2">
              <Skel className="h-3 w-24" />
              <Skel className="h-7 w-32" />
            </div>
            <Skel className="h-4 w-24" />
          </div>
          <Skel className="mt-4 hidden h-64 w-full md:block" />
          <div className="mt-4 space-y-3 md:hidden">
            <Skel className="h-10 w-full" />
            <Skel className="h-10 w-full" />
            <Skel className="h-10 w-full" />
          </div>
          <div className="mt-4 border-t border-sand-line pt-3">
            <Skel className="h-4 w-40" />
          </div>
        </section>

        <section className="card p-6 lg:col-span-2">
          <div className="flex items-baseline justify-between gap-4">
            <div className="space-y-2">
              <Skel className="h-3 w-24" />
              <Skel className="h-7 w-32" />
            </div>
            <Skel className="h-4 w-16" />
          </div>
          <div className="mt-4 space-y-4">
            <Skel className="h-12 w-full" />
            <Skel className="h-12 w-full" />
            <Skel className="h-12 w-full" />
          </div>
        </section>

        <section className="card p-6 lg:col-span-3">
          <div className="flex items-baseline justify-between gap-4">
            <div className="space-y-2">
              <Skel className="h-3 w-20" />
              <Skel className="h-7 w-48" />
            </div>
            <Skel className="h-4 w-28" />
          </div>
          <div className="mt-4 space-y-3">
            <Skel className="h-8 w-full" />
            <Skel className="h-8 w-full" />
            <Skel className="h-8 w-full" />
          </div>
        </section>

        <section className="card p-6 lg:col-span-2">
          <div className="flex items-baseline justify-between gap-4">
            <div className="space-y-2">
              <Skel className="h-3 w-28" />
              <Skel className="h-7 w-40" />
            </div>
            <Skel className="h-4 w-20" />
          </div>
          <div className="mt-4 space-y-2">
            <Skel className="h-5 w-full" />
            <Skel className="h-5 w-full" />
            <Skel className="h-5 w-full" />
            <Skel className="h-5 w-3/4" />
          </div>
        </section>
      </div>

      <div className="card mt-6 flex items-center justify-between gap-4 p-6">
        <div className="space-y-2">
          <Skel className="h-3 w-32" />
          <Skel className="h-5 w-72" />
        </div>
        <Skel className="h-10 w-36 shrink-0" />
      </div>
    </div>
  );
}
