import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/exercise(.*)',
  '/completed',
  '/evals',
  '/api/check-answer',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
])

const isAPIGenerationRoute = createRouteMatcher(['/api/generate-exercise-set'])

export default clerkMiddleware(async (auth, req) => {
  // For API exercise generation routes, require authentication unless they provide their own API key
  if (isAPIGenerationRoute(req)) {
    // We'll check for API key in the route handler itself since we can't read body in middleware
    // For now, we'll require authentication for all generation requests
    // Users can provide their API key in the request body to bypass server-side API key usage
    const { userId } = await auth()
    if (!userId) {
      await auth.protect()
    }
    return
  }

  // For other routes, allow public access unless specifically protected
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
