<script setup lang="ts">
import { App, ConfigProvider } from 'ant-design-vue'
import zhCN from 'ant-design-vue/es/locale/zh_CN'
</script>

<template>
  <ConfigProvider :locale="zhCN">
    <App>
      <router-view />
    </App>
  </ConfigProvider>
</template>
