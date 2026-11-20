const skeleton = "animate-pulse rounded-sm bg-surface-muted";

export default function GuruSiswaDetailLoading() {
  return (
    <div aria-busy="true">
      <p role="status" className="sr-only">
        Memuat detail siswa.
      </p>

      <div className={`${skeleton} h-4 w-40`} />
      <div className={`${skeleton} mt-4 h-4 w-48`} />
      <div className={`${skeleton} mt-2 h-9 w-64`} />
      <div className={`${skeleton} mt-3 h-5 w-52`} />

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="rounded-md border border-border bg-surface p-4 shadow-xs sm:p-6"
            >
              <div className={`${skeleton} h-5 w-40`} />
              <div className={`${skeleton} mt-5 h-24 w-full`} />
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="rounded-md border border-border bg-surface p-5 shadow-xs">
            <div className={`${skeleton} h-5 w-32`} />
            <div className={`${skeleton} mt-4 h-24 w-full`} />
            <div className={`${skeleton} mt-5 h-10 w-full`} />
          </div>
          <div className="rounded-md border border-border bg-surface p-5 shadow-xs">
            <div className={`${skeleton} h-16 w-full`} />
          </div>
        </div>
      </div>
    </div>
  );
}
