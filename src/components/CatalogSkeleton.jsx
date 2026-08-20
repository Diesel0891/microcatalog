const COLOR = {
  void: '#000000',
  plate: '#0B0B0B',
  hairlineObsidian: '#1A1A1A',
}

export default function CatalogSkeleton() {
  return (
    <div className="infini-catalog h-dvh w-full" style={{ backgroundColor: COLOR.void }}>
      {/* Identity strip skeleton */}
      <div
        className="fixed inset-x-0 top-0 z-50 h-14 border-b px-4 backdrop-blur-md"
        style={{ backgroundColor: 'rgba(0,0,0,0.65)', borderColor: COLOR.hairlineObsidian }}
      >
        <div className="flex h-full items-center gap-3">
          <div className="h-6 w-6 rounded bg-[#1A1A1A] animate-pulse" />
          <div className="h-4 w-32 rounded bg-[#1A1A1A] animate-pulse" />
        </div>
      </div>

      {/* Feed card skeleton */}
      <div className="flex h-dvh w-full snap-start flex-col justify-center px-5 py-10">
        <div
          className="mx-auto w-full max-w-md overflow-hidden rounded-lg"
          style={{ backgroundColor: COLOR.plate, border: `0.5px solid ${COLOR.hairlineObsidian}` }}
        >
          {/* Image skeleton */}
          <div className="aspect-[4/5] w-full bg-[#0B0B0B] animate-pulse" />

          {/* Content skeleton */}
          <div className="flex flex-col gap-3 p-5">
            <div className="flex items-center justify-between">
              <div className="h-3 w-16 rounded bg-[#1A1A1A] animate-pulse" />
              <div className="h-5 w-20 rounded-full bg-[#1A1A1A] animate-pulse" />
            </div>
            <div className="flex items-start justify-between gap-3">
              <div className="h-6 w-3/4 rounded bg-[#1A1A1A] animate-pulse" />
              <div className="h-5 w-16 rounded bg-[#1A1A1A] animate-pulse" />
            </div>
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 rounded bg-[#1A1A1A] animate-pulse" />
              <div className="h-8 w-28 rounded-full bg-[#1A1A1A] animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
