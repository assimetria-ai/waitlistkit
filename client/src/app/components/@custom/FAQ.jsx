// @custom — FAQ accordion section for the Landing page
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/app/lib/@system/utils'

const FAQ_ITEMS = [
  {
    question: 'What is included in the free plan?',
    answer:
      'The free plan gives you access to up to 3 projects, basic analytics, and community support. No credit card required — you can upgrade at any time.',
  },
  {
    question: 'Can I cancel my subscription at any time?',
    answer:
      'Yes. You can cancel your subscription from the Settings page at any point. You will keep access until the end of your current billing period and will not be charged again.',
  },
  {
    question: 'Is my data secure?',
    answer:
      'Absolutely. All data is encrypted in transit (TLS) and at rest. We use industry-standard security practices including bcrypt password hashing, JWT session management, and regular security audits.',
  },
  {
    question: 'Do you offer refunds?',
    answer:
      'We offer a 14-day money-back guarantee on all paid plans. If you are not satisfied for any reason, contact our support team within 14 days of your payment and we will issue a full refund.',
  },
  {
    question: 'Can I use this on multiple projects?',
    answer:
      'Yes. The Pro plan supports unlimited projects. The Starter (free) plan allows up to 3 active projects. Enterprise plans can be fully customised to your needs.',
  },
  {
    question: 'Is there an API I can integrate with?',
    answer:
      'Yes. All plans include API access. You can manage your API keys from the API Keys page inside your dashboard. Full API documentation is available in our docs.',
  },
]

function AccordionItem({ item, isOpen, onToggle }) {
  return (
    <div className="border-b last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-3 py-4 sm:py-5 text-left text-sm sm:text-base font-medium transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <span>{item.question}</span>
        <ChevronDown
          className={cn(
            'h-5 w-5 flex-shrink-0 text-muted-foreground transition-transform duration-200',
            isOpen && 'rotate-180',
          )}
        />
      </button>

      <div
        className={cn(
          'overflow-hidden transition-all duration-200',
          isOpen ? 'max-h-96 pb-5' : 'max-h-0',
        )}
      >
        <p className="text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
      </div>
    </div>
  )
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState(null)

  const toggle = (index) => {
    setOpenIndex((prev) => (prev === index ? null : index))
  }

  return (
    <section className="container mx-auto px-4 py-12 sm:py-20">
      <div className="text-center mb-10 sm:mb-14">
        <h2 className="text-2xl sm:text-3xl font-bold">Frequently asked questions</h2>
        <p className="mt-2 sm:mt-3 text-sm sm:text-base text-muted-foreground">
          Everything you need to know. Can't find the answer?{' '}
          <a
            href="mailto:support@example.com"
            className="underline underline-offset-4 hover:text-primary"
          >
            Ask us directly.
          </a>
        </p>
      </div>

      <div className="mx-auto max-w-2xl rounded-xl border bg-card px-4 sm:px-6">
        {FAQ_ITEMS.map((item, index) => (
          <AccordionItem
            key={item.question}
            item={item}
            isOpen={openIndex === index}
            onToggle={() => toggle(index)}
          />
        ))}
      </div>
    </section>
  )
}
