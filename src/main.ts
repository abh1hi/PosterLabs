import { createApp } from 'vue'
import './index.css'
import App from './App.vue'
import { registerSW } from 'virtual:pwa-register'

// Register Service Worker
registerSW({
    onNeedRefresh() {
        console.log('New content available, click on reload button to update.')
    },
    onOfflineReady() {
        console.log('App ready to work offline')
    }
})

import { createPinia } from 'pinia'

const app = createApp(App)
app.use(createPinia())
app.mount('#app')
