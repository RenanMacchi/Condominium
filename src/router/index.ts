import { createRouter, createWebHistory } from 'vue-router'
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
    // Use getSession() instead of getUser() to avoid network hanging on tab restore. 
    // Supabase automatically refreshes tokens in the background via visibilitychange listeners.
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user

    // Intercept Supabase Recovery Link (arrives as hash on root usually)
    if (to.hash.includes('type=recovery') && to.path !== '/reset-password') {
        return next({ path: '/reset-password', hash: to.hash })
    }

    // MVP rule: "Apenas usuários logados podem ver/interagir com listagens" or public can see.
    // The plan was approved: reading listings restricted to logged-in users.
    const requiresAuth = to.meta.requiresAuth !== false && to.path !== '/login' && to.path !== '/reset-password'

    if (requiresAuth && !user) {
        next('/login')
    } else if (to.path === '/login' && user) {
        next('/')
    } else {
        next()
    }
})

export default router
