import * as VueRouter from 'vue-router'

const appRoutes = [
  {
    path: '/app/mail',
    name: 'mail',
    component: () => import('@/views/MailApp.vue'),
    meta: { title: 'Mail' },
    props: true,
  },
]

const guestRoutes = [
  {
    path: '/guest/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { title: 'Login Form' }
  },
]

const routes = [
  {
    path: '/',
    name: 'index',
    component: () => import('@/components/null.vue'),
    meta: { title: 'Index' },
    redirect: '/app/mail',
    children: [
      {
        path: '/app',
        name: 'app',
        component: () => import('@/components/null.vue'),
        meta: { title: 'App' },
        redirect: '/app/mail',
        children: appRoutes
      },
      {
        path: '/guest',
        name: 'guest',
        component: () => import('@/components/null.vue'),
        meta: { title: 'Guest' },
        redirect: '/guest/login',
        children: guestRoutes
      }
    ]
  }
]

const router = VueRouter.createRouter({
  history: VueRouter.createWebHashHistory(),
  routes,
})
export default router
