import axios from 'axios'
import {
  createAxiosAdapter,
  createHttpClient,
  createTokenStorage,
} from '@rjgfny/utils'

import { extractAxiosErrorMessage } from '@/utils/http-error'

const tokenStorage = createTokenStorage('access_token')

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
  timeout: 15000,
})

const adapter = createAxiosAdapter({
  axiosInstance,
  requestHooks: [
    async (config) => {
      const token = tokenStorage.getToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
  ],
  errorHooks: [
    async (error) => {
      extractAxiosErrorMessage(error)
    },
  ],
  business: {
    successCode: 0,
    getCode: (res) => (res as { code?: number }).code,
    getMessage: (res) => (res as { msg?: string }).msg,
  },
})

export const http = createHttpClient({}, adapter)
export { tokenStorage, axiosInstance }
