import {
  JobCardSkeleton,
  PageHeaderSkeleton,
  Block,
} from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
      <PageHeaderSkeleton />
      <div className="grid gap-6 pt-6 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <Block h={420} />
        </aside>
        <section className="flex flex-col gap-3">
          <Block h={46} />
          {[0, 1, 2].map((i) => (
            <JobCardSkeleton key={i} />
          ))}
        </section>
      </div>
    </main>
  );
}
