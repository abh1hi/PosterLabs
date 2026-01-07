import { createApp } from 'vue'
import './index.css'
import App from './App.vue'
import router from './router'
import { registerSW } from 'virtual:pwa-register'
import { createPinia } from 'pinia'

// Register Service Worker
registerSW({
    onNeedRefresh() {
        console.log('New content available, click on reload button to update.')
    },
    onOfflineReady() {
        console.log('App ready to work offline')
    }
})

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
