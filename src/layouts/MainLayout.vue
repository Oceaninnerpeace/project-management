<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFeLayout } from '@rjgfny/ui-pro'

import LayoutUserMenu from '../components/LayoutUserMenu.vue'
import { layoutConfig } from '../config/layout'
import { findMenuByPath, layoutMenus } from '../router/menu'
import DashboardView from '../views/dashboard/index.vue'
import ProfileView from '../views/profile/index.vue'
import SystemAppView from '../views/system/app/index.vue'
import SystemConfigView from '../views/system/config/index.vue'
import SystemDictView from '../views/system/dict/index.vue'
import SystemLoginLogView from '../views/system/login-log/index.vue'
import SystemOperLogView from '../views/system/oper-log/index.vue'
import SystemUserView from '../views/system/user/index.vue'

const route = useRoute()
const router = useRouter()

const viewMap = {
  '/dashboard': DashboardView,
  '/system/user': SystemUserView,
  '/system/login-log': SystemLoginLogView,
  '/system/app': SystemAppView,
  '/system/oper-log': SystemOperLogView,
  '/system/config': SystemConfigView,
  '/system/dict': SystemDictView,
  '/profile': ProfileView,
} as const

const [AppLayout, layoutApi] = useFeLayout({
  logoTitle: layoutConfig.brand.title,
  logo: layoutConfig.brand.logo,
  menus: layoutMenus,
})

const activeView = computed(() => viewMap[route.path as keyof typeof viewMap])

const syncLayoutFromRoute = () => {
  const menuPath = route.path
  const menuItem = findMenuByPath(layoutMenus, menuPath)

  layoutApi.setActivePath(menuPath)
  layoutApi.openTab({
    key: menuPath,
    title:
      menuItem?.title ??
      (typeof route.meta.title === 'string' ? route.meta.title : '页面'),
    path: menuPath,
    affix: menuPath === '/dashboard',
  })
  layoutApi.setActiveTab(menuPath)
}

onMounted(() => {
  layoutApi.openTab({
    key: '/dashboard',
    title: '工作台',
    path: '/dashboard',
    affix: true,
  })
  syncLayoutFromRoute()
})

watch(
  () => route.fullPath,
  (fullPath, previousPath) => {
    if (fullPath === previousPath) return
    syncLayoutFromRoute()
  },
)

const handleMenuSelect = async (path: string) => {
  if (route.path !== path) {
    await router.push(path)
    return
  }
  syncLayoutFromRoute()
}

const handleRefresh = () => {
  window.location.reload()
}
</script>

<template>
  <AppLayout @menu-select="handleMenuSelect" @refresh="handleRefresh">
    <template v-if="layoutConfig.header.showUser" #header-right>
      <LayoutUserMenu />
    </template>
    <component :is="activeView" v-if="activeView" />
  </AppLayout>
</template>
