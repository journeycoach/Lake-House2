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

      <section className="card hidden p-6 md:block">
        <div className="flex items-center justify-between gap-4">
          <Skel className="h-7 w-32" />
          <div className="flex items-center gap-4">
            <Skel className="h-9 w-32" />
            <Skel className="h-9 w-20" />
          </div>
        </div>
        <Skel className="mt-4 h-80 w-full" />
        <div className="mt-4 border-t border-sand-line pt-3">
          <Skel className="h-4 w-48" />
        </div>
      </section>

      <section className="card mt-6 p-6">
        <Skel className="h-3 w-32" />
        <Skel className="mt-2 h-7 w-56" />
        <Skel className="mt-2 h-4 w-72" />
        <div className="mt-4 space-y-4">
          <Skel className="h-14 w-full" />
          <Skel className="h-14 w-full" />
          <Skel className="h-14 w-full" />
        </div>
      </section>

      <section className="card mt-6 p-6">
        <Skel className="h-3 w-24" />
        <Skel className="mt-2 h-7 w-56" />
        <Skel className="mt-4 h-40 w-full" />
      </section>

      <section className="card mt-6 p-6">
        <Skel className="h-3 w-20" />
        <Skel className="mt-2 h-7 w-72" />
        <Skel className="mt-2 h-4 w-full max-w-2xl" />
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Skel className="h-16 w-full" />
          <Skel className="h-16 w-full" />
        </div>
      </section>
    </div>
  );
}
