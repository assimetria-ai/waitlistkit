// @custom — Mobile responsiveness showcase component
// Demonstrates all mobile-first responsive design patterns
// Use as reference for implementing mobile-responsive layouts

import { useState } from 'react'
import { Smartphone, Tablet, Monitor, Check, X, ChevronRight } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../@system/Card'
import { Button } from '../../@system/ui/button'
import { Badge } from '../../@system/ui/badge'

export function MobileShowcase() {
  const [activeTab, setActiveTab] = useState('layout')

  return (
    <div className="mobile-container section-padding-mobile">
      {/* Header */}
      <div className="text-center mb-8 sm:mb-12">
        <h1 className="text-fluid-4xl font-bold mb-4">
          Mobile-First Responsive Design
        </h1>
        <p className="text-fluid-lg text-muted-foreground max-w-2xl mx-auto">
          All components are optimized for mobile devices with touch-friendly interactions and responsive layouts.
        </p>
      </div>

      {/* Device Preview Section */}
      <section className="mb-12 sm:mb-16">
        <h2 className="text-fluid-2xl font-bold mb-6">Responsive Breakpoints</h2>

        <div className="mobile-card-grid-3">
          <Card className="group hover:shadow-lg transition-shadow">
            <CardContent className="pt-6 text-center">
              <div className="mb-4 mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Smartphone className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Mobile</h3>
              <p className="text-sm text-muted-foreground mb-3">
                375px - 640px
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Badge variant="outline">Touch-optimized</Badge>
                <Badge variant="outline">Stack layout</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-shadow">
            <CardContent className="pt-6 text-center">
              <div className="mb-4 mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Tablet className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Tablet</h3>
              <p className="text-sm text-muted-foreground mb-3">
                640px - 1024px
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Badge variant="outline">2-column grid</Badge>
                <Badge variant="outline">Hybrid layout</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-shadow">
            <CardContent className="pt-6 text-center">
              <div className="mb-4 mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Monitor className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Desktop</h3>
              <p className="text-sm text-muted-foreground mb-3">
                1024px+
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Badge variant="outline">Multi-column</Badge>
                <Badge variant="outline">Sidebar layout</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Responsive Grid Demo */}
      <section className="mb-12 sm:mb-16">
        <h2 className="text-fluid-2xl font-bold mb-6">Responsive Grid Patterns</h2>

        <div className="space-y-6">
          {/* Auto-fit Grid */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Auto-fit Cards</h3>
            <div className="grid-auto-fit-cards">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="h-24 flex items-center justify-center text-muted-foreground">
                      Card {i}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* 2-Column Grid */}
          <div>
            <h3 className="text-lg font-semibold mb-3">2-Column Mobile Grid</h3>
            <div className="mobile-card-grid-2">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="h-16 flex items-center justify-center text-muted-foreground">
                      Item {i}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Button Groups */}
      <section className="mb-12 sm:mb-16">
        <h2 className="text-fluid-2xl font-bold mb-6">Responsive Buttons</h2>

        <Card>
          <CardContent className="pt-6 space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-3 text-muted-foreground">
                Full-width on mobile, auto on desktop
              </h3>
              <div className="mobile-button-group">
                <Button>Primary Action</Button>
                <Button variant="outline">Secondary</Button>
                <Button variant="ghost">Tertiary</Button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-3 text-muted-foreground">
                Touch-optimized sizes (min 44x44px)
              </h3>
              <div className="flex flex-wrap gap-3">
                <Button size="sm" className="touch-target-sm">Small</Button>
                <Button size="default" className="touch-target">Default</Button>
                <Button size="lg" className="touch-target-lg">Large</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Typography Scale */}
      <section className="mb-12 sm:mb-16">
        <h2 className="text-fluid-2xl font-bold mb-6">Fluid Typography</h2>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">text-fluid-4xl</p>
              <h1 className="text-fluid-4xl font-bold">Hero Headline</h1>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">text-fluid-3xl</p>
              <h2 className="text-fluid-3xl font-bold">Page Title</h2>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">text-fluid-2xl</p>
              <h3 className="text-fluid-2xl font-semibold">Section Heading</h3>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">text-fluid-xl</p>
              <h4 className="text-fluid-xl font-semibold">Card Title</h4>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">text-fluid-base</p>
              <p className="text-fluid-base">
                Body text that scales smoothly across all screen sizes using CSS clamp().
                Improves readability without manual breakpoint management.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Stack Patterns */}
      <section className="mb-12 sm:mb-16">
        <h2 className="text-fluid-2xl font-bold mb-6">Layout Stacking</h2>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mobile Stack</CardTitle>
              <CardDescription>Vertical on mobile, horizontal on desktop</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mobile-stack">
                <div className="flex-1 p-4 bg-primary/10 rounded">Content A</div>
                <div className="flex-1 p-4 bg-primary/10 rounded">Content B</div>
                <div className="flex-1 p-4 bg-primary/10 rounded">Content C</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mobile Stack Reverse</CardTitle>
              <CardDescription>Reverse order on mobile</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mobile-stack-reverse">
                <div className="flex-1 p-4 bg-primary/10 rounded">First on Desktop</div>
                <div className="flex-1 p-4 bg-primary/10 rounded">Second on Desktop</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Horizontal Scroll */}
      <section className="mb-12 sm:mb-16">
        <h2 className="text-fluid-2xl font-bold mb-6">Horizontal Scroll (Mobile)</h2>

        <Card>
          <CardContent className="pt-6">
            <div className="mobile-scroll-x mobile-scroll-hint">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="inline-flex min-w-[200px] h-32 items-center justify-center bg-primary/10 rounded-lg mr-4 last:mr-0"
                >
                  Item {i}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Best Practices Checklist */}
      <section className="mb-12 sm:mb-16">
        <h2 className="text-fluid-2xl font-bold mb-6">Mobile-First Checklist</h2>

        <Card>
          <CardContent className="pt-6">
            <div className="mobile-list-spacing">
              {[
                'Touch targets minimum 44x44px',
                'Prevent iOS input zoom (16px font)',
                'Safe area insets for notched devices',
                'Horizontal scroll for data tables',
                'Stack forms vertically on mobile',
                'Reduce motion for accessibility',
                'Test landscape orientation',
                'Optimize tap feedback'
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-4 w-4" />
                  </div>
                  <span className="text-sm sm:text-base">{item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Testing Guide */}
      <section>
        <h2 className="text-fluid-2xl font-bold mb-6">Testing Devices</h2>

        <div className="mobile-card-grid-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                Supported
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>iPhone SE</span>
                <span className="text-muted-foreground">375px</span>
              </div>
              <div className="flex justify-between">
                <span>iPhone 14</span>
                <span className="text-muted-foreground">390px</span>
              </div>
              <div className="flex justify-between">
                <span>Samsung Galaxy S20</span>
                <span className="text-muted-foreground">360px</span>
              </div>
              <div className="flex justify-between">
                <span>iPad</span>
                <span className="text-muted-foreground">768px</span>
              </div>
              <div className="flex justify-between">
                <span>Desktop</span>
                <span className="text-muted-foreground">1024px+</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance Targets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <div className="flex justify-between mb-1">
                  <span>Lighthouse Mobile</span>
                  <span className="font-medium">&gt; 90</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '90%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span>First Contentful Paint</span>
                  <span className="font-medium">&lt; 1.8s</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span>Cumulative Layout Shift</span>
                  <span className="font-medium">&lt; 0.1</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '95%' }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Documentation Link */}
      <div className="mt-12 sm:mt-16 text-center">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <h3 className="text-xl font-semibold mb-2">
              Complete Documentation
            </h3>
            <p className="text-muted-foreground mb-4">
              Learn more about our mobile-first design system
            </p>
            <Button asChild>
              <a href="/docs/MOBILE-RESPONSIVE-DESIGN.md" className="gap-2">
                View Documentation <ChevronRight className="h-4 w-4" />
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
