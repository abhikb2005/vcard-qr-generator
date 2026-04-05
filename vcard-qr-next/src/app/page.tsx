import { redirect } from 'next/navigation'

export default function LandingPage() {
  // The marketing landing page is now handled by the static HTML site.
  // The Next.js app (app. domain) acts purely as the SaaS Application.
  redirect('/login')
}
