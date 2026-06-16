import { createRouter, createWebHistory } from 'vue-router'

import { tokenStorage } from '../api/http'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/login/index.vue'),
      meta: { title: '登录', public: true },
    },
    {
      path: '/',
      component: () => import('../layouts/MainLayout.vue'),
      children: [
        { path: '', redirect: '/dashboard' },
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('../views/dashboard/index.vue'),
          meta: { title: '工作台' },
        },
        {
          path: 'system/user',
          name: 'SystemUser',
          component: () => import('../views/system/user/index.vue'),
          meta: { title: '用户管理' },
        },
        {
          path: 'system/login-log',
          name: 'SystemLoginLog',
          component: () => import('../views/system/login-log/index.vue'),
          meta: { title: '登录日志' },
        },
        {
          path: 'system/app',
          name: 'SystemApp',
          component: () => import('../views/system/app/index.vue'),
          meta: { title: '应用管理' },
        },
        {
          path: 'system/oper-log',
          name: 'SystemOperLog',
          component: () => import('../views/system/oper-log/index.vue'),
          meta: { title: '操作日志' },
        },
        {
          path: 'system/config',
          name: 'SystemConfig',
          component: () => import('../views/system/config/index.vue'),
          meta: { title: '参数配置' },
        },
        {
          path: 'system/dict',
          name: 'SystemDict',
          component: () => import('../views/system/dict/index.vue'),
          meta: { title: '字典管理' },
        },
        {
          path: 'profile',
          name: 'Profile',
          component: () => import('../views/profile/index.vue'),
          meta: { title: '个人中心' },
        },
      ],
    },
  ],
})

router.beforeEach((to) => {
  const token = tokenStorage.getToken()
  const isPublic = Boolean(to.meta.public)

  if (isPublic) {
    if (token && to.path === '/login') {
      return { path: '/dashboard' }
    }
    return true
  }

  if (!token) {
    return {
      path: '/login',
      query: to.fullPath === '/' ? undefined : { redirect: to.fullPath },
    }
  }

  return true
})

export default router
