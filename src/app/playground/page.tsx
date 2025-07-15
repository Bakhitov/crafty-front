'use client'
import Sidebar from '@/components/playground/Sidebar/Sidebar'
import AgentInfoSidebar from '@/components/playground/AgentInfoSidebar'
import { ChatArea } from '@/components/playground/ChatArea'
import { Suspense } from 'react'

export default function PlaygroundPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="bg-background/80 flex h-screen">
        <Sidebar />
        <ChatArea />
        <AgentInfoSidebar />
      </div>
    </Suspense>
  )
}
