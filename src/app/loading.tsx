import { Block, JobCardSkeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-16 sm:px-6">
      <div className="py-6">
        <Block h={56} />
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {[0, 1, 2].map((i) => (
          <Block key={i} h={104} />
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
        <JobCardSkeleton />
        <Block h={200} />
      </div>
    </main>
  );
}
