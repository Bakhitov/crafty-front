import { memo } from 'react'

import { type ImageData, type AgnoMediaItem } from '@/types/playground'
import { cn } from '@/lib/utils'

// Тип guard для проверки типа изображения
const isImageData = (image: ImageData | AgnoMediaItem): image is ImageData => {
  return 'revised_prompt' in image
}

// Функция для получения URL изображения
const getImageUrl = (image: ImageData | AgnoMediaItem): string => {
  if (isImageData(image)) {
    return image.url
  }
  return image.url || image.content || ''
}

// Функция для получения alt текста
const getImageAlt = (image: ImageData | AgnoMediaItem): string => {
  if (isImageData(image)) {
    return image.revised_prompt || 'AI generated image'
  }
  return image.name || 'Image from Agno API'
}

const Images = ({ images }: { images: (ImageData | AgnoMediaItem)[] }) => (
  <div
    className={cn(
      'grid max-w-xl gap-4',
      images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'
    )}
  >
    {images.map((image, index) => {
      const imageUrl = getImageUrl(image)
      const imageAlt = getImageAlt(image)

      return (
        <div key={imageUrl || index} className="group relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={imageAlt}
            className="w-full rounded-lg"
            onError={(e) => {
              const parent = e.currentTarget.parentElement
              if (parent) {
                parent.innerHTML = `
                      <div class="flex h-40 flex-col items-center justify-center gap-2 rounded-md bg-secondary/50 text-muted" >
                        <p class="text-primary">Image unavailable</p>
                        <a href="${imageUrl}" target="_blank" class="max-w-md truncate underline text-primary text-xs w-full text-center p-2">
                          ${imageUrl}
                        </a>
                      </div>
                    `
              }
            }}
          />
        </div>
      )
    })}
  </div>
)

export default memo(Images)

Images.displayName = 'Images'
