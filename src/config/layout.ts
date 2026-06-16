/**
 * 布局级配置：每个业务子项目改这里或对应 .env 即可定制品牌与顶栏。
 * 登录后可在 store 里覆盖 user 字段（见 stores/user.ts）。
 */
export const layoutConfig = {
  brand: {
    title: import.meta.env.VITE_APP_TITLE || 'project-management',
    logo: import.meta.env.VITE_APP_LOGO || '/logo.svg',
  },
  header: {
    /** 是否显示右上角用户区 */
    showUser: import.meta.env.VITE_APP_SHOW_USER !== 'false',
  },
  user: {
    name: import.meta.env.VITE_APP_USER_NAME || '管理员',
    avatar: import.meta.env.VITE_APP_USER_AVATAR || '',
  },
}
