import * as VueRouter from 'vue-router'

const appRoutes = [
  {
    path: '/app/mail',
    name: 'mail',
    component: () => import('@/views/ThreadView.vue'),
    meta: { title: 'Mail' },
  },
  {
    path: '/app/mailbox',
    name: 'mailbox',
    component: () => import('@/views/MailboxView.vue'),
    meta: { title: 'Mailbox' },
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
        component: () => import('@/components/WebApp.vue'),
        meta: { title: 'App' },
        props: { arg: 'webapp' }, // v-layout needs `arg` prop
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
