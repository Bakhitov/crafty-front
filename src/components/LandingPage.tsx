'use client'

import React from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { RainbowButton } from '@/components/magicui/rainbow-button'
import { Marquee } from '@/components/magicui/marquee'
import { AnimatedList } from '@/components/magicui/animated-list'
import { NumberTicker } from '@/components/magicui/number-ticker'
import { Meteors } from '@/components/magicui/meteors'
import BusinessFeaturesBento from '@/components/BusinessFeaturesBento'
import {
  Bot,
  Brain,
  Database,
  Globe,
  MessageSquare,
  Palette,
  PieChart,
  Rocket,
  Shield,
  Star,
  Users,
  Zap
} from 'lucide-react'

import Paragraph from '@/components/ui/typography/Paragraph'
import Heading from '@/components/ui/typography/Heading'
import { AuroraText } from '@/components/magicui/aurora-text'

// Компонент карточки отзыва
const TestimonialCard = ({
  name,
  position,
  company,
  review,
  rating = 5
}: {
  name: string
  position: string
  company: string
  review: string
  rating?: number
}) => (
  <div className="bg-background border-primary/15 hover:border-primary/20 mx-4 w-80 flex-shrink-0 rounded-xl border p-6 transition-all duration-300">
    <div className="mb-4 flex items-center space-x-1">
      {[...Array(rating)].map((_, i) => (
        <Star key={i} className="fill-primary text-primary h-4 w-4" />
      ))}
    </div>
    <Paragraph size="body" className="text-muted mb-4">
      &ldquo;{review}&rdquo;
    </Paragraph>
    <div className="flex items-center space-x-3">
      <div className="bg-accent h-10 w-10 rounded-xl" />
      <div>
        <Paragraph size="title" className="text-primary">
          {name}
        </Paragraph>
        <Paragraph size="xsmall" className="text-muted">
          {position}, {company}
        </Paragraph>
      </div>
    </div>
  </div>
)

// Компонент сообщения из мессенджера
const MessageItem = ({
  platform,
  message,
  user,
  time,
  platformColor
}: {
  platform: string
  message: string
  user: string
  time: string
  platformColor: string
}) => (
  <div className="bg-background border-primary/15 w-full max-w-md rounded-xl border p-4 shadow-sm">
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <div
          className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: platformColor }}
        >
          {platform.charAt(0)}
        </div>
        <Paragraph size="xsmall" className="text-primary font-medium">
          {platform}
        </Paragraph>
      </div>
      <Paragraph size="xsmall" className="text-muted">
        {time}
      </Paragraph>
    </div>
    <Paragraph size="body" className="text-muted mb-2">
      {message}
    </Paragraph>
    <Paragraph size="xsmall" className="text-muted">
      от {user}
    </Paragraph>
  </div>
)

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
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
      </div>
    )
  }

  return (
    <div className="bg-background relative min-h-screen overflow-hidden">
      <Meteors
        number={80}
        minDelay={0.1}
        maxDelay={2}
        minDuration={3}
        maxDuration={8}
      />
      {/* Header */}
      <header className="border-accent/20 bg-background/80 sticky top-0 z-50 w-full border-b backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center space-x-2">
            <div className="bg-accent flex h-8 w-8 items-center justify-center rounded-xl">
              <Bot className="text-primary h-5 w-5" />
            </div>
            <span className="text-primary text-lg font-bold">CRAFTY</span>
          </div>
          <nav className="hidden items-center space-x-6 md:flex">
            <a
              href="#features"
              className="hover:text-primary text-muted text-sm font-medium transition-colors"
            >
              Возможности
            </a>
            <a
              href="#integrations"
              className="hover:text-primary text-muted text-sm font-medium transition-colors"
            >
              Интеграции
            </a>
            <a
              href="#pricing"
              className="hover:text-primary text-muted text-sm font-medium transition-colors"
            >
              Цены
            </a>
            <a
              href="#testimonials"
              className="hover:text-primary text-muted text-sm font-medium transition-colors"
            >
              Отзывы
            </a>
            <Button
              onClick={handleGetStarted}
              size="lg"
              className="bg-primary text-background hover:bg-primary/80 h-9 w-auto rounded-xl text-xs font-medium"
            >
              {user ? 'Playground' : 'Войти'}
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 md:py-32">
          <div className="container relative mx-auto px-4 md:px-6">
            <div className="mx-auto max-w-4xl text-center">
              <div className="bg-accent/20 border-primary/15 mb-6 inline-flex items-center rounded-xl border px-4 py-2">
                <Zap className="text-primary mr-1 h-3 w-3" />
                <Paragraph
                  size="xsmall"
                  className="text-muted font-medium uppercase"
                >
                  Скорость ответа ≈ 1.5 секунды
                </Paragraph>
              </div>
              <Heading
                size={2}
                className="text-primary mb-6 text-center text-8xl font-bold"
              >
                <AuroraText
                  colors={[
                    'var(--color-1)',
                    'var(--color-2)',
                    'var(--color-3)',
                    'var(--color-4)',
                    'var(--color-5)'
                  ]}
                >
                  CRAFTY
                </AuroraText>{' '}
                агенты
              </Heading>
              <Heading size={1} className="text-primary mb-6 text-center">
                Ваши цифровые сотрудники{' '}
                <span className="text-muted">24/7</span>{' '}
              </Heading>

              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                <RainbowButton
                  onClick={handleGetStarted}
                  size="lg"
                  className="h-12 w-auto text-xs font-medium uppercase"
                >
                  Попробовать бесплатно
                </RainbowButton>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section with Bento Grid */}
        <BusinessFeaturesBento />

        {/* Target Audience Section */}
        <section className="bg-accent/10 py-20 md:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto mb-16 max-w-2xl text-center">
              <Heading size={2} className="text-primary mb-4 text-center">
                Какие специальности можно заменить
              </Heading>
              <Paragraph size="lead" className="text-muted">
                AI-агенты Crafty могут полностью заменить многих специалистов,
                работая быстрее и эффективнее
              </Paragraph>
            </div>

            <div className="flex flex-col items-center gap-12">
              {/* Облако специальностей с преимуществами по бокам */}
              <div className="flex w-full items-start justify-between gap-8">
                {/* Левая колонка преимуществ */}
                <div className="flex w-56 flex-col gap-4">
                  <div className="bg-accent/10 border-primary/15 rounded-xl border p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      <Heading size={5} className="text-primary">
                        Работают 24/7
                      </Heading>
                    </div>
                    <Paragraph size="xsmall" className="text-muted">
                      Агенты не устают и готовы работать круглосуточно
                    </Paragraph>
                  </div>

                  <div className="bg-accent/10 border-primary/15 rounded-xl border p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                      <Heading size={5} className="text-primary">
                        Экономия до 90%
                      </Heading>
                    </div>
                    <Paragraph size="xsmall" className="text-muted">
                      Сокращение затрат на зарплаты и обучение
                    </Paragraph>
                  </div>

                  <div className="bg-accent/10 border-primary/15 rounded-xl border p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                      <Heading size={5} className="text-primary">
                        Без ошибок
                      </Heading>
                    </div>
                    <Paragraph size="xsmall" className="text-muted">
                      Исключение человеческого фактора
                    </Paragraph>
                  </div>
                </div>

                {/* Центральное облако специальностей */}
                <div className="flex flex-1 justify-center">
                  <div className="relative flex h-[400px] w-[500px] items-center justify-center">
                    {/* Support - сгруппированная версия */}
                    <div className="absolute left-4 top-4 flex flex-col items-center">
                      <div className="bg-background border-primary/20 flex h-12 w-12 items-center justify-center rounded-full border-2 shadow-lg transition-transform duration-300 hover:scale-110">
                        <MessageSquare className="text-primary h-6 w-6" />
                      </div>
                      <div className="text-primary mt-1 text-xs font-medium">
                        Поддержка
                      </div>
                    </div>

                    {/* Designer */}
                    <div className="absolute right-4 top-8 flex flex-col items-center">
                      <div className="bg-background border-primary/20 flex h-12 w-12 items-center justify-center rounded-full border-2 shadow-lg transition-transform duration-300 hover:scale-110">
                        <Palette className="text-primary h-6 w-6" />
                      </div>
                      <div className="text-primary mt-1 text-xs font-medium">
                        Дизайнер
                      </div>
                    </div>

                    {/* Finance Broker */}
                    <div className="absolute left-12 top-28 flex flex-col items-center">
                      <div className="bg-background border-primary/20 flex h-12 w-12 items-center justify-center rounded-full border-2 shadow-lg transition-transform duration-300 hover:scale-110">
                        <PieChart className="text-primary h-6 w-6" />
                      </div>
                      <div className="text-primary mt-1 text-xs font-medium">
                        Брокер
                      </div>
                    </div>

                    {/* Analyst */}
                    <div className="absolute left-1/2 top-4 flex -translate-x-1/2 transform flex-col items-center">
                      <div className="bg-background border-primary/20 flex h-12 w-12 items-center justify-center rounded-full border-2 shadow-lg transition-transform duration-300 hover:scale-110">
                        <Brain className="text-primary h-6 w-6" />
                      </div>
                      <div className="text-primary mt-1 text-xs font-medium">
                        Аналитик
                      </div>
                    </div>

                    {/* Realtor */}
                    <div className="absolute bottom-20 right-24 flex flex-col items-center">
                      <div className="bg-background border-primary/20 flex h-12 w-12 items-center justify-center rounded-full border-2 shadow-lg transition-transform duration-300 hover:scale-110">
                        <Shield className="text-primary h-6 w-6" />
                      </div>
                      <div className="text-primary mt-1 text-xs font-medium">
                        Риелтор
                      </div>
                    </div>

                    {/* HR Manager */}
                    <div className="absolute bottom-12 left-4 flex flex-col items-center">
                      <div className="bg-background border-primary/20 flex h-12 w-12 items-center justify-center rounded-full border-2 shadow-lg transition-transform duration-300 hover:scale-110">
                        <Users className="text-primary h-6 w-6" />
                      </div>
                      <div className="text-primary mt-1 text-xs font-medium">
                        HR менеджер
                      </div>
                    </div>

                    {/* Lawyer */}
                    <div className="absolute right-8 top-40 flex flex-col items-center">
                      <div className="bg-background border-primary/20 flex h-12 w-12 items-center justify-center rounded-full border-2 shadow-lg transition-transform duration-300 hover:scale-110">
                        <Star className="text-primary h-6 w-6" />
                      </div>
                      <div className="text-primary mt-1 text-xs font-medium">
                        Юрист
                      </div>
                    </div>

                    {/* Archivist */}
                    <div className="absolute bottom-8 left-1/2 ml-4 flex -translate-x-1/2 transform flex-col items-center">
                      <div className="bg-background border-primary/20 flex h-12 w-12 items-center justify-center rounded-full border-2 shadow-lg transition-transform duration-300 hover:scale-110">
                        <Database className="text-primary h-6 w-6" />
                      </div>
                      <div className="text-primary mt-1 text-xs font-medium">
                        Архивист
                      </div>
                    </div>

                    {/* Content Manager */}
                    <div className="absolute left-20 top-52 flex flex-col items-center">
                      <div className="bg-background border-primary/20 flex h-12 w-12 items-center justify-center rounded-full border-2 shadow-lg transition-transform duration-300 hover:scale-110">
                        <Rocket className="text-primary h-6 w-6" />
                      </div>
                      <div className="text-primary mt-1 text-xs font-medium">
                        Контент-менеджер
                      </div>
                    </div>

                    {/* Translator */}
                    <div className="absolute right-24 top-14 flex flex-col items-center">
                      <div className="bg-background border-primary/20 flex h-12 w-12 items-center justify-center rounded-full border-2 shadow-lg transition-transform duration-300 hover:scale-110">
                        <Globe className="text-primary h-6 w-6" />
                      </div>
                      <div className="text-primary mt-1 text-xs font-medium">
                        Переводчик
                      </div>
                    </div>

                    {/* Центральный логотип Crafty агента */}
                    <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 transform flex-col items-center">
                      <div className="bg-primary text-background flex h-16 w-16 items-center justify-center rounded-full shadow-xl">
                        <Bot className="h-8 w-8" />
                      </div>
                      <div className="text-primary mt-2 text-sm font-bold">
                        CRAFTY
                      </div>
                    </div>
                  </div>
                </div>

                {/* Правая колонка преимуществ */}
                <div className="flex w-56 flex-col gap-4">
                  <div className="bg-accent/10 border-primary/15 rounded-xl border p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                      <Heading size={5} className="text-primary">
                        Мгновенное масштабирование
                      </Heading>
                    </div>
                    <Paragraph size="xsmall" className="text-muted">
                      Добавление новых агентов за секунды
                    </Paragraph>
                  </div>

                  <div className="bg-accent/10 border-primary/15 rounded-xl border p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-red-500"></div>
                      <Heading size={5} className="text-primary">
                        Постоянное обучение
                      </Heading>
                    </div>
                    <Paragraph size="xsmall" className="text-muted">
                      Агенты постоянно улучшаются и обновляются
                    </Paragraph>
                  </div>

                  <div className="bg-accent/10 border-primary/15 rounded-xl border p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-teal-500"></div>
                      <Heading size={5} className="text-primary">
                        Многозадачность
                      </Heading>
                    </div>
                    <Paragraph size="xsmall" className="text-muted">
                      Один агент заменяет нескольких специалистов
                    </Paragraph>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 md:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto mb-16 max-w-2xl text-center">
              <Heading size={2} className="text-primary mb-4 text-center">
                Результаты, которые говорят сами за себя
              </Heading>
              <Paragraph size="lead" className="text-muted">
                Наши клиенты получают измеримые результаты уже в первый месяц
                использования
              </Paragraph>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="bg-accent/10 border-primary/15 hover:bg-accent/20 rounded-xl border p-8 text-center transition-all duration-300">
                <div className="text-primary mb-2 text-8xl font-bold">
                  <NumberTicker value={85} className="text-primary" />%
                </div>
                <Heading size={4} className="text-primary mb-2 text-center">
                  Снижение затрат на персонал
                </Heading>
                <Paragraph size="body" className="text-muted">
                  Автоматизация рутинных задач позволяет сократить расходы на
                  персонал
                </Paragraph>
              </div>

              <div className="bg-accent/10 border-primary/15 hover:bg-accent/20 rounded-xl border p-8 text-center transition-all duration-300">
                <div className="text-primary mb-2 text-8xl font-bold">
                  <NumberTicker value={70} className="text-primary" />%
                </div>
                <Heading size={4} className="text-primary mb-2 text-center">
                  Ускорение отклика
                </Heading>
                <Paragraph size="body" className="text-muted">
                  Мгновенные ответы на запросы клиентов в любое время суток
                </Paragraph>
              </div>

              <div className="bg-accent/10 border-primary/15 hover:bg-accent/20 rounded-xl border p-8 text-center transition-all duration-300">
                <Paragraph
                  size="title"
                  className="text-primary mb-2 text-8xl font-bold"
                >
                  ∞
                </Paragraph>
                <Heading size={4} className="text-primary mb-2 text-center">
                  Масштабируемость
                </Heading>
                <Paragraph size="body" className="text-muted">
                  Сотни агентов без деградации производительности
                </Paragraph>
              </div>
            </div>
          </div>
        </section>

        {/* Integrations Section */}
        <section id="integrations" className="py-20 md:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto mb-16 max-w-4xl text-center">
              <Heading size={2} className="text-primary mb-4 text-center">
                Интеграция со всеми популярными мессенджерами
              </Heading>
              <Paragraph size="lead" className="text-muted mb-8">
                Подключите Crafty к любому мессенджеру и начните получать
                запросы клиентов прямо сейчас
              </Paragraph>
            </div>

            <div className="grid items-center gap-8 lg:grid-cols-2">
              {/* Левая часть - описание и иконки мессенджеров */}
              <div className="space-y-6">
                <div className="grid grid-cols-4 gap-4">
                  {/* Telegram */}
                  <div className="bg-accent/10 border-primary/15 rounded-xl border p-4 text-center">
                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-[#0088cc]">
                      <span className="text-lg font-bold text-white">T</span>
                    </div>
                    <Paragraph size="xsmall" className="text-muted">
                      Telegram
                    </Paragraph>
                  </div>

                  {/* WhatsApp */}
                  <div className="bg-accent/10 border-primary/15 rounded-xl border p-4 text-center">
                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-[#25D366]">
                      <span className="text-lg font-bold text-white">W</span>
                    </div>
                    <Paragraph size="xsmall" className="text-muted">
                      WhatsApp
                    </Paragraph>
                  </div>

                  {/* Discord */}
                  <div className="bg-accent/10 border-primary/15 rounded-xl border p-4 text-center">
                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-[#5865F2]">
                      <span className="text-lg font-bold text-white">D</span>
                    </div>
                    <Paragraph size="xsmall" className="text-muted">
                      Discord
                    </Paragraph>
                  </div>

                  {/* Slack */}
                  <div className="bg-accent/10 border-primary/15 rounded-xl border p-4 text-center">
                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-[#4A154B]">
                      <span className="text-lg font-bold text-white">S</span>
                    </div>
                    <Paragraph size="xsmall" className="text-muted">
                      Slack
                    </Paragraph>
                  </div>

                  {/* Viber */}
                  <div className="bg-accent/10 border-primary/15 rounded-xl border p-4 text-center">
                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-[#665CAC]">
                      <span className="text-lg font-bold text-white">V</span>
                    </div>
                    <Paragraph size="xsmall" className="text-muted">
                      Viber
                    </Paragraph>
                  </div>

                  {/* VK */}
                  <div className="bg-accent/10 border-primary/15 rounded-xl border p-4 text-center">
                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-[#0077FF]">
                      <span className="text-lg font-bold text-white">VK</span>
                    </div>
                    <Paragraph size="xsmall" className="text-muted">
                      VKontakte
                    </Paragraph>
                  </div>

                  {/* Facebook Messenger */}
                  <div className="bg-accent/10 border-primary/15 rounded-xl border p-4 text-center">
                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-[#00B2FF]">
                      <span className="text-lg font-bold text-white">M</span>
                    </div>
                    <Paragraph size="xsmall" className="text-muted">
                      Messenger
                    </Paragraph>
                  </div>

                  {/* Instagram */}
                  <div className="bg-accent/10 border-primary/15 rounded-xl border p-4 text-center">
                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#833ab4] via-[#fd1d1d] to-[#fcb045]">
                      <span className="text-lg font-bold text-white">I</span>
                    </div>
                    <Paragraph size="xsmall" className="text-muted">
                      Instagram
                    </Paragraph>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-accent text-primary flex h-8 w-8 items-center justify-center rounded-xl">
                      <Zap className="h-4 w-4" />
                    </div>
                    <Paragraph size="body" className="text-muted">
                      Мгновенное подключение за 5 минут
                    </Paragraph>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="bg-accent text-primary flex h-8 w-8 items-center justify-center rounded-xl">
                      <Shield className="h-4 w-4" />
                    </div>
                    <Paragraph size="body" className="text-muted">
                      Безопасная передача данных
                    </Paragraph>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="bg-accent text-primary flex h-8 w-8 items-center justify-center rounded-xl">
                      <Users className="h-4 w-4" />
                    </div>
                    <Paragraph size="body" className="text-muted">
                      Единая панель управления для всех каналов
                    </Paragraph>
                  </div>
                </div>
              </div>

              {/* Правая часть - живая лента сообщений */}
              <div className="flex justify-center">
                <div className="w-full max-w-lg">
                  <div className="bg-accent/10 border-primary/15 rounded-xl border p-6">
                    <Heading size={4} className="text-primary mb-4 text-center">
                      Входящие сообщения
                    </Heading>
                    <div className="h-[336px] overflow-hidden">
                      <AnimatedList delay={1500}>
                        <MessageItem
                          platform="Telegram"
                          message="Здравствуйте! Как оформить заказ на доставку?"
                          user="Анна К."
                          time="сейчас"
                          platformColor="#0088cc"
                        />
                        <MessageItem
                          platform="WhatsApp"
                          message="Добрый день! Можно узнать стоимость услуги?"
                          user="Михаил И."
                          time="1 мин назад"
                          platformColor="#25D366"
                        />
                        <MessageItem
                          platform="Discord"
                          message="Привет! Есть ли скидки для студентов?"
                          user="student_alex"
                          time="2 мин назад"
                          platformColor="#5865F2"
                        />
                        <MessageItem
                          platform="Viber"
                          message="Подскажите режим работы службы поддержки"
                          user="Елена С."
                          time="3 мин назад"
                          platformColor="#665CAC"
                        />
                        <MessageItem
                          platform="VKontakte"
                          message="Как отменить заказ?"
                          user="Дмитрий В."
                          time="4 мин назад"
                          platformColor="#0077FF"
                        />
                        <MessageItem
                          platform="Messenger"
                          message="Спасибо за быстрый ответ! Очень помогли 👍"
                          user="Maria L."
                          time="5 мин назад"
                          platformColor="#00B2FF"
                        />
                      </AnimatedList>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="bg-accent/10 py-20 md:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto mb-16 max-w-2xl text-center">
              <Heading size={2} className="text-primary mb-4 text-center">
                Что говорят наши клиенты
              </Heading>
              <Paragraph size="lead" className="text-muted">
                Реальные отзывы от компаний, которые уже используют Crafty
              </Paragraph>
            </div>

            {/* Первая строка отзывов */}
            <Marquee pauseOnHover className="mb-6 [--duration:60s]">
              <TestimonialCard
                name="Анна Петрова"
                position="CEO"
                company="TechStart"
                review="С Crafty-агентами мы сократили время обработки запросов на 70% и значительно улучшили качество обслуживания клиентов."
              />
              <TestimonialCard
                name="Михаил Иванов"
                position="CTO"
                company="FinanceApp"
                review="Невероятная скорость развертывания! За один день мы запустили полноценную систему поддержки клиентов."
              />
              <TestimonialCard
                name="Елена Сидорова"
                position="Marketing Director"
                company="CreativeStudio"
                review="Crafty помог нам автоматизировать создание контента. Теперь мы публикуем в 3 раза больше качественных материалов."
              />
              <TestimonialCard
                name="Дмитрий Козлов"
                position="Head of Operations"
                company="LogiTech"
                review="Интеграция заняла всего 2 часа. Теперь наши агенты обрабатывают заказы автоматически и без ошибок."
              />
              <TestimonialCard
                name="Ольга Смирнова"
                position="Product Manager"
                company="EcomStore"
                review="ROI от внедрения Crafty превысил 300% уже через месяц использования. Это невероятно!"
              />
            </Marquee>

            {/* Вторая строка отзывов (обратное направление) */}
            <Marquee reverse pauseOnHover className="[--duration:60s]">
              <TestimonialCard
                name="Александр Волков"
                position="Data Scientist"
                company="AnalyticsPro"
                review="Мультимодальные возможности Crafty позволили нам автоматизировать анализ видео и аудио контента."
              />
              <TestimonialCard
                name="Мария Федорова"
                position="HR Director"
                company="PeopleFirst"
                review="Агенты Crafty помогают нам проводить предварительные интервью и отбирать лучших кандидатов."
              />
              <TestimonialCard
                name="Игорь Новиков"
                position="Founder"
                company="StartupHub"
                review="Благодаря Crafty мы масштабировали поддержку с 10 до 1000+ клиентов без найма новых сотрудников."
              />
              <TestimonialCard
                name="Татьяна Белова"
                position="CFO"
                company="FinanceGroup"
                review="Автоматизация отчетности сэкономила нам 40 часов работы каждую неделю. Просто фантастика!"
              />
              <TestimonialCard
                name="Андрей Морозов"
                position="Tech Lead"
                company="DevStudio"
                review="API Crafty настолько простое, что мы интегрировали его во все наши продукты за выходные."
              />
            </Marquee>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 md:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto mb-16 max-w-2xl text-center">
              <Heading size={2} className="text-primary mb-4 text-center">
                Выберите подходящий тариф
              </Heading>
              <Paragraph size="lead" className="text-muted">
                Гибкие планы для бизнеса любого размера
              </Paragraph>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="bg-accent/10 border-primary/15 hover:border-primary/20 rounded-xl border p-6 transition-all duration-300">
                <Heading size={3} className="text-primary mb-2 text-center">
                  Starter
                </Heading>
                <Paragraph size="body" className="text-muted mb-4">
                  Для небольших команд
                </Paragraph>
                <div className="mb-6">
                  <Paragraph
                    size="title"
                    className="text-primary inline text-4xl font-bold"
                  >
                    $29
                  </Paragraph>
                  <Paragraph size="body" className="text-muted inline">
                    /мес
                  </Paragraph>
                </div>
                <ul className="mb-6 space-y-3">
                  <li className="text-muted flex items-center">
                    <Shield className="text-primary mr-2 h-4 w-4" />
                    <Paragraph size="body" className="text-muted">
                      До 5 агентов
                    </Paragraph>
                  </li>
                  <li className="text-muted flex items-center">
                    <Shield className="text-primary mr-2 h-4 w-4" />
                    <Paragraph size="body" className="text-muted">
                      Базовая аналитика
                    </Paragraph>
                  </li>
                  <li className="text-muted flex items-center">
                    <Shield className="text-primary mr-2 h-4 w-4" />
                    <Paragraph size="body" className="text-muted">
                      Email поддержка
                    </Paragraph>
                  </li>
                  <li className="text-muted flex items-center">
                    <Shield className="text-primary mr-2 h-4 w-4" />
                    <Paragraph size="body" className="text-muted">
                      API доступ
                    </Paragraph>
                  </li>
                </ul>
                <Button
                  onClick={handleGetStarted}
                  variant="outline"
                  size="lg"
                  className="border-primary/15 bg-accent text-muted hover:bg-accent/80 h-10 w-full rounded-xl border text-xs font-medium uppercase"
                >
                  Начать
                </Button>
              </div>

              <div className="bg-background border-primary/20 hover:border-primary/40 relative rounded-xl border-2 p-6 transition-all duration-300">
                <div className="bg-primary text-background absolute -top-3 left-1/2 -translate-x-1/2 transform rounded-xl px-3 py-1">
                  <Paragraph
                    size="xsmall"
                    className="text-background font-medium uppercase"
                  >
                    Популярный
                  </Paragraph>
                </div>
                <Heading size={3} className="text-primary mb-2 text-center">
                  Growth
                </Heading>
                <Paragraph size="body" className="text-muted mb-4">
                  Для растущих компаний
                </Paragraph>
                <div className="mb-6">
                  <Paragraph
                    size="title"
                    className="text-primary inline text-4xl font-bold"
                  >
                    $99
                  </Paragraph>
                  <Paragraph size="body" className="text-muted inline">
                    /мес
                  </Paragraph>
                </div>
                <ul className="mb-6 space-y-3">
                  <li className="text-muted flex items-center">
                    <Shield className="text-primary mr-2 h-4 w-4" />
                    <Paragraph size="body" className="text-muted">
                      До 25 агентов
                    </Paragraph>
                  </li>
                  <li className="text-muted flex items-center">
                    <Shield className="text-primary mr-2 h-4 w-4" />
                    <Paragraph size="body" className="text-muted">
                      Расширенная аналитика
                    </Paragraph>
                  </li>
                  <li className="text-muted flex items-center">
                    <Shield className="text-primary mr-2 h-4 w-4" />
                    <Paragraph size="body" className="text-muted">
                      Приоритетная поддержка
                    </Paragraph>
                  </li>
                  <li className="text-muted flex items-center">
                    <Shield className="text-primary mr-2 h-4 w-4" />
                    <Paragraph size="body" className="text-muted">
                      Интеграции
                    </Paragraph>
                  </li>
                  <li className="text-muted flex items-center">
                    <Shield className="text-primary mr-2 h-4 w-4" />
                    <Paragraph size="body" className="text-muted">
                      Мультимодальность
                    </Paragraph>
                  </li>
                </ul>
                <Button
                  onClick={handleGetStarted}
                  size="lg"
                  className="bg-primary text-background hover:bg-primary/80 h-10 w-full rounded-xl text-xs font-medium uppercase"
                >
                  Выбрать план
                </Button>
              </div>

              <div className="bg-accent/10 border-primary/15 hover:border-primary/20 rounded-xl border p-6 transition-all duration-300">
                <Heading size={3} className="text-primary mb-2 text-center">
                  Pro
                </Heading>
                <Paragraph size="body" className="text-muted mb-4">
                  Для крупных предприятий
                </Paragraph>
                <div className="mb-6">
                  <Paragraph
                    size="title"
                    className="text-primary inline text-4xl font-bold"
                  >
                    $299
                  </Paragraph>
                  <Paragraph size="body" className="text-muted inline">
                    /мес
                  </Paragraph>
                </div>
                <ul className="mb-6 space-y-3">
                  <li className="text-muted flex items-center">
                    <Shield className="text-primary mr-2 h-4 w-4" />
                    <Paragraph size="body" className="text-muted">
                      Неограниченно агентов
                    </Paragraph>
                  </li>
                  <li className="text-muted flex items-center">
                    <Shield className="text-primary mr-2 h-4 w-4" />
                    <Paragraph size="body" className="text-muted">
                      Real-time мониторинг
                    </Paragraph>
                  </li>
                  <li className="text-muted flex items-center">
                    <Shield className="text-primary mr-2 h-4 w-4" />
                    <Paragraph size="body" className="text-muted">
                      24/7 поддержка + SLA
                    </Paragraph>
                  </li>
                  <li className="text-muted flex items-center">
                    <Shield className="text-primary mr-2 h-4 w-4" />
                    <Paragraph size="body" className="text-muted">
                      Кастомные интеграции
                    </Paragraph>
                  </li>
                  <li className="text-muted flex items-center">
                    <Shield className="text-primary mr-2 h-4 w-4" />
                    <Paragraph size="body" className="text-muted">
                      Выделенный менеджер
                    </Paragraph>
                  </li>
                </ul>
                <Button
                  onClick={handleGetStarted}
                  variant="outline"
                  size="lg"
                  className="border-primary/15 bg-accent text-muted hover:bg-accent/80 h-10 w-full rounded-xl border text-xs font-medium uppercase"
                >
                  Связаться с нами
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-accent/10 border-accent/20 border-y py-20 md:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <Heading size={2} className="text-primary mb-4 text-center">
                Готовы начать?
              </Heading>
              <Paragraph size="lead" className="text-muted mb-8">
                Присоединяйтесь к тысячам компаний, которые уже автоматизировали
                свой бизнес с Crafty
              </Paragraph>
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                <RainbowButton
                  onClick={handleGetStarted}
                  size="lg"
                  className="h-12 w-auto text-xs font-medium uppercase"
                >
                  Попробовать бесплатно
                </RainbowButton>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-accent/20 bg-accent/10 border-t">
        <div className="container mx-auto px-4 py-12 md:px-6">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center space-x-2">
                <div className="bg-accent flex h-8 w-8 items-center justify-center rounded-xl">
                  <Bot className="text-primary h-5 w-5" />
                </div>
                <span className="text-primary text-xl font-bold">CRAFTY</span>
              </div>
              <Paragraph size="body" className="text-muted">
                Создавайте умных AI-агентов для автоматизации вашего бизнеса
              </Paragraph>
            </div>
            <div>
              <Heading size={4} className="text-primary mb-4 text-center">
                Продукт
              </Heading>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#features"
                    className="text-muted hover:text-primary text-sm transition-colors"
                  >
                    Возможности
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="text-muted hover:text-primary text-sm transition-colors"
                  >
                    Цены
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-muted hover:text-primary text-sm transition-colors"
                  >
                    API
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-muted hover:text-primary text-sm transition-colors"
                  >
                    Документация
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <Heading size={4} className="text-primary mb-4 text-center">
                Компания
              </Heading>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-muted hover:text-primary text-sm transition-colors"
                  >
                    О нас
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-muted hover:text-primary text-sm transition-colors"
                  >
                    Блог
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-muted hover:text-primary text-sm transition-colors"
                  >
                    Карьера
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-muted hover:text-primary text-sm transition-colors"
                  >
                    Контакты
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <Heading size={4} className="text-primary mb-4 text-center">
                Поддержка
              </Heading>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-muted hover:text-primary text-sm transition-colors"
                  >
                    Справка
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-muted hover:text-primary text-sm transition-colors"
                  >
                    Статус
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-muted hover:text-primary text-sm transition-colors"
                  >
                    Сообщество
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-muted hover:text-primary text-sm transition-colors"
                  >
                    Безопасность
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-accent/20 mt-8 flex flex-col items-center justify-between border-t pt-8 sm:flex-row">
            <Paragraph size="xsmall" className="text-muted">
              © 2024 Crafty. Все права защищены.
            </Paragraph>
            <div className="mt-4 flex space-x-4 sm:mt-0">
              <a
                href="#"
                className="text-muted hover:text-primary text-sm transition-colors"
              >
                Политика конфиденциальности
              </a>
              <a
                href="#"
                className="text-muted hover:text-primary text-sm transition-colors"
              >
                Условия использования
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating CTA Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={handleGetStarted}
          size="lg"
          className="bg-primary text-background hover:bg-primary/80 h-12 w-auto rounded-xl text-xs font-medium uppercase shadow-lg transition-all duration-300 hover:shadow-xl"
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          Попробовать сейчас
        </Button>
      </div>
    </div>
  )
}
