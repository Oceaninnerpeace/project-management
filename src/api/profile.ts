import { axiosInstance, http } from './http'
import { encryptNewPassword, encryptOldPassword } from '@/utils/password-crypto'

interface ApiResult<T> {
  code: number
  msg: string
  data: T
}

export interface Profile {
  id: number
  userName: string
  realName?: string
  mobile?: string
  email?: string
  avatar?: string
  status?: number
  lastLoginAt?: string
}

export interface UpdateProfilePayload {
  realName?: string
  mobile?: string
  email?: string
}

export interface UpdateProfilePasswordPayload {
  oldPassword: string
  newPassword: string
}

export async function fetchProfile() {
  const res = await http.get<ApiResult<Profile>>('/profile')
  return res.data
}

export async function updateProfile(payload: UpdateProfilePayload) {
  await http.put<ApiResult<void>>('/profile', payload)
}

/** 修改当前用户密码：oldPassword、newPassword 均为 RSA 密文 */
export async function updateProfilePassword(payload: UpdateProfilePasswordPayload) {
  const [oldPassword, newPassword] = await Promise.all([
    encryptOldPassword(payload.oldPassword),
    encryptNewPassword(payload.newPassword),
  ])
  await http.put<ApiResult<void>>('/profile/password', { oldPassword, newPassword })
}

export async function uploadProfileAvatar(file: File) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await axiosInstance.post<ApiResult<Record<string, string>>>(
    '/profile/avatar',
    formData,
  )
  const res = response.data
  if (res.code !== 0) {
    throw new Error(res.msg || '头像上传失败')
  }
  return res.data
}

function resolveAvatarUrl(data: Record<string, string>) {
  return data.url || data.avatar || data.fileUrl || Object.values(data)[0] || ''
}

export { resolveAvatarUrl }
