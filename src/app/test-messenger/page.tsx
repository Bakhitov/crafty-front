'use client'
import { useState } from 'react'
import MessengerManager from '@/components/playground/MessengerManager'
import { Button } from '@/components/ui/button'

export default function TestMessengerPage() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto max-w-md space-y-4 text-center">
        <h1 className="text-2xl font-bold">Messenger Manager Test</h1>
        <p className="text-muted-foreground">
          Тестовая страница для демонстрации интерфейса менеджера инстансов
          мессенджеров
        </p>

        <Button onClick={() => setIsOpen(true)} size="lg">
          Открыть Messenger Manager
        </Button>

        <MessengerManager
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          editingInstanceId={null}
        />
      </div>
    </div>
  )
}
