<script setup lang="ts">
import { reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import type { FormInstance, Rule } from 'ant-design-vue/es/form'
import { FeButton, FeInput, FePage, useFeModal, useFeTable } from '@rjgfny/ui-pro'
import type { FeTableApi, FeTableColumn, FeTableFetchParams } from '@rjgfny/ui-pro'

import {
  createDictData,
  createDictType,
  deleteDictData,
  deleteDictType,
  fetchDictDataList,
  fetchDictTypeList,
  updateDictData,
  updateDictType,
  type DictData,
  type DictDataSavePayload,
  type DictType,
  type DictTypeSavePayload,
} from '@/api/dict'
import { withTableErrorNotice } from '@/utils/table-api'

const statusOptions = [
  { label: '启用', value: 1 },
  { label: '禁用', value: 0 },
]

const searchForm = reactive({
  keyword: '',
  status: undefined as number | undefined,
})

const selectedTypeId = ref<number>()
const selectedType = ref<DictType>()

const typeColumns: FeTableColumn[] = [
  { title: '分类编码', dataIndex: 'typeCode', key: 'typeCode', width: 160, ellipsis: true },
  { title: '分类名称', dataIndex: 'typeName', key: 'typeName', width: 160, ellipsis: true },
  { title: '排序', dataIndex: 'sortNum', key: 'sortNum', width: 80 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 90 },
  { title: '备注', dataIndex: 'remark', key: 'remark', ellipsis: true },
  { title: '操作', key: 'action', width: 220, fixed: 'right' },
]

const dataColumns: FeTableColumn[] = [
  { title: '标签', dataIndex: 'label', key: 'label', width: 140, ellipsis: true },
  { title: '键值', dataIndex: 'value', key: 'value', width: 140, ellipsis: true },
  { title: '排序', dataIndex: 'sortNum', key: 'sortNum', width: 80 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 90 },
  { title: '备注', dataIndex: 'remark', key: 'remark', ellipsis: true },
  { title: '操作', key: 'action', width: 140, fixed: 'right' },
]

const typeTableApiFn: FeTableApi = withTableErrorNotice(async (params: FeTableFetchParams) => {
  let list = await fetchDictTypeList()

  const keyword = (params.keyword as string | undefined)?.trim().toLowerCase()
  if (keyword) {
    list = list.filter(
      (item) =>
        item.typeCode?.toLowerCase().includes(keyword) ||
        item.typeName?.toLowerCase().includes(keyword),
    )
  }

  const status = params.status as number | undefined
  if (status !== undefined) {
    list = list.filter((item) => item.status === status)
  }

  return { code: 0, msg: 'success', data: list }
})

const [TypeTable, typeTableApi] = useFeTable({
  columns: typeColumns,
  api: typeTableApiFn,
  resultField: 'data',
  pagination: false,
})

const dataTableApiFn: FeTableApi = withTableErrorNotice(async () => {
  if (!selectedTypeId.value) {
    return { code: 0, msg: 'success', data: [] }
  }
  const list = await fetchDictDataList(selectedTypeId.value)
  return { code: 0, msg: 'success', data: list }
})

const [DictDataTable, dictDataTableApi] = useFeTable({
  columns: dataColumns,
  api: dataTableApiFn,
  resultField: 'data',
  pagination: false,
})

const editingTypeId = ref<number>()
const isTypeEditMode = ref(false)
const typeFormRef = ref<FormInstance>()
const typeForm = reactive<DictTypeSavePayload>({
  typeCode: '',
  typeName: '',
  remark: '',
  status: 1,
  sortNum: 0,
})

const editingDataId = ref<number>()
const isDataEditMode = ref(false)
const dataFormRef = ref<FormInstance>()
const dataForm = reactive<DictDataSavePayload>({
  typeId: 0,
  label: '',
  value: '',
  remark: '',
  status: 1,
  sortNum: 0,
})

const typeFormRules: Record<string, Rule[]> = {
  typeCode: [{ required: true, message: '请输入分类编码', whitespace: true }],
  typeName: [{ required: true, message: '请输入分类名称', whitespace: true }],
}

const dataFormRules: Record<string, Rule[]> = {
  label: [{ required: true, message: '请输入数据标签', whitespace: true }],
  value: [{ required: true, message: '请输入数据键值', whitespace: true }],
}

const [TypeFormModal, typeFormModalApi] = useFeModal({
  width: 520,
  destroyOnClose: true,
  onConfirm: handleTypeFormSubmit,
})

const [DataListModal, dataListModalApi] = useFeModal({
  width: 960,
  destroyOnClose: true,
  showConfirmButton: false,
  cancelText: '关闭',
})

const [DataFormModal, dataFormModalApi] = useFeModal({
  width: 520,
  destroyOnClose: true,
  onConfirm: handleDataFormSubmit,
})

function buildSearchParams() {
  return {
    keyword: searchForm.keyword.trim() || undefined,
    status: searchForm.status,
  }
}

function handleSearch() {
  typeTableApi.setParams(buildSearchParams(), false)
}

function handleResetSearch() {
  searchForm.keyword = ''
  searchForm.status = undefined
  typeTableApi.setParams({}, false)
}

function resetTypeForm() {
  typeForm.typeCode = ''
  typeForm.typeName = ''
  typeForm.remark = ''
  typeForm.status = 1
  typeForm.sortNum = 0
}

function resetDataForm() {
  dataForm.typeId = selectedTypeId.value ?? 0
  dataForm.label = ''
  dataForm.value = ''
  dataForm.remark = ''
  dataForm.status = 1
  dataForm.sortNum = 0
}

function openCreateTypeModal() {
  isTypeEditMode.value = false
  editingTypeId.value = undefined
  resetTypeForm()
  typeFormModalApi.setState({ title: '新增字典分类' })
  typeFormModalApi.open()
}

function openEditTypeModal(record: DictType) {
  isTypeEditMode.value = true
  editingTypeId.value = record.id
  typeForm.typeCode = record.typeCode
  typeForm.typeName = record.typeName
  typeForm.remark = record.remark ?? ''
  typeForm.status = record.status ?? 1
  typeForm.sortNum = record.sortNum ?? 0
  typeFormModalApi.setState({ title: '编辑字典分类' })
  typeFormModalApi.open()
}

async function openDataListModal(record: DictType) {
  selectedTypeId.value = record.id
  selectedType.value = record
  dataListModalApi.setState({
    title: `字典数据 - ${record.typeName}（${record.typeCode}）`,
  })
  dataListModalApi.open()
  await dictDataTableApi.reload()
}

function openCreateDataModal() {
  if (!selectedTypeId.value) return
  isDataEditMode.value = false
  editingDataId.value = undefined
  resetDataForm()
  dataFormModalApi.setState({ title: '新增字典数据' })
  dataFormModalApi.open()
}

function openEditDataModal(record: DictData) {
  isDataEditMode.value = true
  editingDataId.value = record.id
  dataForm.typeId = record.typeId
  dataForm.label = record.label
  dataForm.value = record.value
  dataForm.remark = record.remark ?? ''
  dataForm.status = record.status ?? 1
  dataForm.sortNum = record.sortNum ?? 0
  dataFormModalApi.setState({ title: '编辑字典数据' })
  dataFormModalApi.open()
}

async function handleTypeFormSubmit() {
  try {
    await typeFormRef.value?.validate()
  } catch {
    return
  }

  const payload: DictTypeSavePayload = {
    typeCode: typeForm.typeCode.trim(),
    typeName: typeForm.typeName.trim(),
    remark: typeForm.remark?.trim() || undefined,
    status: typeForm.status,
    sortNum: typeForm.sortNum,
  }

  typeFormModalApi.lock(true)
  try {
    if (isTypeEditMode.value && editingTypeId.value) {
      await updateDictType(editingTypeId.value, payload)
      message.success('更新成功')
    } else {
      await createDictType(payload)
      message.success('创建成功')
    }
    typeFormModalApi.close()
    await typeTableApi.reload()
  } catch (err) {
    message.error(err instanceof Error ? err.message : '保存失败')
  } finally {
    typeFormModalApi.lock(false)
  }
}

async function handleDataFormSubmit() {
  try {
    await dataFormRef.value?.validate()
  } catch {
    return
  }

  if (!selectedTypeId.value) return

  const payload: DictDataSavePayload = {
    typeId: selectedTypeId.value,
    label: dataForm.label.trim(),
    value: dataForm.value.trim(),
    remark: dataForm.remark?.trim() || undefined,
    status: dataForm.status,
    sortNum: dataForm.sortNum,
  }

  dataFormModalApi.lock(true)
  try {
    if (isDataEditMode.value && editingDataId.value) {
      await updateDictData(editingDataId.value, payload)
      message.success('更新成功')
    } else {
      await createDictData(payload)
      message.success('创建成功')
    }
    dataFormModalApi.close()
    await dictDataTableApi.reload()
  } catch (err) {
    message.error(err instanceof Error ? err.message : '保存失败')
  } finally {
    dataFormModalApi.lock(false)
  }
}

async function handleDeleteType(record: DictType) {
  try {
    await deleteDictType(record.id)
    message.success('删除成功')
    await typeTableApi.reload()
  } catch (err) {
    message.error(err instanceof Error ? err.message : '删除失败')
  }
}

async function handleDeleteData(record: DictData) {
  try {
    await deleteDictData(record.id)
    message.success('删除成功')
    await dictDataTableApi.reload()
  } catch (err) {
    message.error(err instanceof Error ? err.message : '删除失败')
  }
}
</script>

<template>
  <FePage title="字典管理" description="字典分类维护，点击「字典数据」在弹窗中管理对应数据。">
    <template #extra>
      <FeButton type="primary" @click="openCreateTypeModal">新增分类</FeButton>
    </template>

    <a-form layout="inline" class="dict-search" @submit.prevent="handleSearch">
      <a-form-item label="关键字">
        <FeInput
          v-model:value="searchForm.keyword"
          placeholder="分类编码 / 名称"
          allow-clear
          style="width: 200px"
          @press-enter="handleSearch"
        />
      </a-form-item>

      <a-form-item label="状态">
        <a-select
          v-model:value="searchForm.status"
          placeholder="请选择状态"
          allow-clear
          style="width: 140px"
          :options="statusOptions"
        />
      </a-form-item>

      <a-form-item>
        <FeButton type="primary" @click="handleSearch">查询</FeButton>
        <FeButton style="margin-left: 8px" @click="handleResetSearch">重置</FeButton>
      </a-form-item>
    </a-form>

    <TypeTable row-key="id">
      <template #status="{ record }">
        <a-tag :color="record.status === 1 ? 'success' : 'default'">
          {{ record.status === 1 ? '启用' : '禁用' }}
        </a-tag>
      </template>

      <template #action="{ record }">
        <a-button type="link" size="small" @click="openDataListModal(record as DictType)">
          字典数据
        </a-button>
        <a-button type="link" size="small" @click="openEditTypeModal(record as DictType)">
          编辑
        </a-button>
        <a-popconfirm title="确认删除该字典分类？" @confirm="handleDeleteType(record as DictType)">
          <a-button type="link" size="small" danger>删除</a-button>
        </a-popconfirm>
      </template>
    </TypeTable>

    <TypeFormModal>
      <a-form ref="typeFormRef" :model="typeForm" :rules="typeFormRules" layout="vertical">
        <a-form-item label="分类编码" name="typeCode">
          <FeInput
            v-model:value="typeForm.typeCode"
            placeholder="请输入分类编码"
            :disabled="isTypeEditMode"
            allow-clear
          />
        </a-form-item>

        <a-form-item label="分类名称" name="typeName">
          <FeInput v-model:value="typeForm.typeName" placeholder="请输入分类名称" allow-clear />
        </a-form-item>

        <a-form-item label="排序" name="sortNum">
          <a-input-number v-model:value="typeForm.sortNum" :min="0" style="width: 100%" />
        </a-form-item>

        <a-form-item label="状态" name="status">
          <a-radio-group v-model:value="typeForm.status" :options="statusOptions" />
        </a-form-item>

        <a-form-item label="备注" name="remark">
          <a-textarea v-model:value="typeForm.remark" placeholder="请输入备注" :rows="3" allow-clear />
        </a-form-item>
      </a-form>
    </TypeFormModal>

    <DataListModal>
      <div class="dict-data-modal">
        <div class="dict-data-modal__toolbar">
          <span v-if="selectedType" class="dict-data-modal__hint">
            当前分类：{{ selectedType.typeName }}（{{ selectedType.typeCode }}）
          </span>
          <FeButton type="primary" size="small" @click="openCreateDataModal">新增数据</FeButton>
        </div>

        <DictDataTable row-key="id">
          <template #status="{ record }">
            <a-tag :color="record.status === 1 ? 'success' : 'default'">
              {{ record.status === 1 ? '启用' : '禁用' }}
            </a-tag>
          </template>

          <template #action="{ record }">
            <a-button type="link" size="small" @click="openEditDataModal(record as DictData)">
              编辑
            </a-button>
            <a-popconfirm
              title="确认删除该字典数据？"
              @confirm="handleDeleteData(record as DictData)"
            >
              <a-button type="link" size="small" danger>删除</a-button>
            </a-popconfirm>
          </template>
        </DictDataTable>
      </div>
    </DataListModal>

    <DataFormModal>
      <a-form ref="dataFormRef" :model="dataForm" :rules="dataFormRules" layout="vertical">
        <a-form-item label="数据标签" name="label">
          <FeInput v-model:value="dataForm.label" placeholder="请输入数据标签" allow-clear />
        </a-form-item>

        <a-form-item label="数据键值" name="value">
          <FeInput v-model:value="dataForm.value" placeholder="请输入数据键值" allow-clear />
        </a-form-item>

        <a-form-item label="排序" name="sortNum">
          <a-input-number v-model:value="dataForm.sortNum" :min="0" style="width: 100%" />
        </a-form-item>

        <a-form-item label="状态" name="status">
          <a-radio-group v-model:value="dataForm.status" :options="statusOptions" />
        </a-form-item>

        <a-form-item label="备注" name="remark">
          <a-textarea v-model:value="dataForm.remark" placeholder="请输入备注" :rows="3" allow-clear />
        </a-form-item>
      </a-form>
    </DataFormModal>
  </FePage>
</template>

<style scoped>
.dict-search {
  margin-bottom: 16px;
  padding: 16px 16px 0;
  border-radius: 8px;
  background: #fafafa;
}

.dict-search :deep(.ant-form-item) {
  margin-bottom: 16px;
}

.dict-data-modal__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.dict-data-modal__hint {
  color: rgba(0, 0, 0, 0.65);
  font-size: 13px;
}
</style>
