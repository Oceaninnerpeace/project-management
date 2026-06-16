import { http } from './http'

export interface App {
  id: number
  appCode: string
  appName: string
  appUrl?: string
  status?: number
}

export interface AppSavePayload {
  appCode: string
  appName: string
  appUrl?: string
}

export interface AppQuery {
  keyword?: string
  status?: number
}

interface ApiResult<T> {
  code: number
  msg: string
  data: T
}

export async function fetchAppList(query: AppQuery = {}) {
  const res = await http.get<ApiResult<App[]>>('/apps')
  let list = res.data ?? []

  const keyword = query.keyword?.trim().toLowerCase()
  if (keyword) {
    list = list.filter(
      (item) =>
        item.appCode?.toLowerCase().includes(keyword) ||
        item.appName?.toLowerCase().includes(keyword) ||
        item.appUrl?.toLowerCase().includes(keyword),
    )
  }

  if (query.status !== undefined) {
    list = list.filter((item) => item.status === query.status)
  }

  return {
    ...res,
    data: list,
  }
}

export async function createApp(payload: AppSavePayload) {
  const res = await http.post<ApiResult<App>>('/apps', payload)
  return res.data
}

export async function updateApp(id: number, payload: AppSavePayload) {
  await http.put<ApiResult<void>>(`/apps/${id}`, payload)
}

export async function updateAppStatus(id: number, status: number) {
  await http.put<ApiResult<void>>(`/apps/${id}/status`, { status })
}
