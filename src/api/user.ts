import { encryptNewPassword, encryptUserPass } from '@/utils/password-crypto'

import { axiosInstance, http } from './http'

export interface User {
  id: number
  userName: string
  realName?: string
  mobile?: string
  email?: string
  avatar?: string
  status?: number
  lastLoginAt?: string
}

export interface UserQuery {
  orgId?: number
  status?: number
  keyword?: string
  page?: number
  size?: number
}

export interface UserSavePayload {
  userName?: string
  userPass?: string
  realName?: string
  mobile?: string
  email?: string
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

export async function fetchUserPage(params: UserQuery) {
  return http.get<ApiResult<PageResult<User>>>('/users', params)
}

export async function fetchUser(id: number) {
  const res = await http.get<ApiResult<User>>(`/users/${id}`)
  return res.data
}

export async function createUser(payload: UserSavePayload) {
  const data = { ...payload }
  if (data.userPass) {
    data.userPass = await encryptUserPass(data.userPass)
  }
  const res = await http.post<ApiResult<User>>('/users', data)
  return res.data
}

export async function updateUser(id: number, payload: UserSavePayload) {
  await http.put<ApiResult<void>>(`/users/${id}`, payload)
}

export async function deleteUser(id: number) {
  await http.delete<ApiResult<void>>(`/users/${id}`)
}

export async function updateUserStatus(id: number, status: number) {
  await http.put<ApiResult<void>>(`/users/${id}/status`, { status })
}

/** 管理员重置用户密码：字段 newPassword 为 RSA 密文 */
export async function resetUserPassword(id: number, newPassword: string) {
  await http.put<ApiResult<void>>(`/users/${id}/password/reset`, {
    newPassword: await encryptNewPassword(newPassword),
  })
}

export async function assignUserRoles(id: number, roleIds: number[]) {
  await http.put<ApiResult<void>>(`/users/${id}/roles`, { roleIds })
}

export async function exportUsers(params: Omit<UserQuery, 'page' | 'size'>) {
  const response = await axiosInstance.get('/users/export', {
    params,
    responseType: 'blob',
  })

  const blob = new Blob([response.data])
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `users_${Date.now()}.xlsx`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}
