import { clientsClaim } from 'workbox-core'
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching'
import { registerRoute, NavigationRoute } from 'workbox-routing'

declare let self: ServiceWorkerGlobalScope

self.skipWaiting()
clientsClaim()

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// SPA navigation fallback - serve the cached index.html for all navigations
const baseUrl = import.meta.env.BASE_URL ?? '/'
registerRoute(
    new NavigationRoute(
        createHandlerBoundToURL(`${baseUrl}index.html`),
        { denylist: [/^\/api\//] }
    )
)

// ── Timer Notification ──────────────────────────────────────────────────────
let timerTimeoutId: ReturnType<typeof setTimeout> | null = null

self.addEventListener('message', (event: ExtendableMessageEvent) => {
    const data = event.data as { type?: string; endTime?: number } | null
    if (!data) return

    if (data.type === 'TIMER_START' && typeof data.endTime === 'number') {
        if (timerTimeoutId !== null) {
            clearTimeout(timerTimeoutId)
            timerTimeoutId = null
        }
        const delay = Math.max(0, data.endTime - Date.now())
        timerTimeoutId = setTimeout(() => {
            timerTimeoutId = null
            self.registration.showNotification('Pause vorbei! 💪', {
                body: 'Dein Pausentimer ist abgelaufen.',
                icon: `${baseUrl}icons/icon-192.png`,
                badge: `${baseUrl}icons/icon-192.png`,
                tag: 'replog-timer',
                renotify: true,
            } as NotificationOptions)
        }, delay)
    }

    if (data.type === 'TIMER_CANCEL') {
        if (timerTimeoutId !== null) {
            clearTimeout(timerTimeoutId)
            timerTimeoutId = null
        }
    }
})

// Close notification when user taps it and focus/open the app
self.addEventListener('notificationclick', (event: NotificationEvent) => {
    event.notification.close()
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            const existingClient = clientList.find(c => c.visibilityState === 'visible') ?? clientList[0]
            if (existingClient) {
                return existingClient.focus()
            }
            return self.clients.openWindow(baseUrl)
        })
    )
})
