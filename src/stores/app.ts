import { defineStore } from 'pinia'
import { layoutConfig } from '../config/layout'

export const useAppStore = defineStore('app', {
  state: () => ({
    title: layoutConfig.brand.title,
    logo: layoutConfig.brand.logo,
  }),
})
