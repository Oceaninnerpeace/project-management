import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Antd, { Button } from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import { globalShareState } from '@rjgfny/shared'
import FeUI from '@rjgfny/ui-pro'
import '@rjgfny/ui-pro/style.css'
import './styles/ui-pro-theme.css'

import App from './App.vue'
import router from './router'

// FeModal / FeForm 底部按钮依赖 globalShareState 注册的 Button 组件
globalShareState.setComponents({
  DefaultButton: Button,
  PrimaryButton: Button,
})

const app = createApp(App)
app.use(createPinia())
app.use(Antd)
app.use(FeUI)
app.use(router)
app.mount('#app')
