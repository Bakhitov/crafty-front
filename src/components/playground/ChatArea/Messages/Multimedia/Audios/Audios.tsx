'use client'

import { memo, useMemo } from 'react'

import { type AudioData, type AgnoMediaItem } from '@/types/playground'
import { decodeBase64Audio } from '@/lib/audio'

// Тип guard для проверки типа аудио
const isAudioData = (audio: AudioData | AgnoMediaItem): audio is AudioData => {
  return (
    'base64_audio' in audio || 'mime_type' in audio || 'sample_rate' in audio
  )
}

// Функция для получения URL аудио
const getAudioUrl = (audio: AudioData | AgnoMediaItem): string | null => {
  if (isAudioData(audio)) {
    if (audio?.url) {
      return audio.url
    }
    if (audio.base64_audio) {
      return decodeBase64Audio(
        audio.base64_audio,
        audio.mime_type || 'audio/wav'
      )
    }
    if (audio.content) {
      return decodeBase64Audio(
        audio.content,
        'audio/pcm16',
        audio.sample_rate,
        audio.channels
      )
    }
  } else {
    // AgnoMediaItem
    if (audio.url) {
      return audio.url
    }
    if (audio.content) {
      // Попробуем декодировать как base64
      try {
        return decodeBase64Audio(
          audio.content,
          audio.content_type || 'audio/wav'
        )
      } catch {
        // Если не получилось, возвращаем как есть
        return audio.content
      }
    }
  }
  return null
}

// Функция для получения уникального ключа
const getAudioKey = (
  audio: AudioData | AgnoMediaItem,
  index: number
): string => {
  if (isAudioData(audio)) {
    return audio.id ?? `audio-${index}`
  }
  return audio.url || audio.name || `agno-audio-${index}`
}

/**
 * Renders a single audio item with controls
 * @param audio - AudioData or AgnoMediaItem object containing url or base64 audio data
 */
const AudioItem = memo(({ audio }: { audio: AudioData | AgnoMediaItem }) => {
  const audioUrl = useMemo(() => getAudioUrl(audio), [audio])

  if (!audioUrl) return null

  return (
    <audio
      src={audioUrl}
      controls
      className="w-full rounded-lg"
      preload="metadata"
    />
  )
})

AudioItem.displayName = 'AudioItem'

/**
 * Renders a list of audio elements
 * @param audio - Array of AudioData or AgnoMediaItem objects
 */
const Audios = memo(({ audio }: { audio: (AudioData | AgnoMediaItem)[] }) => (
  <div className="flex flex-col gap-4">
    {audio.map((audio_item, index) => (
      <AudioItem key={getAudioKey(audio_item, index)} audio={audio_item} />
    ))}
  </div>
))

Audios.displayName = 'Audios'

export default Audios
