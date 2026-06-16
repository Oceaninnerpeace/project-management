import { http } from './http'

export interface DictType {
  id: number
  typeCode: string
  typeName: string
  remark?: string
  status?: number
  sortNum?: number
}

export interface DictTypeSavePayload {
  typeCode: string
  typeName: string
  remark?: string
  status?: number
  sortNum?: number
}

export interface DictData {
  id: number
  typeId: number
  label: string
  value: string
  remark?: string
  status?: number
  sortNum?: number
}

export interface DictDataSavePayload {
  typeId: number
  label: string
  value: string
  remark?: string
  status?: number
  sortNum?: number
}

interface ApiResult<T> {
  code: number
  msg: string
  data: T
}

export async function fetchDictTypeList() {
  const res = await http.get<ApiResult<DictType[]>>('/dict-types')
  return res.data ?? []
}

export async function createDictType(payload: DictTypeSavePayload) {
  const res = await http.post<ApiResult<DictType>>('/dict-types', payload)
  return res.data
}

export async function updateDictType(id: number, payload: DictTypeSavePayload) {
  await http.put<ApiResult<void>>(`/dict-types/${id}`, payload)
}

export async function deleteDictType(id: number) {
  await http.delete<ApiResult<void>>(`/dict-types/${id}`)
}

export async function fetchDictDataList(typeId: number) {
  const res = await http.get<ApiResult<DictData[]>>('/dict-types/datas', { typeId })
  return res.data ?? []
}

export async function createDictData(payload: DictDataSavePayload) {
  const res = await http.post<ApiResult<DictData>>('/dict-types/datas', payload)
  return res.data
}

export async function updateDictData(id: number, payload: DictDataSavePayload) {
  await http.put<ApiResult<void>>(`/dict-types/datas/${id}`, payload)
}

export async function deleteDictData(id: number) {
  await http.delete<ApiResult<void>>(`/dict-types/datas/${id}`)
}
