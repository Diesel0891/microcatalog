import { X, Plus } from 'lucide-react'

function ImageUploadGrid({images, onRemove, onAdd, maxImages = 5 }) {
  const canAddMore = images.length < maxImages

  return (
    <div className="grid grid-cols-3 gap-2">
      {images.map((image, index) => (
        <div
          key={`${image.url}-${index}`}
          className="relative aspect-square rounded-xl overflow-hidden border border-[#1A1A1A]"
        >
          <img
            src={image.url || '/placeholder.svg'}
            alt={`Product photo ${index + 1}`}
            className="w-full h-full object-cover"
          />
          {image.uploading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/50">
              <div className="shimmer-v0 absolute inset-0" />
              <span className="relative z-10 text-[11px] text-[#F0EDE4] font-sans">
                Uploading&hellip;
              </span>
            </div>
          ) : null}
          {index === 0 ? (
            <span className="absolute top-1 left-1 rounded-full bg-[#C5A059] px-1.5 py-0.5 text-[9px] font-medium text-black font-sans">
              Cover
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => onRemove(index)}
            aria-label={`Remove photo ${index + 1}`}
            className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white active:scale-[0.97] transition-transform"
          >
            <X size={14} className="size-3.5" />
          </button>
        </div>
      ))}
      {canAddMore ? (
        <button
          type="button"
          onClick={onAdd}
          className="aspect-square rounded-xl border border-dashed border-[#1A1A1A] bg-[#0B0B0B] flex flex-col items-center justify-center gap-1 hover:bg-[#1A1A1A]/30 transition-colors active:scale-[0.97]"
        >
          <Plus size={20} className="size-5 text-[#A0A5AD]" />
          <span className="text-[11px] text-[#A0A5AD] font-sans">Add photo</span>
        </button>
      ) : null}
    </div>
  )
}

export default ImageUploadGrid
