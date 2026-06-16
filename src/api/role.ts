import { http } from './http'

export interface Role {
  id: number
  appCode?: string
  roleName: string
  roleCode: string
  dataScope?: number
  status?: number
}

interface ApiResult<T> {
  code: number
  msg: string
  data: T
}

export async function fetchRoleList(appCodeFilter?: string) {
  const res = await http.get<ApiResult<Role[]>>('/roles', { appCodeFilter })
  return res.data ?? []
}
