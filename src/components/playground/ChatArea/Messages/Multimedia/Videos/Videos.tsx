'use client'

import { memo } from 'react'

import { toast } from 'sonner'

import { type VideoData, type AgnoMediaItem } from '@/types/playground'
import Icon from '@/components/ui/icon'

// Тип guard для проверки типа видео
const isVideoData = (video: VideoData | AgnoMediaItem): video is VideoData => {
  return 'id' in video && typeof video.id === 'number'
}

// Функция для получения URL видео
const getVideoUrl = (video: VideoData | AgnoMediaItem): string => {
  if (isVideoData(video)) {
    return video.url
  }
  return video.url || video.content || ''
}

// Функция для получения уникального ключа
const getVideoKey = (
  video: VideoData | AgnoMediaItem,
  index: number
): string => {
  if (isVideoData(video)) {
    return video.id.toString()
  }
  return video.url || video.name || `video-${index}`
}

const VideoItem = memo(({ video }: { video: VideoData | AgnoMediaItem }) => {
  const videoUrl = getVideoUrl(video)

  const handleDownload = async () => {
    try {
      toast.loading('Downloading video...')
      const response = await fetch(videoUrl)
      if (!response.ok) throw new Error('Network response was not ok')

      const blob = await response.blob()
      const fileExtension = videoUrl.split('.').pop() ?? 'mp4'
      const fileName = `video-${Date.now()}.${fileExtension}`

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName

      document.body.appendChild(a)
      a.click()

      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.dismiss()
      toast.success('Video downloaded successfully')
    } catch {
      toast.dismiss()
      toast.error('Failed to download video')
    }
  }

  return (
    <div>
      <div className="group relative w-full max-w-xl">
        {}
        <video
          src={videoUrl}
          autoPlay
          muted
          loop
          controls
          className="w-full rounded-lg"
          style={{ aspectRatio: '16 / 9' }}
        />
        <button
          type="button"
          onClick={handleDownload}
          className="bg-secondary/80 hover:bg-secondary absolute right-2 top-2 flex items-center justify-center rounded-sm p-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          aria-label="Download Video"
        >
          <Icon type="download" size="xs" />
        </button>
      </div>
    </div>
  )
})

VideoItem.displayName = 'VideoItem'

const Videos = memo(({ videos }: { videos: (VideoData | AgnoMediaItem)[] }) => (
  <div className="flex flex-col gap-4">
    {videos.map((video, index) => (
      <VideoItem key={getVideoKey(video, index)} video={video} />
    ))}
  </div>
))

Videos.displayName = 'Videos'

export default Videos
