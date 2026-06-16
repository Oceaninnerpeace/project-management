import { http } from './http'
import { encryptUserPass } from '@/utils/password-crypto'

export interface CaptchaResult {
  uuid: string
  img: string
}

export interface LoginParams {
  userName: string
  userPass: string
  code: string
  uuid: string
}

export interface LoginResult {
  accessToken?: string
  [key: string]: unknown
}

export interface UserInfo {
  userId?: number
  username?: string
  realName?: string
  orgId?: number
  appCode?: string
  avatar?: string
  [key: string]: unknown
}

interface ApiResult<T> {
  code: number
  msg: string
  data: T
}

export async function fetchCaptcha() {
  const res = await http.get<ApiResult<CaptchaResult>>('/captchaImage')
  return res.data
}

export async function login(params: LoginParams) {
  const userPass = await encryptUserPass(params.userPass)
  const res = await http.post<ApiResult<LoginResult>>('/auth/login', {
    ...params,
    userPass,
  })
  return res.data
}

export async function fetchUserInfo() {
  const res = await http.get<ApiResult<UserInfo>>('/auth/userinfo')
  return res.data
}

export async function logout() {
  await http.post<ApiResult<void>>('/auth/logout')
}
