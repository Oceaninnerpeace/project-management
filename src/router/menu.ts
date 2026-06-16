import {
  AppstoreOutlined,
  AuditOutlined,
  BookOutlined,
  ControlOutlined,
  DashboardOutlined,
  HistoryOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons-vue'

import type { LayoutMenuItem } from '@rjgfny/ui-pro'

export const layoutMenus: LayoutMenuItem[] = [
  {
    name: 'dashboard',
    path: '/dashboard',
    title: '工作台',
    icon: DashboardOutlined,
  },
  {
    name: 'system',
    title: '系统管理',
    icon: SettingOutlined,
    children: [
      {
        name: 'system-user',
        path: '/system/user',
        title: '用户管理',
        icon: UserOutlined,
      },
      {
        name: 'system-login-log',
        path: '/system/login-log',
        title: '登录日志',
        icon: HistoryOutlined,
      },
      {
        name: 'system-app',
        path: '/system/app',
        title: '应用管理',
        icon: AppstoreOutlined,
      },
      {
        name: 'system-oper-log',
        path: '/system/oper-log',
        title: '操作日志',
        icon: AuditOutlined,
      },
      {
        name: 'system-config',
        path: '/system/config',
        title: '参数配置',
        icon: ControlOutlined,
      },
      {
        name: 'system-dict',
        path: '/system/dict',
        title: '字典管理',
        icon: BookOutlined,
      },
    ],
  },
]

export function findMenuByPath(
  menus: LayoutMenuItem[],
  path: string,
): LayoutMenuItem | undefined {
  for (const item of menus) {
    if (item.path === path) return item
    if (item.children?.length) {
      const matched = findMenuByPath(item.children, path)
      if (matched) return matched
    }
  }
  return undefined
}
