import { encryptPassword } from '@rjgfny/utils'

/** RSA 加密明文密码，供各接口提交密文字段使用 */
export async function encryptPlainPassword(plain: string): Promise<string> {
  return encryptPassword(plain)
}

/** 登录 / 创建用户：字段 userPass */
export async function encryptUserPass(plain: string): Promise<string> {
  return encryptPlainPassword(plain)
}

/** 重置密码 / 修改当前用户密码：字段 newPassword */
export async function encryptNewPassword(plain: string): Promise<string> {
  return encryptPlainPassword(plain)
}

/** 修改当前用户密码：字段 oldPassword */
export async function encryptOldPassword(plain: string): Promise<string> {
  return encryptPlainPassword(plain)
}
