const COLOR = {
  void: '#000000',
  plate: '#0B0B0B',
  hairlineObsidian: '#1A1A1A',
}

function SkeletonBlock({ className }) {
  return (
    <div
      className={`rounded ${className}`}
      style={{
        backgroundImage: 'linear-gradient(90deg, #0B0B0B 0%, #0E0E0E 50%, #0B0B0B 100%)',
        backgroundSize: '200% 100%',
        animation: 'infini-shimmer 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite',
      }}
    />
  )
}

export default function CatalogSkeleton() {
  return (
    <div className="infini-catalog h-dvh w-full" style={{ backgroundColor: COLOR.void }}>
      {/* Identity strip skeleton */}
      <div
        className="fixed inset-x-0 top-0 z-50 h-14 border-b px-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.65)', borderColor: COLOR.hairlineObsidian }}
      >
        <div className="flex h-full items-center gap-3">
          <SkeletonBlock className="h-6 w-6 rounded-full" />
          <SkeletonBlock className="h-4 w-32" />
        </div>
      </div>

      {/* Feed card skeleton */}
      <div className="flex h-dvh w-full snap-start flex-col justify-center px-5 py-10">
        <div
          className="mx-auto w-full max-w-md overflow-hidden rounded-lg"
          style={{ backgroundColor: COLOR.plate, border: `0.5px solid ${COLOR.hairlineObsidian}` }}
        >
          {/* Image skeleton */}
          <div
            className="aspect-[4/5] w-full"
            style={{
              backgroundImage: 'linear-gradient(90deg, #0A0A0A 0%, #0D0D0D 50%, #0A0A0A 100%)',
              backgroundSize: '200% 100%',
              animation: 'infini-shimmer 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite',
            }}
          />

          {/* Content skeleton */}
          <div className="flex flex-col gap-3 p-5">
            <div className="flex items-center justify-between">
              <SkeletonBlock className="h-3 w-16" />
              <SkeletonBlock className="h-5 w-20 rounded-full" />
            </div>
            <div className="flex items-start justify-between gap-3">
              <SkeletonBlock className="h-6 w-3/4" />
              <SkeletonBlock className="h-5 w-16" />
            </div>
            <div className="flex items-center justify-between">
              <SkeletonBlock className="h-3 w-20" />
              <SkeletonBlock className="h-8 w-28 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
