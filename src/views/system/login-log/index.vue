<script setup lang="ts">
import { reactive } from 'vue'
import { Modal, message } from 'ant-design-vue'
import { FeButton, FeInput, FePage, useFeTable } from '@rjgfny/ui-pro'
import type { FeTableApi, FeTableColumn, FeTableFetchParams } from '@rjgfny/ui-pro'

import { cleanLoginLogs, deleteLoginLog, fetchLoginLogPage } from '@/api/login-log'
import { withTableErrorNotice } from '@/utils/table-api'

const statusOptions = [
  { label: '成功', value: 1 },
  { label: '失败', value: 0 },
]

const searchForm = reactive({
  userName: '',
  ip: '',
  status: undefined as number | undefined,
})

const columns: FeTableColumn[] = [
  { title: '用户名', dataIndex: 'userName', key: 'userName', width: 120, ellipsis: true },
  { title: 'IP 地址', dataIndex: 'ip', key: 'ip', width: 140 },
  { title: '登录地点', dataIndex: 'location', key: 'location', width: 140, ellipsis: true },
  { title: '浏览器', dataIndex: 'browser', key: 'browser', width: 120, ellipsis: true },
  { title: '操作系统', dataIndex: 'os', key: 'os', width: 120, ellipsis: true },
  { title: '状态', dataIndex: 'status', key: 'status', width: 90 },
  { title: '提示信息', dataIndex: 'msg', key: 'msg', ellipsis: true },
  { title: '登录时间', dataIndex: 'loginTime', key: 'loginTime', width: 180 },
  { title: '操作', key: 'action', width: 90, fixed: 'right' },
]

const tableApi: FeTableApi = withTableErrorNotice(async (params: FeTableFetchParams) => {
  return fetchLoginLogPage({
    pageNum: params.page,
    pageSize: params.pageSize,
    userName: params.userName as string | undefined,
    ip: params.ip as string | undefined,
    status: params.status as number | undefined,
  })
})

const [LogTable, logTableApi] = useFeTable({
  columns,
  api: tableApi,
  resultField: 'data',
  listField: 'list',
  totalField: 'total',
})

function buildSearchParams() {
  return {
    userName: searchForm.userName.trim() || undefined,
    ip: searchForm.ip.trim() || undefined,
    status: searchForm.status,
  }
}

function handleSearch() {
  logTableApi.setParams(buildSearchParams(), false)
}

function handleReset() {
  searchForm.userName = ''
  searchForm.ip = ''
  searchForm.status = undefined
  logTableApi.setParams({}, false)
}

function formatTime(value?: string) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-CN', { hour12: false })
}

async function handleDelete(id: number) {
  try {
    await deleteLoginLog(id)
    message.success('删除成功')
    await logTableApi.reload()
  } catch (err) {
    message.error(err instanceof Error ? err.message : '删除失败')
  }
}

function handleClean() {
  Modal.confirm({
    title: '确认清空所有登录日志？',
    content: '清空后不可恢复，请谨慎操作。',
    okText: '确认清空',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      try {
        await cleanLoginLogs()
        message.success('已清空登录日志')
        await logTableApi.reload()
      } catch (err) {
        message.error(err instanceof Error ? err.message : '清空失败')
        return Promise.reject(err)
      }
    },
  })
}
</script>

<template>
  <FePage title="登录日志" description="查询、删除与清空用户登录记录。">
    <template #extra>
      <FeButton danger @click="handleClean">清空日志</FeButton>
    </template>

    <a-form layout="inline" class="login-log-search" @submit.prevent="handleSearch">
      <a-form-item label="用户名">
        <FeInput
          v-model:value="searchForm.userName"
          placeholder="请输入用户名"
          allow-clear
          style="width: 180px"
          @press-enter="handleSearch"
        />
      </a-form-item>

      <a-form-item label="IP">
        <FeInput
          v-model:value="searchForm.ip"
          placeholder="请输入 IP"
          allow-clear
          style="width: 180px"
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
        <FeButton style="margin-left: 8px" @click="handleReset">重置</FeButton>
      </a-form-item>
    </a-form>

    <LogTable row-key="id">
      <template #status="{ record }">
        <a-tag :color="record.status === 1 ? 'success' : 'error'">
          {{ record.status === 1 ? '成功' : '失败' }}
        </a-tag>
      </template>

      <template #loginTime="{ record }">
        {{ formatTime(record.loginTime as string) }}
      </template>

      <template #action="{ record }">
        <a-popconfirm title="确认删除该条登录日志？" @confirm="handleDelete(record.id as number)">
          <a-button type="link" size="small" danger>删除</a-button>
        </a-popconfirm>
      </template>
    </LogTable>
  </FePage>
</template>

<style scoped>
.login-log-search {
  margin-bottom: 16px;
  padding: 16px 16px 0;
  border-radius: 8px;
  background: #fafafa;
}

.login-log-search :deep(.ant-form-item) {
  margin-bottom: 16px;
}
</style>
