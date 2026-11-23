type PageSkeletonProps = {
  variant?: "table" | "split" | "cards" | "form" | "dashboard";
  tabs?: boolean;
};

const box = "rounded-md border border-border bg-surface shadow-xs";
const line = "skeleton";

export function PageSkeleton({
  variant = "table",
  tabs = false,
}: PageSkeletonProps) {
  const showFilters =
    variant === "table" || variant === "split" || variant === "cards";

  return (
    <div aria-busy="true">
      <p role="status" className="sr-only">
        Memuat halaman.
      </p>

      <div aria-hidden>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className={`${line} h-[18px] w-28`} />
            <div className={`${line} mt-2 h-10 w-64 max-w-full`} />
            <div className={`${line} mt-3 h-[18px] w-[70%] max-w-[560px]`} />
          </div>
          <div className={`${line} h-11 w-32`} />
        </div>

        {tabs ? (
          <div className="mt-6 flex gap-2 border-b border-border pb-2">
            <div className={`${line} h-10 w-32`} />
            <div className={`${line} h-10 w-36`} />
          </div>
        ) : null}

        {showFilters ? (
          <div className={`${box} mt-4 p-3`}>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_200px_170px_auto]">
              <div className={`${line} h-11`} />
              <div className={`${line} h-11`} />
              <div className={`${line} h-11`} />
              <div className={`${line} h-11 w-24`} />
            </div>
          </div>
        ) : null}

        {variant === "table" ? <TableSkeleton /> : null}
        {variant === "split" ? <SplitSkeleton /> : null}
        {variant === "cards" ? <CardsSkeleton /> : null}
        {variant === "form" ? <FormSkeleton /> : null}
        {variant === "dashboard" ? <DashboardSkeleton /> : null}
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <>
      <div
        className={`${box} mt-4 hidden overflow-hidden md:block`}
      >
        <div className={`${line} h-11 w-full rounded-none`} />
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-4 border-t border-border px-4 py-4"
          >
            <div className={`${line} h-4 w-1/4`} />
            <div className={`${line} h-4 w-1/5`} />
            <div className={`${line} h-4 w-1/6`} />
            <div className={`${line} h-4 w-1/6`} />
            <div className={`${line} ml-auto h-4 w-12`} />
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-3 md:hidden">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className={`${box} p-4`}>
            <div className={`${line} h-5 w-2/3`} />
            <div className={`${line} mt-2 h-4 w-1/2`} />
            <div className={`${line} mt-4 h-4 w-3/4`} />
            <div className={`${line} mt-3 h-10 w-full`} />
          </div>
        ))}
      </div>
    </>
  );
}

function SplitSkeleton() {
  return (
    <div className="mt-4 grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
      <div className={`${box} overflow-hidden`}>
        <div className={`${line} h-12 w-full rounded-none`} />
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="border-t border-border px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <div className={`${line} h-4 w-1/2`} />
              <div className={`${line} h-6 w-16 rounded-full`} />
            </div>
            <div className={`${line} mt-2 h-3 w-2/3`} />
            <div className={`${line} mt-2 h-3 w-4/5`} />
          </div>
        ))}
      </div>

      <div className={`${box} p-4 sm:p-6`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className={`${line} h-4 w-1/3`} />
            <div className={`${line} mt-2 h-8 w-2/3`} />
            <div className={`${line} mt-2 h-4 w-1/2`} />
          </div>
          <div className={`${line} h-6 w-20 rounded-full`} />
        </div>
        <div className={`${line} mt-5 h-5 w-3/4`} />
        <div className={`${line} mt-2 h-4 w-full`} />
        <div className={`${line} mt-2 h-4 w-5/6`} />
        <div className={`${line} mt-4 h-56 w-full`} />
        <div className={`${line} mt-5 h-4 w-1/3`} />
        <div className={`${line} mt-3 h-28 w-full`} />
      </div>
    </div>
  );
}

function CardsSkeleton() {
  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className={`${box} p-4`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className={`${line} h-4 w-1/3`} />
              <div className={`${line} mt-2 h-6 w-2/3`} />
              <div className={`${line} mt-2 h-4 w-1/2`} />
            </div>
            <div className={`${line} h-6 w-20 rounded-full`} />
          </div>
          <div className={`${line} mt-4 h-4 w-full`} />
          <div className={`${line} mt-2 h-4 w-5/6`} />
          <div className={`${line} mt-4 h-40 w-full`} />
          <div className={`${line} mt-4 h-20 w-full`} />
        </div>
      ))}
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className={`${box} mt-6 max-w-[680px] p-4 sm:p-6`}>
      <div className={`${line} h-6 w-40`} />
      <div className={`${line} mt-2 h-4 w-2/3`} />
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="mt-5">
          <div className={`${line} h-4 w-28`} />
          <div className={`${line} mt-2 h-11 w-full`} />
        </div>
      ))}
      <div className="mt-6 flex justify-end">
        <div className={`${line} h-11 w-32`} />
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className={`${box} p-4`}>
            <div className={`${line} h-4 w-1/2`} />
            <div className={`${line} mt-3 h-9 w-1/3`} />
            <div className={`${line} mt-2 h-4 w-2/3`} />
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className={`${box} p-4 sm:p-6`}>
            <div className={`${line} h-6 w-40`} />
            <div className={`${line} mt-4 h-4 w-1/2`} />
            <div className={`${line} mt-4 h-32 w-full`} />
          </div>
        ))}
      </div>
    </>
  );
}
