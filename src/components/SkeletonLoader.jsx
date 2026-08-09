/**
 * Skeleton loading component.
 *
 * Mimics the actual page layout with animated placeholder blocks.
 * Replaces spinners for premium perceived performance.
 *
 * @module SkeletonLoader
 */

/**
 * Render a skeleton loading screen.
 *
 * @param {Object} props
 * @param {'catalog'|'upload'} [props.variant='catalog'] - Which page layout to mimic.
 * @param {number} [props.count=3] - Number of card skeletons to show.
 * @returns {JSX.Element}
 */
export default function SkeletonLoader({ variant = 'catalog', count = 3 }) {
  if (variant === 'upload') {
    return (
      <div className="min-h-screen bg-[var(--color-bg)]">
        {/* Header skeleton */}
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-white/40 animate-pulse">
          <div className="max-w-2xl mx-auto px-4 py-5 flex items-center gap-3">
            <div className="w-11 h-11 bg-stone-200 rounded-xl" />
            <div className="space-y-1.5">
              <div className="h-5 bg-stone-200 rounded w-24" />
              <div className="h-3 bg-stone-200 rounded w-16" />
            </div>
          </div>
        </div>

        {/* Shop details skeleton */}
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-4 animate-pulse">
            <div className="h-4 bg-stone-200 rounded w-32" />
            <div className="h-10 bg-stone-200 rounded w-full" />
            <div className="h-10 bg-stone-200 rounded w-full" />
          </div>

          {/* Upload area skeleton */}
          <div className="mt-6 border-2 border-dashed border-stone-200 rounded-xl p-8 animate-pulse">
            <div className="w-8 h-8 bg-stone-200 rounded mx-auto mb-3" />
            <div className="h-4 bg-stone-200 rounded w-40 mx-auto mb-1" />
            <div className="h-3 bg-stone-200 rounded w-56 mx-auto" />
          </div>

          {/* Card skeletons */}
          <div className="mt-6 space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="w-full bg-white rounded-xl border border-stone-200 overflow-hidden animate-pulse">
                <div className="w-full h-48 bg-stone-200" />
                <div className="p-4 space-y-2">
                  <div className="h-5 bg-stone-200 rounded w-3/4" />
                  <div className="h-4 bg-stone-200 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Default: catalog variant
  return (
    <div className="min-h-screen bg-[var(--color-bg)] pb-8">
      {/* Header skeleton */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-white/40 animate-pulse">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-stone-200 rounded-xl" />
          <div className="space-y-1.5">
            <div className="h-5 bg-stone-200 rounded w-32" />
            <div className="h-3 bg-stone-200 rounded w-20" />
          </div>
        </div>
      </div>

      {/* Instruction banner skeleton */}
      <div className="max-w-lg mx-auto px-4 py-3">
        <div className="h-10 bg-stone-200 rounded-lg animate-pulse" />
      </div>

      {/* Viral banner skeleton */}
      <div className="max-w-lg mx-auto px-4 py-2">
        <div className="h-16 bg-stone-200 rounded-xl animate-pulse" />
      </div>

      {/* Card skeletons */}
      <div className="max-w-lg mx-auto px-4 space-y-4 mt-2">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="w-full bg-white rounded-2xl border border-stone-200 overflow-hidden animate-pulse">
            <div className="w-full h-56 bg-stone-200" />
            <div className="p-4 space-y-2">
              <div className="h-5 bg-stone-200 rounded w-3/4" />
              <div className="h-4 bg-stone-200 rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

