import { defineStore } from 'pinia'
import { layoutConfig } from '../config/layout'

export const useUserStore = defineStore('user', {
  state: () => ({
    name: layoutConfig.user.name,
    avatar: layoutConfig.user.avatar,
  }),
  actions: {
    /** 登录成功后写入真实用户信息 */
    setProfile(profile: { name?: string; avatar?: string }) {
      if (profile.name != null) this.name = profile.name
      if (profile.avatar != null) this.avatar = profile.avatar
    },
    clearProfile() {
      this.name = layoutConfig.user.name
      this.avatar = layoutConfig.user.avatar
    },
  },
})
