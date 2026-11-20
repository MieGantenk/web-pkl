const skeleton = "animate-pulse rounded-sm bg-surface-muted";

export default function GuruSiswaLoading() {
  return (
    <div aria-busy="true">
      <p role="status" className="sr-only">
        Memuat siswa bimbingan.
      </p>

      <div className={skeleton} style={{ height: 18, width: 120 }} />
      <div className={`${skeleton} mt-2`} style={{ height: 40, width: 280 }} />
      <div className={`${skeleton} mt-3`} style={{ height: 18, width: "70%" }} />

      <div className="mt-6 rounded-md border border-border bg-surface p-3 shadow-xs">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_190px_auto]">
          <div className={`${skeleton} h-11`} />
          <div className={`${skeleton} h-11`} />
          <div className={`${skeleton} h-11 w-32`} />
        </div>
      </div>

      <div className="mt-4 space-y-3 md:hidden">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="rounded-md border border-border bg-surface p-4 shadow-xs"
          >
            <div className={`${skeleton} h-5 w-2/3`} />
            <div className={`${skeleton} mt-2 h-4 w-1/2`} />
            <div className={`${skeleton} mt-4 h-4 w-3/4`} />
            <div className={`${skeleton} mt-3 h-12 w-full`} />
          </div>
        ))}
      </div>

      <div className="mt-4 hidden overflow-hidden rounded-md border border-border bg-surface shadow-xs md:block">
        <div className={`${skeleton} h-11 w-full`} />
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-4 border-t border-border px-4 py-4"
          >
            <div className={`${skeleton} h-4 w-1/4`} />
            <div className={`${skeleton} h-4 w-1/4`} />
            <div className={`${skeleton} h-4 w-1/6`} />
            <div className={`${skeleton} h-4 w-1/6`} />
            <div className={`${skeleton} ml-auto h-4 w-12`} />
          </div>
        ))}
      </div>
    </div>
  );
}
