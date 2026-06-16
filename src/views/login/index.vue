<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import type { FormInstance, Rule } from 'ant-design-vue/es/form'
import { LockOutlined, SafetyOutlined, UserOutlined } from '@ant-design/icons-vue'
import { FeButton } from '@rjgfny/ui-pro'

import { fetchCaptcha, fetchUserInfo, login } from '@/api/auth'
import { tokenStorage } from '@/api/http'
import { layoutConfig } from '@/config/layout'
import { useUserStore } from '@/stores/user'

const REMEMBER_KEY = 'login_remember'
const USERNAME_KEY = 'login_userName'
const PASSWORD_KEY = 'login_userPass'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const formRef = ref<FormInstance>()
const formState = reactive({
  userName: '',
  userPass: '',
  code: '',
})
const formRules: Record<string, Rule[]> = {
  userName: [{ required: true, message: '请输入用户名', whitespace: true }],
  userPass: [{ required: true, message: '请输入密码' }],
  code: [{ required: true, message: '请输入验证码', whitespace: true }],
}
const remember = ref(false)
const captchaUuid = ref('')
const captchaImg = ref('')
const captchaLoading = ref(false)
const submitting = ref(false)

function loadRemembered() {
  const saved = localStorage.getItem(REMEMBER_KEY) === '1'
  remember.value = saved
  if (!saved) return
  formState.userName = localStorage.getItem(USERNAME_KEY) ?? ''
  formState.userPass = localStorage.getItem(PASSWORD_KEY) ?? ''
}

function persistRemember() {
  if (remember.value) {
    localStorage.setItem(REMEMBER_KEY, '1')
    localStorage.setItem(USERNAME_KEY, formState.userName.trim())
    localStorage.setItem(PASSWORD_KEY, formState.userPass)
    return
  }
  localStorage.removeItem(REMEMBER_KEY)
  localStorage.removeItem(USERNAME_KEY)
  localStorage.removeItem(PASSWORD_KEY)
}

async function loadCaptcha() {
  captchaLoading.value = true
  try {
    const data = await fetchCaptcha()
    captchaUuid.value = data.uuid
    captchaImg.value = data.img
    formState.code = ''
    formRef.value?.clearValidate('code')
  } catch (err) {
    message.error(err instanceof Error ? err.message : '获取验证码失败')
  } finally {
    captchaLoading.value = false
  }
}

async function handleSubmit() {
  let values: typeof formState
  try {
    values = await formRef.value!.validate()
  } catch {
    return
  }

  const userName = values.userName.trim()
  const userPass = values.userPass
  const code = values.code.trim()

  if (!captchaUuid.value) {
    formRef.value?.setFields([{ name: 'code', errors: ['请先获取验证码'] }])
    await loadCaptcha()
    return
  }

  submitting.value = true
  try {
    const result = await login({
      userName,
      userPass,
      code,
      uuid: captchaUuid.value,
    })

    const accessToken = result.accessToken
    if (!accessToken || typeof accessToken !== 'string') {
      throw new Error('登录响应缺少 accessToken')
    }

    tokenStorage.setToken(accessToken)
    persistRemember()

    try {
      const userInfo = await fetchUserInfo()
      userStore.setProfile({
        name: userInfo.realName || userInfo.username || userName,
        avatar: userInfo.avatar || '',
      })
    } catch {
      userStore.setProfile({ name: userName })
    }

    message.success('登录成功')
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard'
    await router.replace(redirect)
  } catch (err) {
    message.error(err instanceof Error ? err.message : '登录失败')
    await loadCaptcha()
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadRemembered()
  void loadCaptcha()
})
</script>

<template>
  <div class="login-page">
    <div class="login-page__bg" aria-hidden="true" />

    <div class="login-page__content">
      <div class="login-page__panel">
        <div class="login-page__brand">
          <img
            v-if="layoutConfig.brand.logo"
            :src="layoutConfig.brand.logo"
            alt="logo"
            class="login-page__logo"
          />
          <h1 class="login-page__title">{{ layoutConfig.brand.title }}</h1>
        </div>

        <a-form
          ref="formRef"
          class="login-form"
          layout="vertical"
          :model="formState"
          :rules="formRules"
          @finish="handleSubmit"
        >
        <a-form-item name="userName">
          <a-input
            v-model:value="formState.userName"
            size="large"
            placeholder="请输入用户名"
            autocomplete="username"
            allow-clear
            class="login-form__input"
            @press-enter="handleSubmit"
          >
            <template #prefix>
              <UserOutlined class="login-form__icon" />
            </template>
          </a-input>
        </a-form-item>

        <a-form-item name="userPass">
          <a-input-password
            v-model:value="formState.userPass"
            size="large"
            placeholder="请输入密码"
            autocomplete="current-password"
            class="login-form__input"
            @press-enter="handleSubmit"
          >
            <template #prefix>
              <LockOutlined class="login-form__icon" />
            </template>
          </a-input-password>
        </a-form-item>

        <a-form-item name="code">
          <div class="login-form__captcha">
            <a-input
              v-model:value="formState.code"
              size="large"
              placeholder="请输入验证码"
              :maxlength="6"
              allow-clear
              class="login-form__input login-form__input--captcha"
              @press-enter="handleSubmit"
            >
              <template #prefix>
                <SafetyOutlined class="login-form__icon" />
              </template>
            </a-input>
            <button
              type="button"
              class="login-form__captcha-img"
              :title="captchaLoading ? '加载中' : '点击刷新验证码'"
              :disabled="captchaLoading"
              @click="loadCaptcha"
            >
              <img v-if="captchaImg" :src="captchaImg" alt="验证码" />
              <span v-else>验证码</span>
            </button>
          </div>
        </a-form-item>

        <a-form-item class="login-form__remember-item">
          <a-checkbox v-model:checked="remember" class="login-form__remember">
            记住密码
          </a-checkbox>
        </a-form-item>

        <a-form-item class="login-form__submit-item">
          <FeButton
            type="primary"
            block
            size="large"
            class="login-form__submit"
            :loading="submitting"
            @click="handleSubmit"
          >
            登录
          </FeButton>
        </a-form-item>
        </a-form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  overflow: hidden;
  background: #f0f5ff;
}

.login-page__bg {
  position: absolute;
  inset: 0;
  background: url('/login-bg.svg') center / cover no-repeat;
  pointer-events: none;
}

.login-page__content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 520px;
  padding: 24px;
}

.login-page__panel {
  padding: 40px 36px 32px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.9);
  box-shadow:
    0 16px 40px rgba(15, 23, 42, 0.08),
    0 2px 8px rgba(15, 23, 42, 0.04);
  backdrop-filter: blur(8px);
}

.login-page__brand {
  margin-bottom: 28px;
  text-align: center;
}

.login-page__logo {
  width: 48px;
  height: 48px;
  margin-bottom: 12px;
}

.login-page__title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.88);
}

.login-form :deep(.ant-form-item) {
  margin-bottom: 18px;
}

/* 预留错误提示高度，避免校验文案出现时挤压布局抖动 */
.login-form :deep(.ant-form-item:not(.login-form__remember-item):not(.login-form__submit-item) .ant-form-item-additional) {
  min-height: 22px;
}

.login-form :deep(.ant-form-item-explain),
.login-form :deep(.ant-form-item-extra) {
  min-height: 22px;
  line-height: 22px;
}

.login-form :deep(.ant-form-item-explain-error) {
  margin-top: 0;
  font-size: 13px;
  line-height: 22px;
}

.login-form :deep(.ant-show-help-enter-active),
.login-form :deep(.ant-show-help-leave-active),
.login-form :deep(.ant-show-help-enter-from),
.login-form :deep(.ant-show-help-leave-to) {
  transition: none !important;
  animation: none !important;
}

.login-form :deep(.ant-form-item-label) {
  display: none;
}

.login-form__remember-item {
  margin-bottom: 22px !important;
}

.login-form__submit-item {
  margin-bottom: 0 !important;
}

.login-form__input :deep(.ant-input-affix-wrapper),
.login-form__input.ant-input-affix-wrapper {
  height: 48px;
  color: rgba(0, 0, 0, 0.88);
  background: #fff !important;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  box-shadow: none;
}

.login-form__input :deep(.ant-input-affix-wrapper:hover) {
  border-color: #4096ff;
}

.login-form__input :deep(.ant-input-affix-wrapper-focused),
.login-form__input :deep(.ant-input-affix-wrapper:focus-within) {
  border-color: #1677ff;
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.1);
}

.login-form :deep(.ant-form-item-has-error .login-form__input.ant-input-affix-wrapper),
.login-form :deep(.ant-form-item-has-error .login-form__input .ant-input-affix-wrapper) {
  box-shadow: none;
}

.login-form__input :deep(.ant-input) {
  height: 100%;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

.login-form__input :deep(.ant-input:-webkit-autofill),
.login-form__input :deep(.ant-input:-webkit-autofill:hover),
.login-form__input :deep(.ant-input:-webkit-autofill:focus),
.login-form__input :deep(.ant-input:-webkit-autofill:active) {
  -webkit-box-shadow: 0 0 0 1000px #fff inset !important;
  box-shadow: 0 0 0 1000px #fff inset !important;
  -webkit-text-fill-color: rgba(0, 0, 0, 0.88) !important;
  caret-color: rgba(0, 0, 0, 0.88);
  transition: background-color 99999s ease-out;
}

.login-form__input :deep(.ant-input::placeholder) {
  color: rgba(0, 0, 0, 0.25);
}

.login-form__input :deep(.ant-input-password-icon) {
  color: rgba(0, 0, 0, 0.45);
}

.login-form__input :deep(.ant-input-password-icon:hover) {
  color: rgba(0, 0, 0, 0.65);
}

.login-form__input :deep(.ant-input-clear-icon) {
  color: rgba(0, 0, 0, 0.25);
}

.login-form__icon {
  color: rgba(0, 0, 0, 0.45);
  font-size: 16px;
}

.login-form__captcha {
  display: flex;
  gap: 12px;
  align-items: center;
}

.login-form__input--captcha {
  flex: 1;
}

.login-form__captcha-img {
  flex-shrink: 0;
  width: 132px;
  height: 48px;
  padding: 0;
  overflow: hidden;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  background: #fafafa;
  cursor: pointer;
  transition: border-color 0.2s;
}

.login-form__captcha-img:hover:not(:disabled) {
  border-color: #1677ff;
}

.login-form__captcha-img:disabled {
  cursor: not-allowed;
  opacity: 0.75;
}

.login-form__captcha-img img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.login-form__captcha-img span {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
}

.login-form__remember :deep(.ant-checkbox + span) {
  color: rgba(0, 0, 0, 0.65);
}

.login-form__submit :deep(.ant-btn) {
  height: 48px;
  font-size: 16px;
  font-weight: 500;
  border: 0;
  border-radius: 8px;
  background: linear-gradient(180deg, #4096ff 0%, #1677ff 100%);
  box-shadow: 0 6px 16px rgba(22, 119, 255, 0.24);
}

.login-form__submit :deep(.ant-btn:hover:not(:disabled)) {
  background: linear-gradient(180deg, #69b1ff 0%, #4096ff 100%);
}
</style>
