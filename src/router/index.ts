import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../lib/supabaseClient'

const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/', component: () => import('../views/Home.vue') },
        { path: '/search', component: () => import('../views/Search.vue') },
        { path: '/login', component: () => import('../views/Login.vue') },
        { path: '/reset-password', component: () => import('../views/ResetPassword.vue'), meta: { requiresAuth: false } },
        { path: '/listing/:id', component: () => import('../views/ListingDetail.vue') },
        { path: '/edit/:id', component: () => import('../views/EditListing.vue'), meta: { requiresAuth: true } },
        { path: '/new', component: () => import('../views/NewListing.vue'), meta: { requiresAuth: true } },
        { path: '/me', component: () => import('../views/MyListings.vue'), meta: { requiresAuth: true } },
        { path: '/favorites', component: () => import('../views/Favorites.vue'), meta: { requiresAuth: true } },
        { path: '/profile', component: () => import('../views/Profile.vue'), meta: { requiresAuth: true } },
        { path: '/admin', component: () => import('../views/Admin.vue'), meta: { requiresAuth: true } }
    ]
})

// Route Guard
router.beforeEach(async (to, _from, next) => {
    const authStore = useAuthStore()

    // Ensure the app's auth state is loaded ONCE on hard refresh before evaluating any route.
    if (!authStore.initialized) {
        try {
            await Promise.race([
                authStore.initialize(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Init Timeout')), 5000))
            ])
        } catch (e) {
            console.warn('Auth initialization timed out, forcing reload to clear locks');
            window.location.reload();
            return;
        }
    }

    // Always use the store's user. If the store lost track (e.g. background tab), fallback to checking the local session synchronously.
    let user = authStore.user
    if (!user) {
        try {
            const { data: { session } } = await Promise.race([
                supabase.auth.getSession(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Session Timeout')), 3000))
            ]) as any
            user = session?.user || null
        } catch (e) {
            console.warn('Auth session check timed out, forcing reload to clear locks');
            window.location.reload();
            return;
        }
    }

    // Intercept Supabase Recovery Link (arrives as hash on root usually)
    if (to.hash.includes('type=recovery') && to.path !== '/reset-password') {
        return next({ path: '/reset-password', hash: to.hash })
    }

    // MVP rule: "Apenas usuários logados podem ver/interagir com listagens"
    const requiresAuth = to.meta.requiresAuth !== false && to.path !== '/login' && to.path !== '/reset-password'

    if (requiresAuth && !user) {
        return next('/login')
    } else if (to.path === '/login' && user) {
        return next('/')
    }

    return next()
})

export default router
