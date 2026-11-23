export function VerificationStamp({
  tanggal,
  verifierName,
}: {
  tanggal: string;
  verifierName: string;
}) {
  return (
    <div
      aria-hidden
      className="verification-stamp pointer-events-none absolute right-3 top-3 z-10 flex size-24 -rotate-6 flex-col items-center justify-center rounded-full border-[3px] border-brand-700 bg-surface px-2 text-center text-brand-700 shadow-xs"
    >
      <span className="text-[10px] font-bold leading-4 tracking-[0.08em]">
        TERVERIFIKASI
      </span>
      <span className="mt-1 text-[10px] font-medium leading-3">{tanggal}</span>
      <span className="mt-0.5 max-w-full truncate text-[10px] leading-3">
        {verifierName}
      </span>
    </div>
  );
}
