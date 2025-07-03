'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Heading from '@/components/ui/typography/Heading'
import Paragraph from '@/components/ui/typography/Paragraph'

export default function LandingPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const handleGetStarted = () => {
    if (user) {
      router.push('/playground')
    } else {
      router.push('/auth')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <header className="flex justify-between items-center mb-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand rounded-lg"></div>
            <span className="text-xl font-bold text-primary">Agent UI</span>
          </div>
          <Button
            onClick={handleGetStarted}
            className="h-9 px-6 rounded-xl bg-primary text-xs font-medium text-background hover:bg-primary/80"
          >
            {user ? 'Go to Playground' : 'Sign In'}
          </Button>
        </header>

        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-20">
          <Heading size={1} className="text-5xl font-bold text-primary mb-6">
            Powerful AI Agent Interface
          </Heading>
          <Paragraph size="lead" className="text-muted text-xl mb-8 max-w-2xl mx-auto">
            Advanced conversational AI platform with multimedia support, 
            real-time streaming, and intelligent agent interactions.
          </Paragraph>
          <Button
            onClick={handleGetStarted}
            className="h-12 px-8 rounded-xl bg-brand text-base font-medium text-primary hover:bg-brand/80"
          >
            {user ? 'Continue to Playground' : 'Get Started'}
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="text-center p-6 rounded-xl bg-background-secondary/50 border border-accent/20">
            <div className="w-12 h-12 bg-brand/20 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <span className="text-brand text-xl">🤖</span>
            </div>
            <Heading size={3} className="text-primary mb-3">
              AI Conversations
            </Heading>
            <Paragraph size="body" className="text-muted">
              Engage in natural conversations with advanced AI agents capable of understanding context and nuance.
            </Paragraph>
          </div>

          <div className="text-center p-6 rounded-xl bg-background-secondary/50 border border-accent/20">
            <div className="w-12 h-12 bg-brand/20 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <span className="text-brand text-xl">📱</span>
            </div>
            <Heading size={3} className="text-primary mb-3">
              Multimedia Support
            </Heading>
            <Paragraph size="body" className="text-muted">
              Share and process images, videos, and audio files seamlessly within your conversations.
            </Paragraph>
          </div>

          <div className="text-center p-6 rounded-xl bg-background-secondary/50 border border-accent/20">
            <div className="w-12 h-12 bg-brand/20 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <span className="text-brand text-xl">⚡</span>
            </div>
            <Heading size={3} className="text-primary mb-3">
              Real-time Streaming
            </Heading>
            <Paragraph size="body" className="text-muted">
              Experience lightning-fast responses with real-time message streaming and live updates.
            </Paragraph>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center py-16 px-8 rounded-xl bg-accent/20 border border-accent/40">
          <Heading size={2} className="text-primary mb-4">
            Ready to get started?
          </Heading>
          <Paragraph size="lead" className="text-muted mb-6 max-w-xl mx-auto">
            Join thousands of users who are already experiencing the future of AI interaction.
          </Paragraph>
          <Button
            onClick={handleGetStarted}
            className="h-12 px-8 rounded-xl bg-primary text-base font-medium text-background hover:bg-primary/80"
          >
            {user ? 'Go to Playground' : 'Create Account'}
          </Button>
        </div>

        {/* Footer */}
        <footer className="mt-20 text-center">
          <Paragraph size="xsmall" className="text-muted">
            © 2024 Agent UI. Built with Next.js and Supabase.
          </Paragraph>
        </footer>
      </div>
    </div>
  )
}
