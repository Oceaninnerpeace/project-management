<script setup lang="ts">
import { reactive, ref } from 'vue'
import { Modal, message } from 'ant-design-vue'
import { FeButton, FeInput, FePage, useFeModal, useFeTable } from '@rjgfny/ui-pro'
import type { FeTableApi, FeTableColumn, FeTableFetchParams } from '@rjgfny/ui-pro'

import {
  businessTypeOptions,
  cleanOperLogs,
  deleteOperLog,
  fetchOperLogPage,
  formatBusinessType,
  type OperLog,
} from '@/api/oper-log'
import { withTableErrorNotice } from '@/utils/table-api'

const statusOptions = [
  { label: '成功', value: 1 },
  { label: '失败', value: 0 },
]

const searchForm = reactive({
  title: '',
  operName: '',
  businessType: undefined as number | undefined,
})

const detailRecord = ref<OperLog>()

const columns: FeTableColumn[] = [
  { title: '模块标题', dataIndex: 'title', key: 'title', width: 140, ellipsis: true },
  { title: '业务类型', dataIndex: 'businessType', key: 'businessType', width: 100 },
  { title: '操作人员', dataIndex: 'operName', key: 'operName', width: 120, ellipsis: true },
  { title: '请求方式', dataIndex: 'requestMethod', key: 'requestMethod', width: 90 },
  { title: '操作 IP', dataIndex: 'operIp', key: 'operIp', width: 130 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 80 },
  { title: '耗时(ms)', dataIndex: 'costTime', key: 'costTime', width: 90 },
  { title: '操作时间', dataIndex: 'operTime', key: 'operTime', width: 180 },
  { title: '操作', key: 'action', width: 120, fixed: 'right' },
]

const tableApi: FeTableApi = withTableErrorNotice(async (params: FeTableFetchParams) => {
  return fetchOperLogPage({
    pageNum: params.page,
    pageSize: params.pageSize,
    title: params.title as string | undefined,
    operName: params.operName as string | undefined,
    businessType: params.businessType as number | undefined,
  })
})

const [OperLogTable, operLogTableApi] = useFeTable({
  columns,
  api: tableApi,
  resultField: 'data',
  listField: 'list',
  totalField: 'total',
})

const [DetailModal, detailModalApi] = useFeModal({
  title: '操作日志详情',
  width: 720,
  showConfirmButton: false,
  cancelText: '关闭',
})

function buildSearchParams() {
  return {
    title: searchForm.title.trim() || undefined,
    operName: searchForm.operName.trim() || undefined,
    businessType: searchForm.businessType,
  }
}

function handleSearch() {
  operLogTableApi.setParams(buildSearchParams(), false)
}

function handleReset() {
  searchForm.title = ''
  searchForm.operName = ''
  searchForm.businessType = undefined
  operLogTableApi.setParams({}, false)
}

function formatTime(value?: string) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-CN', { hour12: false })
}

function openDetail(record: OperLog) {
  detailRecord.value = record
  detailModalApi.open()
}

async function handleDelete(id: number) {
  try {
    await deleteOperLog(id)
    message.success('删除成功')
    await operLogTableApi.reload()
  } catch (err) {
    message.error(err instanceof Error ? err.message : '删除失败')
  }
}

function handleClean() {
  Modal.confirm({
    title: '确认清空所有操作日志？',
    content: '清空后不可恢复，请谨慎操作。',
    okText: '确认清空',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      try {
        await cleanOperLogs()
        message.success('已清空操作日志')
        await operLogTableApi.reload()
      } catch (err) {
        message.error(err instanceof Error ? err.message : '清空失败')
        return Promise.reject(err)
      }
    },
  })
}
</script>

<template>
  <FePage title="操作日志" description="查询、删除与清空系统操作记录。">
    <template #extra>
      <FeButton danger @click="handleClean">清空日志</FeButton>
    </template>

    <a-form layout="inline" class="oper-log-search" @submit.prevent="handleSearch">
      <a-form-item label="模块标题">
        <FeInput
          v-model:value="searchForm.title"
          placeholder="请输入模块标题"
          allow-clear
          style="width: 180px"
          @press-enter="handleSearch"
        />
      </a-form-item>

      <a-form-item label="操作人员">
        <FeInput
          v-model:value="searchForm.operName"
          placeholder="请输入操作人员"
          allow-clear
          style="width: 160px"
          @press-enter="handleSearch"
        />
      </a-form-item>

      <a-form-item label="业务类型">
        <a-select
          v-model:value="searchForm.businessType"
          placeholder="请选择业务类型"
          allow-clear
          style="width: 140px"
          :options="businessTypeOptions"
        />
      </a-form-item>

      <a-form-item>
        <FeButton type="primary" @click="handleSearch">查询</FeButton>
        <FeButton style="margin-left: 8px" @click="handleReset">重置</FeButton>
      </a-form-item>
    </a-form>

    <OperLogTable row-key="id">
      <template #businessType="{ record }">
        {{ formatBusinessType(record.businessType as number) }}
      </template>

      <template #status="{ record }">
        <a-tag :color="record.status === 1 ? 'success' : 'error'">
          {{ record.status === 1 ? '成功' : '失败' }}
        </a-tag>
      </template>

      <template #operTime="{ record }">
        {{ formatTime(record.operTime as string) }}
      </template>

      <template #action="{ record }">
        <a-button type="link" size="small" @click="openDetail(record as OperLog)">详情</a-button>
        <a-popconfirm title="确认删除该条操作日志？" @confirm="handleDelete(record.id as number)">
          <a-button type="link" size="small" danger>删除</a-button>
        </a-popconfirm>
      </template>
    </OperLogTable>

    <DetailModal>
      <a-descriptions v-if="detailRecord" bordered :column="1" size="small">
        <a-descriptions-item label="模块标题">{{ detailRecord.title || '-' }}</a-descriptions-item>
        <a-descriptions-item label="业务类型">
          {{ formatBusinessType(detailRecord.businessType) }}
        </a-descriptions-item>
        <a-descriptions-item label="操作人员">{{ detailRecord.operName || '-' }}</a-descriptions-item>
        <a-descriptions-item label="请求方式">{{ detailRecord.requestMethod || '-' }}</a-descriptions-item>
        <a-descriptions-item label="方法名称">{{ detailRecord.method || '-' }}</a-descriptions-item>
        <a-descriptions-item label="请求 URL">{{ detailRecord.operUrl || '-' }}</a-descriptions-item>
        <a-descriptions-item label="操作 IP">{{ detailRecord.operIp || '-' }}</a-descriptions-item>
        <a-descriptions-item label="操作时间">{{ formatTime(detailRecord.operTime) }}</a-descriptions-item>
        <a-descriptions-item label="耗时(ms)">{{ detailRecord.costTime ?? '-' }}</a-descriptions-item>
        <a-descriptions-item label="状态">
          <a-tag :color="detailRecord.status === 1 ? 'success' : 'error'">
            {{ detailRecord.status === 1 ? '成功' : '失败' }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="错误信息">{{ detailRecord.errorMsg || '-' }}</a-descriptions-item>
        <a-descriptions-item label="请求参数">
          <pre class="oper-log-pre">{{ detailRecord.operParam || '-' }}</pre>
        </a-descriptions-item>
        <a-descriptions-item label="返回结果">
          <pre class="oper-log-pre">{{ detailRecord.operResult || '-' }}</pre>
        </a-descriptions-item>
      </a-descriptions>
    </DetailModal>
  </FePage>
</template>

<style scoped>
.oper-log-search {
  margin-bottom: 16px;
  padding: 16px 16px 0;
  border-radius: 8px;
  background: #fafafa;
}

.oper-log-search :deep(.ant-form-item) {
  margin-bottom: 16px;
}

.oper-log-pre {
  margin: 0;
  max-height: 160px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
  font-size: 12px;
}
</style>
