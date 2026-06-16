import type { FeTableApi } from '@rjgfny/ui-pro'

import { showHttpError } from '@/utils/http-error'

/** FeTable 内部会吞掉异常，需在 api 层主动提示 */
export function withTableErrorNotice(api: FeTableApi): FeTableApi {
  return async (params) => {
    try {
      return await api(params)
    } catch (error) {
      showHttpError(error)
      throw error
    }
  }
}
