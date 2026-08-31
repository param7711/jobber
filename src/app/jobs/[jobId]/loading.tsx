import { Block, Line } from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-16 sm:px-6">
      <div className="py-4">
        <Line w="180px" h={11} />
      </div>
      <Block h={280} />
      <div className="mt-5 flex flex-col gap-5">
        <Block h={160} />
        <Block h={140} />
      </div>
    </main>
  );
}
