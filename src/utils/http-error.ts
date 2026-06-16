import type { AxiosError } from 'axios'
import { message } from 'ant-design-vue'

interface ErrorPayload {
  msg?: string
  message?: string
}

export function getHttpErrorMessage(error: unknown, fallback = '请求失败'): string {
  if (error && typeof error === 'object') {
    const err = error as Error & { raw?: unknown; status?: number }
    const raw = err.raw
    if (raw && typeof raw === 'object') {
      const payload = raw as ErrorPayload
      if (payload.msg) return payload.msg
      if (payload.message) return payload.message
    }
    if (err.message && !/^Request failed with status code \d+$/.test(err.message)) {
      return err.message
    }
    if (err.status) return `请求失败（HTTP ${err.status}）`
  }
  return fallback
}

export function extractAxiosErrorMessage(error: AxiosError): void {
  const data = error.response?.data
  if (data && typeof data === 'object') {
    const payload = data as ErrorPayload
    if (payload.msg) {
      error.message = payload.msg
      return
    }
    if (payload.message) {
      error.message = payload.message
    }
  }
}

export function showHttpError(error: unknown, fallback?: string) {
  message.error(getHttpErrorMessage(error, fallback))
}
