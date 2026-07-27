import { Skel } from "@/components/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <Skel className="h-3 w-32" />
          <Skel className="h-9 w-32" />
        </div>
        <Skel className="h-6 w-24" />
      </div>

      <section className="card p-6">
        <Skel className="h-3 w-24" />
        <Skel className="mt-2 h-7 w-56" />
        <div className="mt-4 space-y-4">
          <Skel className="h-11 w-full" />
          <Skel className="h-11 w-full" />
          <Skel className="h-11 w-28" />
        </div>
      </section>

      <section className="card mt-6 p-6">
        <Skel className="h-3 w-20" />
        <Skel className="mt-2 h-7 w-48" />
        <Skel className="mt-2 h-4 w-72" />
        <div className="mt-4 space-y-4">
          <Skel className="h-11 w-full" />
          <Skel className="h-11 w-full" />
          <Skel className="h-11 w-32" />
        </div>
      </section>
    </div>
  );
}
