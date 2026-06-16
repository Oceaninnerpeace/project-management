<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import type { FormInstance, Rule, UploadProps } from 'ant-design-vue/es/form'
import { CameraOutlined, UserOutlined } from '@ant-design/icons-vue'
import { FeButton, FeInput, FePage } from '@rjgfny/ui-pro'

import {
  fetchProfile,
  resolveAvatarUrl,
  updateProfile,
  updateProfilePassword,
  uploadProfileAvatar,
  type Profile,
} from '@/api/profile'
import { useUserStore } from '@/stores/user'

const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_AVATAR_SIZE = 2 * 1024 * 1024

const userStore = useUserStore()
const pageLoading = ref(false)
const profileSaving = ref(false)
const passwordSaving = ref(false)
const avatarUploading = ref(false)

const profileFormRef = ref<FormInstance>()
const passwordFormRef = ref<FormInstance>()

const profileForm = reactive({
  userName: '',
  realName: '',
  mobile: '',
  email: '',
  avatar: '',
  status: undefined as number | undefined,
  lastLoginAt: '',
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const profileFormRules: Record<string, Rule[]> = {
  realName: [{ required: true, message: '请输入姓名', whitespace: true }],
}

const passwordFormRules: Record<string, Rule[]> = {
  oldPassword: [{ required: true, message: '请输入原密码' }],
  newPassword: [
    { required: true, message: '请输入新密码' },
    { min: 6, message: '密码至少 6 位' },
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码' },
    {
      validator: async (_rule, value) => {
        if (value !== passwordForm.newPassword) {
          return Promise.reject(new Error('两次输入的密码不一致'))
        }
        return Promise.resolve()
      },
    },
  ],
}

function formatTime(value?: string) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-CN', { hour12: false })
}

function applyProfile(profile: Profile) {
  profileForm.userName = profile.userName
  profileForm.realName = profile.realName ?? ''
  profileForm.mobile = profile.mobile ?? ''
  profileForm.email = profile.email ?? ''
  profileForm.avatar = profile.avatar ?? ''
  profileForm.status = profile.status
  profileForm.lastLoginAt = profile.lastLoginAt ?? ''

  userStore.setProfile({
    name: profile.realName || profile.userName,
    avatar: profile.avatar || '',
  })
}

async function loadProfile() {
  pageLoading.value = true
  try {
    const profile = await fetchProfile()
    applyProfile(profile)
  } catch (err) {
    message.error(err instanceof Error ? err.message : '获取个人信息失败')
  } finally {
    pageLoading.value = false
  }
}

async function handleProfileSubmit() {
  try {
    await profileFormRef.value?.validate()
  } catch {
    return
  }

  profileSaving.value = true
  try {
    await updateProfile({
      realName: profileForm.realName.trim(),
      mobile: profileForm.mobile.trim() || undefined,
      email: profileForm.email.trim() || undefined,
    })
    userStore.setProfile({ name: profileForm.realName.trim() || profileForm.userName })
    message.success('个人信息已保存')
  } catch (err) {
    message.error(err instanceof Error ? err.message : '保存失败')
  } finally {
    profileSaving.value = false
  }
}

async function handlePasswordSubmit() {
  try {
    await passwordFormRef.value?.validate()
  } catch {
    return
  }

  passwordSaving.value = true
  try {
    await updateProfilePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
    })
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    passwordFormRef.value?.resetFields()
    message.success('密码修改成功')
  } catch (err) {
    message.error(err instanceof Error ? err.message : '密码修改失败')
  } finally {
    passwordSaving.value = false
  }
}

const beforeAvatarUpload: UploadProps['beforeUpload'] = (file) => {
  if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
    message.error('仅支持 jpg、png、gif、webp 格式')
    return false
  }
  if (file.size > MAX_AVATAR_SIZE) {
    message.error('头像大小不能超过 2MB')
    return false
  }
  return true
}

const handleAvatarUpload: UploadProps['customRequest'] = async (options) => {
  const file = options.file as File
  avatarUploading.value = true
  try {
    const data = await uploadProfileAvatar(file)
    const url = resolveAvatarUrl(data)
    if (url) {
      profileForm.avatar = url
      userStore.setProfile({ avatar: url })
    }
    message.success('头像上传成功')
    options.onSuccess?.(data)
  } catch (err) {
    const error = err instanceof Error ? err : new Error('头像上传失败')
    message.error(error.message)
    options.onError?.(error)
  } finally {
    avatarUploading.value = false
  }
}

onMounted(() => {
  void loadProfile()
})
</script>

<template>
  <FePage title="个人中心" description="查看与修改个人信息、头像及登录密码。">
    <a-spin :spinning="pageLoading">
      <div class="profile-page">
        <a-card title="头像" class="profile-card profile-card--avatar">
          <div class="profile-avatar">
            <a-upload
              :show-upload-list="false"
              accept=".jpg,.jpeg,.png,.gif,.webp,image/jpeg,image/png,image/gif,image/webp"
              :before-upload="beforeAvatarUpload"
              :custom-request="handleAvatarUpload"
            >
              <div class="profile-avatar__wrapper">
                <a-avatar :size="96" :src="profileForm.avatar || undefined">
                  <template v-if="!profileForm.avatar" #icon>
                    <UserOutlined />
                  </template>
                </a-avatar>
                <div class="profile-avatar__mask">
                  <CameraOutlined />
                  <span>{{ avatarUploading ? '上传中...' : '更换头像' }}</span>
                </div>
              </div>
            </a-upload>
            <p class="profile-avatar__tip">支持 jpg、png、gif、webp，最大 2MB</p>
          </div>
        </a-card>

        <div class="profile-main">
          <a-card title="基本信息" class="profile-card">
          <a-form
            ref="profileFormRef"
            :model="profileForm"
            :rules="profileFormRules"
            layout="vertical"
            class="profile-form"
          >
            <a-row :gutter="16">
              <a-col :xs="24" :md="12">
                <a-form-item label="用户名">
                  <FeInput :value="profileForm.userName" disabled />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :md="12">
                <a-form-item label="姓名" name="realName">
                  <FeInput v-model:value="profileForm.realName" placeholder="请输入姓名" allow-clear />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :md="12">
                <a-form-item label="手机号" name="mobile">
                  <FeInput v-model:value="profileForm.mobile" placeholder="请输入手机号" allow-clear />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :md="12">
                <a-form-item label="邮箱" name="email">
                  <FeInput v-model:value="profileForm.email" placeholder="请输入邮箱" allow-clear />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :md="12">
                <a-form-item label="账号状态">
                  <a-tag :color="profileForm.status === 1 ? 'success' : 'default'">
                    {{ profileForm.status === 1 ? '启用' : profileForm.status === 0 ? '禁用' : '-' }}
                  </a-tag>
                </a-form-item>
              </a-col>
              <a-col :xs="24" :md="12">
                <a-form-item label="最后登录">
                  <span class="profile-readonly">{{ formatTime(profileForm.lastLoginAt) }}</span>
                </a-form-item>
              </a-col>
            </a-row>

            <FeButton type="primary" :loading="profileSaving" @click="handleProfileSubmit">
              保存信息
            </FeButton>
          </a-form>
        </a-card>

        <a-card title="修改密码" class="profile-card">
          <a-form
            ref="passwordFormRef"
            :model="passwordForm"
            :rules="passwordFormRules"
            layout="vertical"
            class="profile-form profile-form--password"
          >
            <a-row :gutter="16">
              <a-col :xs="24" :md="8">
                <a-form-item label="原密码" name="oldPassword">
                  <FeInput
                    v-model:value="passwordForm.oldPassword"
                    type="password"
                    placeholder="请输入原密码"
                    autocomplete="current-password"
                  />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :md="8">
                <a-form-item label="新密码" name="newPassword">
                  <FeInput
                    v-model:value="passwordForm.newPassword"
                    type="password"
                    placeholder="请输入新密码"
                    autocomplete="new-password"
                  />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :md="8">
                <a-form-item label="确认新密码" name="confirmPassword">
                  <FeInput
                    v-model:value="passwordForm.confirmPassword"
                    type="password"
                    placeholder="请再次输入新密码"
                    autocomplete="new-password"
                  />
                </a-form-item>
              </a-col>
            </a-row>

            <FeButton type="primary" :loading="passwordSaving" @click="handlePasswordSubmit">
              修改密码
            </FeButton>
          </a-form>
        </a-card>
        </div>
      </div>
    </a-spin>
  </FePage>
</template>

<style scoped>
.profile-page {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.profile-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.profile-card--avatar {
  flex-shrink: 0;
  width: 280px;
}

.profile-avatar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.profile-avatar__wrapper {
  position: relative;
  cursor: pointer;
}

.profile-avatar__mask {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.profile-avatar__wrapper:hover .profile-avatar__mask {
  opacity: 1;
}

.profile-avatar__tip {
  margin: 0;
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
  text-align: center;
}

.profile-form {
  max-width: 960px;
}

.profile-form--password {
  max-width: none;
}

.profile-readonly {
  color: rgba(0, 0, 0, 0.88);
  line-height: 32px;
}

@media (max-width: 992px) {
  .profile-page {
    flex-direction: column;
  }

  .profile-card--avatar {
    width: 100%;
  }
}
</style>
