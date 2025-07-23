'use client'

import { Suspense } from 'react'
import Sidebar from '@/components/playground/Sidebar/Sidebar'
import { MessengerChatArea } from '@/components/playground/ChatArea'
import { usePlaygroundStore } from '@/store'

function MessengerChatContent() {
  const { selectedChatId, selectedInstanceId } = usePlaygroundStore()

  return (
    <div className="bg-background/80 flex h-screen">
      <Sidebar />
      <MessengerChatArea
        chatId={selectedChatId}
        instanceId={selectedInstanceId}
      />
    </div>
  )
}

export default function MessengerChatPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MessengerChatContent />
    </Suspense>
  )
}
