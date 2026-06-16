<script setup lang="ts">
import { LogoutOutlined, UserOutlined } from '@ant-design/icons-vue'
import { useRouter } from 'vue-router'

import { logout } from '../api/auth'
import { tokenStorage } from '../api/http'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

async function onUserMenuClick(info: { key: string | number }) {
  const key = String(info.key)
  if (key === 'profile') {
    await router.push('/profile')
    return
  }
  if (key === 'logout') {
    try {
      await logout()
    } catch {
      // 客户端清除 Token 即可
    }
    tokenStorage.clearToken()
    userStore.clearProfile()
    await router.push('/login')
  }
}
</script>

<template>
  <a-dropdown placement="bottomRight" :trigger="['click']">
    <button type="button" class="layout-user-menu__trigger">
      <a-avatar :size="32" :src="userStore.avatar || undefined">
        <template v-if="!userStore.avatar" #icon>
          <UserOutlined />
        </template>
      </a-avatar>
      <span class="layout-user-menu__name">{{ userStore.name }}</span>
    </button>
    <template #overlay>
      <a-menu @click="onUserMenuClick">
        <a-menu-item key="profile">
          <UserOutlined />
          <span>个人中心</span>
        </a-menu-item>
        <a-menu-item key="logout">
          <LogoutOutlined />
          <span>退出登录</span>
        </a-menu-item>
      </a-menu>
    </template>
  </a-dropdown>
</template>

<style scoped>
.layout-user-menu__trigger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.layout-user-menu__name {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: rgba(0, 0, 0, 0.88);
}
</style>
