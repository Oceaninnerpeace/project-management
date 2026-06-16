<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import type { FormInstance, Rule } from 'ant-design-vue/es/form'
import { FeButton, FeInput, FePage, useFeModal, useFeTable } from '@rjgfny/ui-pro'
import type { FeTableApi, FeTableColumn, FeTableFetchParams } from '@rjgfny/ui-pro'

import {
  createApp,
  fetchAppList,
  updateApp,
  updateAppStatus,
  type App,
  type AppSavePayload,
} from '@/api/app'
import { withTableErrorNotice } from '@/utils/table-api'

const statusOptions = [
  { label: '启用', value: 1 },
  { label: '禁用', value: 0 },
]

const searchForm = reactive({
  keyword: '',
  status: undefined as number | undefined,
})

const columns: FeTableColumn[] = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: '应用编码', dataIndex: 'appCode', key: 'appCode', width: 140, ellipsis: true },
  { title: '应用名称', dataIndex: 'appName', key: 'appName', width: 160, ellipsis: true },
  { title: '应用地址', dataIndex: 'appUrl', key: 'appUrl', ellipsis: true },
  { title: '状态', dataIndex: 'status', key: 'status', width: 90 },
  { title: '操作', key: 'action', width: 100, fixed: 'right' },
]

const tableApi: FeTableApi = withTableErrorNotice(async (params: FeTableFetchParams) => {
  return fetchAppList({
    keyword: params.keyword as string | undefined,
    status: params.status as number | undefined,
  })
})

const [AppTable, appTableApi] = useFeTable({
  columns,
  api: tableApi,
  resultField: 'data',
  pagination: false,
})

const editingAppId = ref<number>()
const isEditMode = ref(false)
const appFormRef = ref<FormInstance>()
const appForm = reactive<AppSavePayload>({
  appCode: '',
  appName: '',
  appUrl: '',
})

const appFormRules = computed<Record<string, Rule[]>>(() => ({
  appCode: [{ required: true, message: '请输入应用编码', whitespace: true }],
  appName: [{ required: true, message: '请输入应用名称', whitespace: true }],
}))

const [AppFormModal, appFormModalApi] = useFeModal({
  width: 520,
  destroyOnClose: true,
  onConfirm: handleAppFormSubmit,
})

function buildSearchParams() {
  return {
    keyword: searchForm.keyword.trim() || undefined,
    status: searchForm.status,
  }
}

function handleSearch() {
  appTableApi.setParams(buildSearchParams(), false)
}

function handleResetSearch() {
  searchForm.keyword = ''
  searchForm.status = undefined
  appTableApi.setParams({}, false)
}

function resetAppForm() {
  appForm.appCode = ''
  appForm.appName = ''
  appForm.appUrl = ''
}

function openCreateModal() {
  isEditMode.value = false
  editingAppId.value = undefined
  resetAppForm()
  appFormModalApi.setState({ title: '注册应用' })
  appFormModalApi.open()
}

function openEditModal(record: App) {
  isEditMode.value = true
  editingAppId.value = record.id
  appForm.appCode = record.appCode
  appForm.appName = record.appName
  appForm.appUrl = record.appUrl ?? ''
  appFormModalApi.setState({ title: '编辑应用' })
  appFormModalApi.open()
}

async function handleAppFormSubmit() {
  try {
    await appFormRef.value?.validate()
  } catch {
    return
  }

  const payload: AppSavePayload = {
    appCode: appForm.appCode.trim(),
    appName: appForm.appName.trim(),
    appUrl: appForm.appUrl?.trim() || undefined,
  }

  appFormModalApi.lock(true)
  try {
    if (isEditMode.value && editingAppId.value) {
      await updateApp(editingAppId.value, payload)
      message.success('更新成功')
    } else {
      await createApp(payload)
      message.success('注册成功')
    }
    appFormModalApi.close()
    await appTableApi.reload()
  } catch (err) {
    message.error(err instanceof Error ? err.message : '保存失败')
  } finally {
    appFormModalApi.lock(false)
  }
}

async function handleStatusChange(record: App, checked: boolean) {
  const status = checked ? 1 : 0
  try {
    await updateAppStatus(record.id, status)
    record.status = status
    message.success(checked ? '已启用' : '已禁用')
  } catch (err) {
    message.error(err instanceof Error ? err.message : '状态更新失败')
    await appTableApi.reload()
  }
}
</script>

<template>
  <FePage title="应用管理" description="应用的注册、编辑与启用/禁用。">
    <template #extra>
      <FeButton type="primary" @click="openCreateModal">注册应用</FeButton>
    </template>

    <a-form layout="inline" class="app-search" @submit.prevent="handleSearch">
      <a-form-item label="关键字">
        <FeInput
          v-model:value="searchForm.keyword"
          placeholder="应用编码 / 名称 / 地址"
          allow-clear
          style="width: 220px"
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

    <AppTable row-key="id">
      <template #status="{ record }">
        <a-switch
          :checked="record.status === 1"
          checked-children="启用"
          un-checked-children="禁用"
          @change="(checked: boolean) => handleStatusChange(record as App, checked)"
        />
      </template>

      <template #action="{ record }">
        <a-button type="link" size="small" @click="openEditModal(record as App)">编辑</a-button>
      </template>
    </AppTable>

    <AppFormModal>
      <a-form ref="appFormRef" :model="appForm" :rules="appFormRules" layout="vertical">
        <a-form-item label="应用编码" name="appCode">
          <FeInput
            v-model:value="appForm.appCode"
            placeholder="请输入应用编码"
            :disabled="isEditMode"
            allow-clear
          />
        </a-form-item>

        <a-form-item label="应用名称" name="appName">
          <FeInput v-model:value="appForm.appName" placeholder="请输入应用名称" allow-clear />
        </a-form-item>

        <a-form-item label="应用地址" name="appUrl">
          <FeInput v-model:value="appForm.appUrl" placeholder="请输入应用访问地址" allow-clear />
        </a-form-item>
      </a-form>
    </AppFormModal>
  </FePage>
</template>

<style scoped>
.app-search {
  margin-bottom: 16px;
  padding: 16px 16px 0;
  border-radius: 8px;
  background: #fafafa;
}

.app-search :deep(.ant-form-item) {
  margin-bottom: 16px;
}
</style>
