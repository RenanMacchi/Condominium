import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '../lib/supabaseClient'

const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/', component: () => import('../views/Home.vue') },
        { path: '/search', component: () => import('../views/Search.vue') },
        { path: '/login', component: () => import('../views/Login.vue') },
        { path: '/listing/:id', component: () => import('../views/ListingDetail.vue') },
        { path: '/new', component: () => import('../views/NewListing.vue'), meta: { requiresAuth: true } },
        { path: '/me', component: () => import('../views/MyListings.vue'), meta: { requiresAuth: true } },
        { path: '/favorites', component: () => import('../views/Favorites.vue'), meta: { requiresAuth: true } },
        { path: '/profile', component: () => import('../views/Profile.vue'), meta: { requiresAuth: true } }
    ]
})

// Route Guard
router.beforeEach(async (to, _from, next) => {
    const { data: { session } } = await supabase.auth.getSession()

    // MVP rule: "Apenas usuários logados podem ver/interagir com listagens" or public can see.
    // The plan was approved: reading listings restricted to logged-in users.
    const requiresAuth = to.meta.requiresAuth !== false && to.path !== '/login'

    if (requiresAuth && !session) {
        next('/login')
    } else if (to.path === '/login' && session) {
        next('/')
    } else {
        next()
    }
})

export default router
