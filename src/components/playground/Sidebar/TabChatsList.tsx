'use client'

import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { usePlaygroundStore } from '@/store'
import ChatsList from './ChatsList'
import { MessengerProviderList } from '@/components/playground/MessengerProvider'

const TabChatsList = () => {
  const [selectedTab, setSelectedTab] = useState('chats')
  const { messengerInstances } = usePlaygroundStore()

  // Подсчитываем количество активных инстансов
  const activeInstancesCount = messengerInstances.filter(
    (instance) => instance?.status === 'running'
  ).length

  return (
    <div className="flex h-full w-full flex-col">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-primary text-xs font-medium uppercase">
          Connections
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <Tabs
          value={selectedTab}
          onValueChange={setSelectedTab}
          className="flex min-h-0 flex-1 flex-col"
        >
          <TabsList className="bg-background-secondary grid h-8 w-full shrink-0 grid-cols-2">
            <TabsTrigger value="chats" className="py-1 text-xs">
              <div className="flex items-center gap-1" title="Chats">
                <span>Chats</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="instances" className="py-1 text-xs">
              <div className="flex items-center gap-1" title="Messengers">
                <span>Messengers</span>
                {activeInstancesCount > 0 && (
                  <div className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 text-xs text-white">
                    {activeInstancesCount}
                  </div>
                )}
              </div>
            </TabsTrigger>
          </TabsList>

          <div className="mt-4 min-h-0 flex-1 overflow-hidden">
            <TabsContent
              value="chats"
              className="h-full data-[state=active]:flex data-[state=active]:flex-col"
            >
              <ChatsList />
            </TabsContent>
            <TabsContent
              value="instances"
              className="h-full data-[state=active]:flex data-[state=active]:flex-col"
            >
              <MessengerProviderList />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}

export default TabChatsList
