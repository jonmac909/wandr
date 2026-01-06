'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Sparkles,
  PenTool,
  Upload,
  ArrowLeft,
  Wand2,
  Map,
  FileText,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function PlanModePage() {
  const router = useRouter()
  const [hoveredOption, setHoveredOption] = useState<string | null>(null)

  const planningOptions = [
    {
      id: 'ai-assisted',
      title: 'Plan it for me',
      subtitle: 'AI-powered planning',
      description: 'Answer a few questions and let AI create a personalized itinerary based on your travel style, interests, and budget.',
      icon: Sparkles,
      gradient: 'from-primary/20 via-primary/10 to-transparent',
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      href: '/questionnaire',
      features: [
        { icon: Wand2, text: 'Smart recommendations' },
        { icon: Map, text: 'Optimized routes' },
        { icon: FileText, text: 'Full itinerary generated' },
      ],
      cta: 'Start Questionnaire',
      recommended: true,
    },
    {
      id: 'manual',
      title: 'Do it myself',
      subtitle: 'Manual planning',
      description: 'Start with a blank canvas and build your trip from scratch. Perfect if you already know what you want.',
      icon: PenTool,
      gradient: 'from-chart-2/20 via-chart-2/10 to-transparent',
      iconBg: 'bg-chart-2/10',
      iconColor: 'text-chart-2',
      href: '/trip/new',
      features: [
        { icon: Map, text: 'Full control over planning' },
        { icon: FileText, text: 'Add activities manually' },
      ],
      cta: 'Start Planning',
      recommended: false,
    },
    {
      id: 'import',
      title: 'Import existing trip',
      subtitle: 'Upload or paste',
      description: 'Already have an itinerary? Import from documents, images, emails, or paste text directly.',
      icon: Upload,
      gradient: 'from-chart-3/20 via-chart-3/10 to-transparent',
      iconBg: 'bg-chart-3/10',
      iconColor: 'text-chart-3',
      href: '/import',
      features: [
        { icon: FileText, text: 'PDF, images, text' },
        { icon: Wand2, text: 'AI extracts details' },
      ],
      cta: 'Import Trip',
      recommended: false,
    },
  ]

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="container max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-semibold">Plan a Trip</h1>
            <p className="text-xs text-muted-foreground">Choose how you want to plan</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Intro */}
        <div className="text-center py-4">
          <h2 className="text-2xl font-bold mb-2">How would you like to plan?</h2>
          <p className="text-muted-foreground">
            Choose your preferred planning style
          </p>
        </div>

        {/* Options */}
        <div className="space-y-4">
          {planningOptions.map((option) => {
            const Icon = option.icon
            const isHovered = hoveredOption === option.id

            return (
              <Link
                key={option.id}
                href={option.href}
                className="block"
                onMouseEnter={() => setHoveredOption(option.id)}
                onMouseLeave={() => setHoveredOption(null)}
              >
                <Card className={`
                  relative overflow-hidden transition-all duration-300 cursor-pointer
                  hover:shadow-lg hover:scale-[1.02] hover:border-primary/30
                  ${option.recommended ? 'ring-2 ring-primary/20' : ''}
                `}>
                  {/* Background gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${option.gradient} opacity-50`} />

                  {/* Recommended badge */}
                  {option.recommended && (
                    <div className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs font-medium px-2 py-1 rounded-full">
                      Recommended
                    </div>
                  )}

                  <CardHeader className="relative pb-2">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl ${option.iconBg}`}>
                        <Icon className={`w-6 h-6 ${option.iconColor}`} />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {option.title}
                        </CardTitle>
                        <CardDescription className="text-xs uppercase tracking-wide mt-0.5">
                          {option.subtitle}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="relative pt-0">
                    <p className="text-sm text-muted-foreground mb-4">
                      {option.description}
                    </p>

                    {/* Features */}
                    <div className="flex flex-wrap gap-3 mb-4">
                      {option.features.map((feature, idx) => {
                        const FeatureIcon = feature.icon
                        return (
                          <div
                            key={idx}
                            className="flex items-center gap-1.5 text-xs text-muted-foreground"
                          >
                            <FeatureIcon className="w-3.5 h-3.5" />
                            <span>{feature.text}</span>
                          </div>
                        )
                      })}
                    </div>

                    {/* CTA */}
                    <div className="flex items-center justify-between">
                      <span className={`
                        text-sm font-medium transition-colors
                        ${isHovered ? option.iconColor : 'text-foreground'}
                      `}>
                        {option.cta}
                      </span>
                      <ChevronRight className={`
                        w-5 h-5 transition-all
                        ${isHovered ? `${option.iconColor} translate-x-1` : 'text-muted-foreground'}
                      `} />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* Bottom hint */}
        <p className="text-center text-xs text-muted-foreground pt-4">
          Not sure? Start with AI-assisted planning — you can always customize later.
        </p>
      </div>
    </main>
  )
}
