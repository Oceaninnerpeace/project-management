import { http } from './http'

export interface OperLog {
  id: number
  title?: string
  businessType?: number
  method?: string
  requestMethod?: string
  operName?: string
  operUrl?: string
  operIp?: string
  operParam?: string
  operResult?: string
  status?: number
  errorMsg?: string
  operTime?: string
  costTime?: number
  createdAt?: string
}

export interface OperLogQuery {
  title?: string
  businessType?: number
  operName?: string
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

export async function fetchOperLogPage(params: OperLogQuery) {
  return http.get<ApiResult<PageResult<OperLog>>>('/oper-logs', params)
}

export async function deleteOperLog(id: number) {
  await http.delete<ApiResult<void>>(`/oper-logs/${id}`)
}

export async function cleanOperLogs() {
  await http.delete<ApiResult<void>>('/oper-logs/clean')
}

export const businessTypeMap: Record<number, string> = {
  0: '其它',
  1: '新增',
  2: '修改',
  3: '删除',
  4: '授权',
  5: '导出',
  6: '导入',
  7: '强退',
  8: '生成',
  9: '清空',
}

export const businessTypeOptions = Object.entries(businessTypeMap).map(([value, label]) => ({
  label,
  value: Number(value),
}))

export function formatBusinessType(value?: number) {
  if (value == null) return '-'
  return businessTypeMap[value] ?? String(value)
}
