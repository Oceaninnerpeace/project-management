import { http } from './http'

export interface Config {
  id?: number
  configName: string
  configKey: string
  configValue: string
  configType?: number
  remark?: string
  createdBy?: number
  createdAt?: string
  updatedBy?: number
  updatedAt?: string
}

export interface ConfigQuery {
  configName?: string
  configKey?: string
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

export async function fetchConfigPage(params: ConfigQuery) {
  return http.get<ApiResult<PageResult<Config>>>('/configs', params)
}

export async function fetchConfig(id: number) {
  const res = await http.get<ApiResult<Config>>(`/configs/${id}`)
  return res.data
}

export async function fetchConfigByKey(configKey: string) {
  const res = await http.get<ApiResult<string>>(`/configs/key/${configKey}`)
  return res.data
}

export async function createConfig(payload: Config) {
  await http.post<ApiResult<void>>('/configs', payload)
}

export async function updateConfig(id: number, payload: Config) {
  await http.put<ApiResult<void>>(`/configs/${id}`, { ...payload, id })
}

export async function deleteConfig(id: number) {
  await http.delete<ApiResult<void>>(`/configs/${id}`)
}

export const configTypeOptions = [
  { label: '内置', value: 0 },
  { label: '自定义', value: 1 },
]

export function formatConfigType(value?: number) {
  if (value == null) return '-'
  return configTypeOptions.find((item) => item.value === value)?.label ?? String(value)
}
