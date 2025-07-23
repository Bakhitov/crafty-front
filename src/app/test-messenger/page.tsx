'use client'
import { useState } from 'react'
import MessengerInstanceEditor from '@/components/playground/MessengerProvider/MessengerInstanceEditor'
import { Button } from '@/components/ui/button'

export default function TestMessengerPage() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-md space-y-4 p-8 text-center">
        <h1 className="text-2xl font-bold">Messenger Instance Editor Test</h1>
        <p className="text-muted-foreground">
          Тестовая страница для демонстрации интерфейса редактора инстансов
          мессенджеров
        </p>

        <Button onClick={() => setIsOpen(true)} size="lg">
          Открыть Messenger Editor
        </Button>
      </div>

      {isOpen && (
        <MessengerInstanceEditor
          editingInstance={null}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
