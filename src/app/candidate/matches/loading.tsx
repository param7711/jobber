import { Block, PageHeaderSkeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-16 sm:px-6">
      <PageHeaderSkeleton />
      <div className="mt-5 flex flex-col gap-2.5">
        {[0, 1].map((i) => (
          <Block key={i} h={104} />
        ))}
      </div>
    </main>
  );
}
