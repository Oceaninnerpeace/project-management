<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import type { FormInstance, Rule } from 'ant-design-vue/es/form'
import {
  FeButton,
  FeInput,
  FePage,
  useFeModal,
  useFeTable,
} from '@rjgfny/ui-pro'
import type { FeTableApi, FeTableColumn, FeTableFetchParams } from '@rjgfny/ui-pro'

import { fetchRoleList, type Role } from '@/api/role'
import {
  assignUserRoles,
  createUser,
  deleteUser,
  exportUsers,
  fetchUser,
  fetchUserPage,
  resetUserPassword,
  updateUser,
  updateUserStatus,
  type User,
  type UserSavePayload,
} from '@/api/user'
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
  { title: '用户名', dataIndex: 'userName', key: 'userName', width: 120, ellipsis: true },
  { title: '姓名', dataIndex: 'realName', key: 'realName', width: 120, ellipsis: true },
  { title: '手机号', dataIndex: 'mobile', key: 'mobile', width: 130 },
  { title: '邮箱', dataIndex: 'email', key: 'email', width: 180, ellipsis: true },
  { title: '状态', dataIndex: 'status', key: 'status', width: 90 },
  { title: '最后登录', dataIndex: 'lastLoginAt', key: 'lastLoginAt', width: 180 },
  { title: '操作', key: 'action', width: 280, fixed: 'right' },
]

const tableApi: FeTableApi = withTableErrorNotice(async (params: FeTableFetchParams) => {
  return fetchUserPage({
    page: params.page,
    size: params.pageSize,
    keyword: params.keyword as string | undefined,
    status: params.status as number | undefined,
  })
})

const [UserTable, userTableApi] = useFeTable({
  columns,
  api: tableApi,
  resultField: 'data',
  listField: 'list',
  totalField: 'total',
})

const editingUserId = ref<number>()
const userFormRef = ref<FormInstance>()
const userForm = reactive<UserSavePayload>({
  userName: '',
  userPass: '',
  realName: '',
  mobile: '',
  email: '',
})

const resetFormRef = ref<FormInstance>()
const resetForm = reactive({
  newPassword: '',
  confirmPassword: '',
})

const roleOptions = ref<Role[]>([])
const selectedRoleIds = ref<number[]>([])
const assigningUserId = ref<number>()

const isEditMode = ref(false)

const userFormRules = computed<Record<string, Rule[]>>(() => {
  const rules: Record<string, Rule[]> = {
    realName: [{ required: true, message: '请输入姓名', whitespace: true }],
  }
  if (!isEditMode.value) {
    rules.userName = [{ required: true, message: '请输入用户名', whitespace: true }]
    rules.userPass = [{ required: true, message: '请输入密码' }]
  }
  return rules
})

const resetFormRules: Record<string, Rule[]> = {
  newPassword: [
    { required: true, message: '请输入新密码' },
    { min: 6, message: '密码至少 6 位' },
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码' },
    {
      validator: async (_rule, value) => {
        if (value !== resetForm.newPassword) {
          return Promise.reject(new Error('两次输入的密码不一致'))
        }
        return Promise.resolve()
      },
    },
  ],
}

const [UserFormModal, userFormModalApi] = useFeModal({
  width: 520,
  destroyOnClose: true,
  onConfirm: handleUserFormSubmit,
})

const [ResetPasswordModal, resetPasswordModalApi] = useFeModal({
  title: '重置密码',
  width: 480,
  destroyOnClose: true,
  onConfirm: handleResetPasswordSubmit,
})

const [AssignRolesModal, assignRolesModalApi] = useFeModal({
  title: '分配角色',
  width: 520,
  destroyOnClose: true,
  onConfirm: handleAssignRolesSubmit,
})

function buildSearchParams() {
  return {
    keyword: searchForm.keyword.trim() || undefined,
    status: searchForm.status,
  }
}

function handleSearch() {
  userTableApi.setParams(buildSearchParams(), false)
}

function handleResetSearch() {
  searchForm.keyword = ''
  searchForm.status = undefined
  userTableApi.setParams({}, false)
}

function formatTime(value?: string) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-CN', { hour12: false })
}

function resetUserForm() {
  userForm.userName = ''
  userForm.userPass = ''
  userForm.realName = ''
  userForm.mobile = ''
  userForm.email = ''
}

function openCreateModal() {
  isEditMode.value = false
  editingUserId.value = undefined
  resetUserForm()
  userFormModalApi.setState({ title: '新增用户' })
  userFormModalApi.open()
}

async function openEditModal(record: User) {
  isEditMode.value = true
  editingUserId.value = record.id
  resetUserForm()
  userFormModalApi.setState({ title: '编辑用户', loading: true })
  userFormModalApi.open()
  try {
    const detail = await fetchUser(record.id)
    userForm.userName = detail.userName
    userForm.realName = detail.realName ?? ''
    userForm.mobile = detail.mobile ?? ''
    userForm.email = detail.email ?? ''
  } catch (err) {
    message.error(err instanceof Error ? err.message : '获取用户详情失败')
    userFormModalApi.close()
  } finally {
    userFormModalApi.setState({ loading: false })
  }
}

async function handleUserFormSubmit() {
  try {
    await userFormRef.value?.validate()
  } catch {
    return
  }

  userFormModalApi.lock(true)
  try {
    if (isEditMode.value && editingUserId.value) {
      await updateUser(editingUserId.value, {
        realName: userForm.realName?.trim(),
        mobile: userForm.mobile?.trim(),
        email: userForm.email?.trim(),
      })
      message.success('更新成功')
    } else {
      await createUser({
        userName: userForm.userName?.trim(),
        userPass: userForm.userPass,
        realName: userForm.realName?.trim(),
        mobile: userForm.mobile?.trim(),
        email: userForm.email?.trim(),
      })
      message.success('创建成功')
    }
    userFormModalApi.close()
    await userTableApi.reload()
  } catch (err) {
    message.error(err instanceof Error ? err.message : '保存失败')
  } finally {
    userFormModalApi.lock(false)
  }
}

async function handleDelete(record: User) {
  try {
    await deleteUser(record.id)
    message.success('删除成功')
    await userTableApi.reload()
  } catch (err) {
    message.error(err instanceof Error ? err.message : '删除失败')
  }
}

async function handleStatusChange(record: User, checked: boolean) {
  const status = checked ? 1 : 0
  try {
    await updateUserStatus(record.id, status)
    record.status = status
    message.success(checked ? '已启用' : '已禁用')
  } catch (err) {
    message.error(err instanceof Error ? err.message : '状态更新失败')
    await userTableApi.reload()
  }
}

function openResetPasswordModal(record: User) {
  editingUserId.value = record.id
  resetForm.newPassword = ''
  resetForm.confirmPassword = ''
  resetPasswordModalApi.setState({ title: `重置密码 - ${record.userName}` })
  resetPasswordModalApi.open()
}

async function handleResetPasswordSubmit() {
  try {
    await resetFormRef.value?.validate()
  } catch {
    return
  }

  if (!editingUserId.value) return

  resetPasswordModalApi.lock(true)
  try {
    await resetUserPassword(editingUserId.value, resetForm.newPassword)
    message.success('密码重置成功')
    resetPasswordModalApi.close()
  } catch (err) {
    message.error(err instanceof Error ? err.message : '密码重置失败')
  } finally {
    resetPasswordModalApi.lock(false)
  }
}

async function openAssignRolesModal(record: User) {
  assigningUserId.value = record.id
  selectedRoleIds.value = []
  assignRolesModalApi.setState({ title: `分配角色 - ${record.userName}`, loading: true })
  assignRolesModalApi.open()
  try {
    roleOptions.value = await fetchRoleList()
  } catch (err) {
    message.error(err instanceof Error ? err.message : '获取角色列表失败')
    assignRolesModalApi.close()
  } finally {
    assignRolesModalApi.setState({ loading: false })
  }
}

async function handleAssignRolesSubmit() {
  if (!assigningUserId.value) return

  assignRolesModalApi.lock(true)
  try {
    await assignUserRoles(assigningUserId.value, selectedRoleIds.value)
    message.success('角色分配成功')
    assignRolesModalApi.close()
  } catch (err) {
    message.error(err instanceof Error ? err.message : '角色分配失败')
  } finally {
    assignRolesModalApi.lock(false)
  }
}

async function handleExport() {
  try {
    await exportUsers(buildSearchParams())
    message.success('导出成功')
  } catch (err) {
    message.error(err instanceof Error ? err.message : '导出失败')
  }
}
</script>

<template>
  <FePage title="用户管理" description="用户的增删改查、状态管理、密码重置与角色分配。">
    <template #extra>
      <FeButton style="margin-right: 8px" @click="handleExport">导出</FeButton>
      <FeButton type="primary" @click="openCreateModal">新增用户</FeButton>
    </template>

    <a-form layout="inline" class="user-search" @submit.prevent="handleSearch">
      <a-form-item label="关键字">
        <FeInput
          v-model:value="searchForm.keyword"
          placeholder="用户名 / 姓名 / 手机 / 邮箱"
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

    <UserTable row-key="id">
      <template #status="{ record }">
        <a-switch
          :checked="record.status === 1"
          checked-children="启用"
          un-checked-children="禁用"
          @change="(checked: boolean) => handleStatusChange(record as User, checked)"
        />
      </template>

      <template #lastLoginAt="{ record }">
        {{ formatTime(record.lastLoginAt as string) }}
      </template>

      <template #action="{ record }">
        <a-space :size="0" wrap>
          <a-button type="link" size="small" @click="openEditModal(record as User)">编辑</a-button>
          <a-button type="link" size="small" @click="openResetPasswordModal(record as User)">
            重置密码
          </a-button>
          <a-button type="link" size="small" @click="openAssignRolesModal(record as User)">
            分配角色
          </a-button>
          <a-popconfirm title="确认删除该用户？" @confirm="handleDelete(record as User)">
            <a-button type="link" size="small" danger>删除</a-button>
          </a-popconfirm>
        </a-space>
      </template>
    </UserTable>

    <UserFormModal>
      <a-form
        ref="userFormRef"
        :model="userForm"
        :rules="userFormRules"
        layout="vertical"
      >
        <a-form-item label="用户名" name="userName">
          <FeInput
            v-model:value="userForm.userName"
            placeholder="请输入用户名"
            :disabled="isEditMode"
            allow-clear
          />
        </a-form-item>

        <a-form-item v-if="!isEditMode" label="密码" name="userPass">
          <a-input-password v-model:value="userForm.userPass" placeholder="请输入密码" />
        </a-form-item>

        <a-form-item label="姓名" name="realName">
          <FeInput v-model:value="userForm.realName" placeholder="请输入姓名" allow-clear />
        </a-form-item>

        <a-form-item label="手机号" name="mobile">
          <FeInput v-model:value="userForm.mobile" placeholder="请输入手机号" allow-clear />
        </a-form-item>

        <a-form-item label="邮箱" name="email">
          <FeInput v-model:value="userForm.email" placeholder="请输入邮箱" allow-clear />
        </a-form-item>
      </a-form>
    </UserFormModal>

    <ResetPasswordModal>
      <a-form
        ref="resetFormRef"
        :model="resetForm"
        :rules="resetFormRules"
        layout="vertical"
      >
        <a-form-item label="新密码" name="newPassword">
          <a-input-password v-model:value="resetForm.newPassword" placeholder="请输入新密码" />
        </a-form-item>
        <a-form-item label="确认密码" name="confirmPassword">
          <a-input-password v-model:value="resetForm.confirmPassword" placeholder="请再次输入新密码" />
        </a-form-item>
      </a-form>
    </ResetPasswordModal>

    <AssignRolesModal>
      <a-form layout="vertical">
        <a-form-item label="角色">
          <a-select
            v-model:value="selectedRoleIds"
            mode="multiple"
            placeholder="请选择角色"
            style="width: 100%"
            :options="roleOptions.map((item) => ({ label: item.roleName, value: item.id }))"
            allow-clear
          />
        </a-form-item>
        <a-alert
          message="分配角色为全量替换，传空数组将清除该用户所有角色。"
          type="info"
          show-icon
        />
      </a-form>
    </AssignRolesModal>
  </FePage>
</template>

<style scoped>
.user-search {
  margin-bottom: 16px;
  padding: 16px 16px 0;
  border-radius: 8px;
  background: #fafafa;
}

.user-search :deep(.ant-form-item) {
  margin-bottom: 16px;
}
</style>
