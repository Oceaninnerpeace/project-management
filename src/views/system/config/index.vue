<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import type { FormInstance, Rule } from 'ant-design-vue/es/form'
import { FeButton, FeInput, FePage, useFeModal, useFeTable } from '@rjgfny/ui-pro'
import type { FeTableApi, FeTableColumn, FeTableFetchParams } from '@rjgfny/ui-pro'

import {
  configTypeOptions,
  createConfig,
  deleteConfig,
  fetchConfigPage,
  formatConfigType,
  updateConfig,
  type Config,
} from '@/api/config'
import { withTableErrorNotice } from '@/utils/table-api'

const searchForm = reactive({
  configName: '',
  configKey: '',
})

const columns: FeTableColumn[] = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: '参数名称', dataIndex: 'configName', key: 'configName', width: 160, ellipsis: true },
  { title: '参数键名', dataIndex: 'configKey', key: 'configKey', width: 180, ellipsis: true },
  { title: '参数键值', dataIndex: 'configValue', key: 'configValue', ellipsis: true },
  { title: '系统内置', dataIndex: 'configType', key: 'configType', width: 100 },
  { title: '备注', dataIndex: 'remark', key: 'remark', width: 160, ellipsis: true },
  { title: '操作', key: 'action', width: 120, fixed: 'right' },
]

const tableApi: FeTableApi = withTableErrorNotice(async (params: FeTableFetchParams) => {
  return fetchConfigPage({
    pageNum: params.page,
    pageSize: params.pageSize,
    configName: params.configName as string | undefined,
    configKey: params.configKey as string | undefined,
  })
})

const [ConfigTable, configTableApi] = useFeTable({
  columns,
  api: tableApi,
  resultField: 'data',
  listField: 'list',
  totalField: 'total',
})

const editingConfigId = ref<number>()
const isEditMode = ref(false)
const configFormRef = ref<FormInstance>()
const configForm = reactive<Config>({
  configName: '',
  configKey: '',
  configValue: '',
  configType: 1,
  remark: '',
})

const configFormRules = computed<Record<string, Rule[]>>(() => ({
  configName: [{ required: true, message: '请输入参数名称', whitespace: true }],
  configKey: [{ required: true, message: '请输入参数键名', whitespace: true }],
  configValue: [{ required: true, message: '请输入参数键值', whitespace: true }],
  configType: [{ required: true, message: '请选择系统内置' }],
}))

const [ConfigFormModal, configFormModalApi] = useFeModal({
  width: 560,
  destroyOnClose: true,
  onConfirm: handleConfigFormSubmit,
})

function buildSearchParams() {
  return {
    configName: searchForm.configName.trim() || undefined,
    configKey: searchForm.configKey.trim() || undefined,
  }
}

function handleSearch() {
  configTableApi.setParams(buildSearchParams(), false)
}

function handleReset() {
  searchForm.configName = ''
  searchForm.configKey = ''
  configTableApi.setParams({}, false)
}

function resetConfigForm() {
  configForm.configName = ''
  configForm.configKey = ''
  configForm.configValue = ''
  configForm.configType = 1
  configForm.remark = ''
}

function openCreateModal() {
  isEditMode.value = false
  editingConfigId.value = undefined
  resetConfigForm()
  configFormModalApi.setState({ title: '新增参数' })
  configFormModalApi.open()
}

function openEditModal(record: Config) {
  isEditMode.value = true
  editingConfigId.value = record.id
  configForm.configName = record.configName
  configForm.configKey = record.configKey
  configForm.configValue = record.configValue
  configForm.configType = record.configType ?? 1
  configForm.remark = record.remark ?? ''
  configFormModalApi.setState({ title: '编辑参数' })
  configFormModalApi.open()
}

async function handleConfigFormSubmit() {
  try {
    await configFormRef.value?.validate()
  } catch {
    return
  }

  const payload: Config = {
    configName: configForm.configName.trim(),
    configKey: configForm.configKey.trim(),
    configValue: configForm.configValue.trim(),
    configType: configForm.configType,
    remark: configForm.remark?.trim() || undefined,
  }

  configFormModalApi.lock(true)
  try {
    if (isEditMode.value && editingConfigId.value) {
      await updateConfig(editingConfigId.value, payload)
      message.success('更新成功')
    } else {
      await createConfig(payload)
      message.success('创建成功')
    }
    configFormModalApi.close()
    await configTableApi.reload()
  } catch (err) {
    message.error(err instanceof Error ? err.message : '保存失败')
  } finally {
    configFormModalApi.lock(false)
  }
}

async function handleDelete(record: Config) {
  try {
    await deleteConfig(record.id!)
    message.success('删除成功')
    await configTableApi.reload()
  } catch (err) {
    message.error(err instanceof Error ? err.message : '删除失败')
  }
}
</script>

<template>
  <FePage title="参数配置" description="系统参数配置的增删改查。">
    <template #extra>
      <FeButton type="primary" @click="openCreateModal">新增参数</FeButton>
    </template>

    <a-form layout="inline" class="config-search" @submit.prevent="handleSearch">
      <a-form-item label="参数名称">
        <FeInput
          v-model:value="searchForm.configName"
          placeholder="请输入参数名称"
          allow-clear
          style="width: 180px"
          @press-enter="handleSearch"
        />
      </a-form-item>

      <a-form-item label="参数键名">
        <FeInput
          v-model:value="searchForm.configKey"
          placeholder="请输入参数键名"
          allow-clear
          style="width: 180px"
          @press-enter="handleSearch"
        />
      </a-form-item>

      <a-form-item>
        <FeButton type="primary" @click="handleSearch">查询</FeButton>
        <FeButton style="margin-left: 8px" @click="handleReset">重置</FeButton>
      </a-form-item>
    </a-form>

    <ConfigTable row-key="id">
      <template #configType="{ record }">
        {{ formatConfigType(record.configType as number) }}
      </template>

      <template #action="{ record }">
        <a-button type="link" size="small" @click="openEditModal(record as Config)">编辑</a-button>
        <a-popconfirm title="确认删除该参数？" @confirm="handleDelete(record as Config)">
          <a-button type="link" size="small" danger>删除</a-button>
        </a-popconfirm>
      </template>
    </ConfigTable>

    <ConfigFormModal>
      <a-form ref="configFormRef" :model="configForm" :rules="configFormRules" layout="vertical">
        <a-form-item label="参数名称" name="configName">
          <FeInput v-model:value="configForm.configName" placeholder="请输入参数名称" allow-clear />
        </a-form-item>

        <a-form-item label="参数键名" name="configKey">
          <FeInput
            v-model:value="configForm.configKey"
            placeholder="请输入参数键名"
            :disabled="isEditMode"
            allow-clear
          />
        </a-form-item>

        <a-form-item label="参数键值" name="configValue">
          <FeInput v-model:value="configForm.configValue" placeholder="请输入参数键值" allow-clear />
        </a-form-item>

        <a-form-item label="系统内置" name="configType">
          <a-radio-group v-model:value="configForm.configType" :options="configTypeOptions" />
        </a-form-item>

        <a-form-item label="备注" name="remark">
          <a-textarea
            v-model:value="configForm.remark"
            placeholder="请输入备注"
            :rows="3"
            allow-clear
          />
        </a-form-item>
      </a-form>
    </ConfigFormModal>
  </FePage>
</template>

<style scoped>
.config-search {
  margin-bottom: 16px;
  padding: 16px 16px 0;
  border-radius: 8px;
  background: #fafafa;
}

.config-search :deep(.ant-form-item) {
  margin-bottom: 16px;
}
</style>
