'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Icon from '@/components/ui/icon'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'

interface MediaOptionsModalProps {
  isOpen: boolean
  onClose: () => void
  onFileSelect: () => void
  onUrlAdd: (url: string) => void
}

const MediaOptionsModal = ({
  isOpen,
  onClose,
  onFileSelect,
  onUrlAdd
}: MediaOptionsModalProps) => {
  const [urlInput, setUrlInput] = useState('')

  if (!isOpen) return null

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onUrlAdd(urlInput.trim())
      setUrlInput('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUrlSubmit()
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="bg-primary mx-4 w-full max-w-sm p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-primary-foreground text-base font-semibold">
            Add Media
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-primary-foreground hover:bg-primary-foreground/20 h-5 w-5"
          >
            <Icon type="x" size="xs" />
          </Button>
        </div>

        <div className="space-y-3">
          {/* Upload File Option */}
          <Button
            onClick={() => {
              onFileSelect()
              onClose()
            }}
            variant="secondary"
            className="h-12 w-full justify-start gap-3 text-left"
          >
            <div className="bg-primary-foreground/10 flex h-8 w-8 items-center justify-center rounded-lg">
              <Icon
                type="paperclip"
                size="xs"
                className="text-primary-foreground"
              />
            </div>
            <div>
              <div className="text-sm font-medium">Upload File</div>
              <div className="text-muted text-xs">Choose from device</div>
            </div>
          </Button>

          <div className="flex items-center gap-2">
            <Separator className="bg-primary-foreground/20 flex-1" />
            <span className="text-primary-foreground/70 text-xs">OR</span>
            <Separator className="bg-primary-foreground/20 flex-1" />
          </div>

          {/* Add URL Option */}
          <div className="space-y-2">
            <Input
              id="url-input"
              type="url"
              placeholder="https://example.com/image.jpg"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50"
            />

            <Button
              onClick={handleUrlSubmit}
              disabled={!urlInput.trim()}
              variant="secondary"
              size="sm"
              className="w-full"
            >
              <Icon type="link" size="xs" className="mr-2" />
              Add URL
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default MediaOptionsModal
