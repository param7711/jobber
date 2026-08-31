import { Block, PageHeaderSkeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 pb-16 sm:px-6">
      <PageHeaderSkeleton />
      <div className="grid grid-cols-3 gap-3 border-b border-line py-4">
        {[0, 1, 2].map((i) => (
          <Block key={i} h={54} />
        ))}
      </div>
      <div className="mt-6 flex flex-col gap-2.5">
        {[0, 1].map((i) => (
          <Block key={i} h={170} />
        ))}
      </div>
    </main>
  );
}
