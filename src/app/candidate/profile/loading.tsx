import { Block } from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-16 sm:px-6">
      <div className="mt-5">
        <Block h={120} />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-4">
          <Block h={210} />
          <Block h={110} />
          <Block h={260} />
        </div>
        <div className="flex flex-col gap-4">
          <Block h={150} />
          <Block h={280} />
          <Block h={170} />
        </div>
      </div>
    </main>
  );
}
