import { http } from './http'

export interface LoginLog {
  id: number
  userName: string
  ip: string
  location?: string
  browser?: string
  os?: string
  status: number
  msg?: string
  loginTime?: string
  createdAt?: string
}

export interface LoginLogQuery {
  userName?: string
  ip?: string
  status?: number
  pageNum?: number
  pageSize?: number
}

interface PageResult<T> {
  total: number
  list: T[]
}

interface ApiResult<T> {
  code: number
  msg: string
  data: T
}

export async function fetchLoginLogPage(params: LoginLogQuery) {
  const res = await http.get<ApiResult<PageResult<LoginLog>>>('/login-logs', params)
  return res
}

export async function deleteLoginLog(id: number) {
  await http.delete<ApiResult<void>>(`/login-logs/${id}`)
}

export async function cleanLoginLogs() {
  await http.delete<ApiResult<void>>('/login-logs/clean')
}
