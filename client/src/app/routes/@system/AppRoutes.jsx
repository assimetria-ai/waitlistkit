import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { useAuthContext } from '../../store/@system/auth'
import { Spinner } from '../../components/@system/Spinner'
import { ProtectedRoute } from '../../components/@system/ProtectedRoute'

// @custom — to add custom routes, create @custom/AppRoutes.jsx that wraps or extends this component

// Static / marketing pages (no auth required)
const LandingPage = lazy(() =>
  import('../../pages/static/@custom/LandingPage').then((m) => ({ default: m.LandingPage }))
)
const NotFoundPage = lazy(() =>
  import('../../pages/static/@system/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
)
const LoginPage = lazy(() =>
  import('../../pages/static/@system/LoginPage').then((m) => ({ default: m.LoginPage }))
)
const RegisterPage = lazy(() =>
  import('../../pages/static/@system/RegisterPage').then((m) => ({ default: m.RegisterPage }))
)
const ForgotPasswordPage = lazy(() =>
  import('../../pages/static/@system/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage }))
)
const ResetPasswordPage = lazy(() =>
  import('../../pages/static/@system/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage }))
)
const VerifyEmailPage = lazy(() =>
  import('../../pages/static/@system/VerifyEmailPage').then((m) => ({ default: m.VerifyEmailPage }))
)
const RefundPolicyPage = lazy(() =>
  import('../../pages/static/@system/RefundPolicyPage').then((m) => ({ default: m.RefundPolicyPage }))
)
const CookiePolicyPage = lazy(() =>
  import('../../pages/static/@system/CookiePolicyPage').then((m) => ({ default: m.CookiePolicyPage }))
)
const TermsPage = lazy(() =>
  import('../../pages/static/@system/TermsPage').then((m) => ({ default: m.TermsPage }))
)
const PrivacyPolicyPage = lazy(() =>
  import('../../pages/static/@system/PrivacyPolicyPage').then((m) => ({ default: m.PrivacyPolicyPage }))
)
const HelpCenterPage = lazy(() =>
  import('../../pages/static/@system/HelpCenterPage').then((m) => ({ default: m.HelpCenterPage }))
)
const ArticlePage = lazy(() =>
  import('../../pages/static/@system/ArticlePage').then((m) => ({ default: m.ArticlePage }))
)
const PricingPage = lazy(() =>
  import('../../pages/static/@system/PricingPage').then((m) => ({ default: m.PricingPage }))
)
const BlogPage = lazy(() =>
  import('../../pages/static/@system/BlogPage').then((m) => ({ default: m.BlogPage }))
)
const ContactPage = lazy(() =>
  import('../../pages/static/@system/ContactPage').then((m) => ({ default: m.ContactPage }))
)
const AboutPage = lazy(() =>
  import('../../pages/static/@system/AboutPage').then((m) => ({ default: m.AboutPage }))
)
const BlogPostPage = lazy(() =>
  import('../../pages/static/@system/BlogPostPage').then((m) => ({ default: m.BlogPostPage }))
)
const OnboardingPage = lazy(() =>
  import('../../pages/static/@system/OnboardingPage').then((m) => ({ default: m.OnboardingPage }))
)
const TwoFactorVerifyPage = lazy(() =>
  import('../../pages/static/@system/TwoFactorVerifyPage').then((m) => ({ default: m.TwoFactorVerifyPage }))
)

// App pages (auth required)
const HomePage = lazy(() =>
  import('../../pages/app/@system/HomePage').then((m) => ({ default: m.HomePage }))
)
const SettingsPage = lazy(() =>
  import('../../pages/app/@system/SettingsPage').then((m) => ({ default: m.SettingsPage }))
)
const AdminPage = lazy(() =>
  import('../../pages/app/@system/AdminPage').then((m) => ({ default: m.AdminPage }))
)
const ActivityPage = lazy(() =>
  import('../../pages/app/@system/ActivityPage').then((m) => ({ default: m.ActivityPage }))
)
const BillingPage = lazy(() =>
  import('../../pages/app/@system/BillingPage').then((m) => ({ default: m.BillingPage }))
)
const ApiKeysPage = lazy(() =>
  import('../../pages/app/@system/ApiKeysPage').then((m) => ({ default: m.ApiKeysPage }))
)
const IntegrationsPage = lazy(() =>
  import('../../pages/app/@system/IntegrationsPage').then((m) => ({ default: m.IntegrationsPage }))
)
const UXPatternsPage = lazy(() =>
  import('../../pages/app/@custom/UXPatternsPage').then((m) => ({ default: m.UXPatternsPage }))
)
const UXDemoPage = lazy(() =>
  import('../../pages/app/@system/UXDemoPage').then((m) => ({ default: m.UXDemoPage }))
)
const MobileResponsiveDemo = lazy(() =>
  import('../../pages/app/@system/MobileResponsiveDemo').then((m) => ({ default: m.MobileResponsiveDemo }))
)
const ContentCalendarPage = lazy(() =>
  import('../../pages/app/@custom/ContentCalendarPage').then((m) => ({ default: m.ContentCalendarPage }))
)
const HashtagResearchPage = lazy(() =>
  import('../../pages/app/@custom/HashtagResearchPage').then((m) => ({ default: m.HashtagResearchPage }))
)
const PostsList = lazy(() =>
  import('../../pages/app/@custom/PostsList').then((m) => ({ default: m.PostsList }))
)
const PostScheduler = lazy(() =>
  import('../../pages/app/@custom/PostScheduler').then((m) => ({ default: m.PostScheduler }))
)
const ContentTemplatesPage = lazy(() =>
  import('../../pages/app/@custom/ContentTemplatesPage')
)
const EngagementAnalyticsPage = lazy(() =>
  import('../../pages/app/@custom/EngagementAnalyticsPage')
)
const AnalyticsDashboardPage = lazy(() =>
  import('../../pages/app/@custom/AnalyticsDashboardPage').then((m) => ({ default: m.AnalyticsDashboardPage }))
)

// Teams pages
const TeamsPage = lazy(() =>
  import('../../pages/app/TeamsPage').then((m) => ({ default: m.TeamsPage }))
)
const TeamDetailPage = lazy(() =>
  import('../../pages/app/TeamDetailPage').then((m) => ({ default: m.TeamDetailPage }))
)

function PageFallback() {
  return (
    <div className="flex h-screen items-center justify-center">
      <Spinner />
    </div>
  )
}

/** Redirects authenticated users away from /auth back to /app */
function GuestRoute({ children }) {
  const { isAuthenticated, loading } = useAuthContext()
  if (loading) return <PageFallback />
  if (isAuthenticated) return <Navigate to="/app" replace />
  return <>{children}</>
}

export function AppRoutes() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        {/* Marketing / public */}
        <Route path="/" element={<LandingPage />} />

        {/* Login — redirect to /app when already logged in */}
        <Route
          path="/login"
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />

        {/* Password reset (public, no auth required) */}
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Email verification (public — token is in the URL) */}
        <Route path="/verify-email" element={<VerifyEmailPage />} />

        {/* Legal pages */}
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/refund-policy" element={<RefundPolicyPage />} />
        <Route path="/cookies" element={<CookiePolicyPage />} />
        <Route path="/cookie-policy" element={<Navigate to="/cookies" replace />} />

        {/* Pricing (public) */}
        <Route path="/pricing" element={<PricingPage />} />

        {/* Help center / knowledge base */}
        <Route path="/help" element={<HelpCenterPage />} />
        <Route path="/help/:slug" element={<ArticlePage />} />

        {/* Blog */}
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />

        {/* About */}
        <Route path="/about" element={<AboutPage />} />

        {/* Contact */}
        <Route path="/contact" element={<ContactPage />} />

        {/* Onboarding wizard — shown to new users after registration */}
        <Route path="/onboarding" element={<OnboardingPage />} />

        {/* 2FA challenge — shown after password login when TOTP is required */}
        <Route path="/2fa/verify" element={<TwoFactorVerifyPage />} />

        {/* Register — standalone registration page */}
        <Route path="/register" element={<RegisterPage />} />

        {/* Aliases — redirect legacy paths */}
        <Route path="/auth" element={<Navigate to="/login" replace />} />
        <Route path="/signup" element={<Navigate to="/register" replace />} />

        {/* Legacy /dashboard path → authenticated area */}
        <Route path="/dashboard" element={<Navigate to="/app" replace />} />
        <Route path="/dashboard/*" element={<Navigate to="/app" replace />} />

        {/* App (authenticated) */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/activity"
          element={
            <ProtectedRoute>
              <ActivityPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/billing"
          element={
            <ProtectedRoute>
              <BillingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/ux-patterns"
          element={
            <ProtectedRoute>
              <UXPatternsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/ux-demo"
          element={
            <ProtectedRoute>
              <UXDemoPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/api-keys"
          element={
            <ProtectedRoute>
              <ApiKeysPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/app/integrations"
          element={
            <ProtectedRoute role="admin">
              <IntegrationsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/app/mobile-demo"
          element={
            <ProtectedRoute>
              <MobileResponsiveDemo />
            </ProtectedRoute>
          }
        />

        {/* Content Calendar */}
        <Route
          path="/app/calendar"
          element={
            <ProtectedRoute>
              <ContentCalendarPage />
            </ProtectedRoute>
          }
        />

        {/* Posts */}
        <Route
          path="/app/posts"
          element={
            <ProtectedRoute>
              <PostsList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/posts/new"
          element={
            <ProtectedRoute>
              <PostScheduler />
            </ProtectedRoute>
          }
        />

        {/* Hashtag Research */}
        <Route
          path="/app/hashtags"
          element={
            <ProtectedRoute>
              <HashtagResearchPage />
            </ProtectedRoute>
          }
        />

        {/* Content Templates */}
        <Route
          path="/app/templates"
          element={
            <ProtectedRoute>
              <ContentTemplatesPage />
            </ProtectedRoute>
          }
        />

        {/* Engagement Analytics */}
        <Route
          path="/app/analytics"
          element={
            <ProtectedRoute>
              <AnalyticsDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/analytics/engagement"
          element={
            <ProtectedRoute>
              <EngagementAnalyticsPage />
            </ProtectedRoute>
          }
        />

        {/* Teams */}
        <Route
          path="/app/teams"
          element={
            <ProtectedRoute>
              <TeamsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/teams/:id"
          element={
            <ProtectedRoute>
              <TeamDetailPage />
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}
