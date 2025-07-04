'use client'

import React from 'react'
import { BentoCard, BentoGrid } from '@/components/magicui/bento-grid'
import { Marquee } from '@/components/magicui/marquee'
import { AnimatedList } from '@/components/magicui/animated-list'
import Heading from '@/components/ui/typography/Heading'
import Paragraph from '@/components/ui/typography/Paragraph'
import {
  Brain,
  Clock,
  Settings,
  Shield,
  Sparkles,
  Zap,
  TrendingUp,
  BookOpen,
  Calculator,
  FileText,
  Target
} from 'lucide-react'

// Компонент уведомления для анимированного списка
const NotificationItem = ({
  name,
  description,
  icon: Icon,
  time
}: {
  name: string
  description: string
  icon: React.ElementType
  time: string
}) => (
  <figure className="bg-accent/10 border-primary/15 relative mx-auto min-h-fit w-full max-w-[400px] cursor-pointer overflow-hidden rounded-xl border p-4">
    <div className="flex flex-row items-center gap-3">
      <div className="bg-accent text-primary flex size-10 items-center justify-center rounded-xl">
        <Icon className="size-5" />
      </div>
      <div className="flex flex-col overflow-hidden">
        <figcaption className="text-primary flex flex-row items-center whitespace-pre text-sm font-medium">
          <span>{name}</span>
          <span className="mx-1">·</span>
          <span className="text-muted text-xs">{time}</span>
        </figcaption>
        <p className="text-muted text-xs">{description}</p>
      </div>
    </div>
  </figure>
)

// Данные для анимированного списка задач - уникальные для bento
const businessTasks = [
  {
    name: 'Обучение модели',
    description: 'Агент изучил новую базу знаний продукта',
    time: '1м назад',
    icon: BookOpen
  },
  {
    name: 'Оптимизация процесса',
    description: 'Улучшен алгоритм распределения задач',
    time: '3м назад',
    icon: Target
  },
  {
    name: 'Анализ эффективности',
    description: 'Составлен отчет о производительности агентов',
    time: '7м назад',
    icon: TrendingUp
  },
  {
    name: 'Обработка документов',
    description: 'Проанализировано 250 документов за час',
    time: '10м назад',
    icon: FileText
  },
  {
    name: 'Настройка параметров',
    description: 'Адаптация под специфику бизнеса клиента',
    time: '14м назад',
    icon: Settings
  },
  {
    name: 'Мониторинг качества',
    description: 'Проверка точности ответов агентов',
    time: '17м назад',
    icon: Calculator
  }
]

// Данные для технических особенностей - более техничные чем в других секциях
const technicalFeatures = [
  { name: 'Нейросети', logo: '🧠' },
  { name: 'Машинное обучение', logo: '🤖' },
  { name: 'NLP', logo: '💬' },
  { name: 'Computer Vision', logo: '👁️' },
  { name: 'RAG', logo: '📚' },
  { name: 'Vector DB', logo: '🗄️' },
  { name: 'Fine-tuning', logo: '⚙️' },
  { name: 'Multi-modal', logo: '🎭' },
  { name: 'Real-time', logo: '⚡' },
  { name: 'Auto-scaling', logo: '📈' }
]

const TechCard = ({ name, logo }: { name: string; logo: string }) => (
  <div className="bg-accent/5 border-primary/15 dark:bg-accent/15 flex w-32 flex-col items-center justify-center rounded-xl border p-4">
    <div className="mb-2 text-2xl">{logo}</div>
    <div className="text-muted text-center text-xs font-medium">{name}</div>
  </div>
)

export default function BusinessFeaturesBento() {
  return (
    <section id="features" className="py-20 md:py-32">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <Heading size={2} className="text-primary mb-4 text-center">
            Мощные возможности для вашего бизнеса
          </Heading>
          <Paragraph size="lead" className="text-muted">
            Создавайте умных цифровых сотрудников с передовыми AI-технологиями.
            Полная автоматизация рутинных процессов для вашего МСБ.
          </Paragraph>
        </div>

        <BentoGrid className="lg:grid-rows-3">
          {/* Первый ряд: Умное обучение и адаптация - большая карточка */}
          <BentoCard
            name="Самообучающиеся агенты"
            className="col-span-3 lg:col-span-3"
            background={
              <div className="bg-accent/5 dark:bg-accent/10 absolute inset-0">
                <div className="absolute bottom-0 right-0 top-0 z-0 w-1/2">
                  <AnimatedList className="h-full bg-clip-padding">
                    {businessTasks.map((item, idx) => (
                      <NotificationItem key={idx} {...item} />
                    ))}
                  </AnimatedList>
                </div>
              </div>
            }
            Icon={
              <div className="bg-accent text-primary flex h-12 w-12 items-center justify-center rounded-xl">
                <Brain className="h-6 w-6" />
              </div>
            }
            description="Агенты автоматически обучаются на данных, адаптируются под бизнес-процессы и становятся экспертами в вашей области"
          />
          <div className="col-span-3 p-6 lg:col-span-3">
            <div className="mb-2 flex flex-col items-start gap-3">
              <div className="bg-accent text-primary flex h-12 w-12 items-center justify-center rounded-xl">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="text-start">
                <h3 className="text-primary mb-2 text-lg font-semibold">
                  Передовые AI-технологии под капотом
                </h3>
                <p className="text-muted text-sm">
                  Нейросети, машинное обучение, NLP и компьютерное зрение. Все
                  последние достижения AI в одной платформе
                </p>
              </div>
            </div>
          </div>

          {/* Второй ряд: AI-технологии и Безопасность */}
          <BentoCard
            name=""
            className="h-30 col-span-1 lg:col-span-3"
            background={
              <div className="bg-accent/5 dark:bg-accent/10 absolute inset-0">
                <div className="absolute inset-0 z-0">
                  <Marquee className="h-30" pauseOnHover>
                    {technicalFeatures.map((feature, idx) => (
                      <TechCard key={idx} {...feature} />
                    ))}
                  </Marquee>
                </div>
              </div>
            }
            Icon={
              <div className="bg-accent text-primary h-0.1 w-0.1 flex items-center justify-center rounded-xl"></div>
            }
            description=""
          />
          <BentoCard
            name="Корпоративная безопасность"
            className="col-span-4 lg:col-span-1"
            background={
              <div className="grid h-full grid-cols-1 gap-2 p-4"></div>
            }
            Icon={
              <div className="bg-accent text-primary flex h-12 w-12 items-center justify-center rounded-xl">
                <Shield className="h-6 w-6" />
              </div>
            }
            description="Соответствие GDPR, 152-ФЗ, банковским стандартам. Все данные остаются в вашей инфраструктуре"
          />

          {/* Третий ряд: Три карточки в строчку */}
          <BentoCard
            name="Запуск за 5 минут"
            className="col-span-2 lg:col-span-1"
            background={
              <div className="bg-accent/5 dark:bg-accent/10 absolute inset-0"></div>
            }
            Icon={
              <div className="bg-accent text-primary flex h-12 w-12 items-center justify-center rounded-xl">
                <Zap className="h-6 w-6" />
              </div>
            }
            description="От регистрации до первого агента в продакшене. Никаких сложных настроек и месяцев интеграции"
          />

          <BentoCard
            name="Работа без сбоев - 99.9% uptime"
            className="col-span-3 lg:col-span-1"
            background={
              <div className="bg-accent/5 dark:bg-accent/10 absolute inset-0"></div>
            }
            Icon={
              <div className="bg-accent text-primary flex h-12 w-12 items-center justify-center rounded-xl">
                <Clock className="h-6 w-6" />
              </div>
            }
            description="Отказоустойчивая архитектура и автоматическое восстановление. Ваш бизнес работает непрерывно"
          />
        </BentoGrid>
      </div>
    </section>
  )
}
