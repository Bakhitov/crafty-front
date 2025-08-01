'use client'

import { StreamDebugger } from '@/components/StreamDebugger'
import { Card } from '@/components/ui/card'
import Heading from '@/components/ui/typography/Heading'
import { Suspense } from 'react'

function DebugStreamContent() {
  return (
    <div className="container mx-auto space-y-6 p-8">
      <div className="space-y-2 text-center">
        <Heading size={1}>🔧 Stream Debug Tool</Heading>
        <p className="text-muted-foreground">
          Инструмент для диагностики проблем со стримингом Agno API
        </p>
      </div>

      <Card className="p-6">
        <StreamDebugger />
      </Card>

      <div className="text-muted-foreground space-y-2 text-sm">
        <p>
          <strong>Как использовать:</strong>
        </p>
        <ol className="ml-4 list-inside list-decimal space-y-1">
          <li>Убедитесь, что вы авторизованы</li>
          <li>Проверьте, что в store настроен правильный endpoint</li>
          <li>Нажмите &quot;Тест стриминга&quot;</li>
          <li>Изучите логи для диагностики проблем</li>
        </ol>

        <p className="mt-4">
          <strong>Возможные проблемы:</strong>
        </p>
        <ul className="ml-4 list-inside list-disc space-y-1">
          <li>Неправильный URL endpoint&apos;а</li>
          <li>Проблемы с CORS</li>
          <li>Агент не отвечает</li>
          <li>Ошибки в формате стрима</li>
        </ul>
      </div>
    </div>
  )
}

export default function DebugStreamPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DebugStreamContent />
    </Suspense>
  )
}
