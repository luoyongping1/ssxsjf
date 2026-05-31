// Service Worker 生命周期处理：立即激活
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(clients.claim()));

// --- 监听来自网页的消息 ---
self.addEventListener('message', (event) => {
    if (!event.data) return;

    // 1. 处理心跳包 (PING)，保持 SW 活跃状态
    if (event.data.type === 'PING') {
        console.log('[SW] 接收心跳包，保持保活状态');
        return;
    }

    // 2. 处理来自网页（index.html）的直接弹窗请求
    if (event.data.type === 'SHOW_NOTIFICATION') {
        const options = {
            body: event.data.body,
            icon: event.data.icon || 'https://cdn-icons-png.flaticon.com/512/3670/3670044.png',
            badge: 'https://cdn-icons-png.flaticon.com/512/3670/3670044.png',
            vibrate: [200, 100, 200],
            // 使用随机标签让通知堆叠而不是覆盖，确保多条消息都能看到
            tag: 'msg-' + Date.now(), 
            data: { url: '/' }
        };
        event.waitUntil(
            self.registration.showNotification(event.data.title, options)
        );
    }
});

// --- 监听云端推送 (Push) ---
self.addEventListener('push', (event) => {
    // 解析推送数据，如果没有数据则显示默认内容
    const data = event.data ? event.data.json() : { title: '书书小手机', body: '收到一条新消息' };
    
    const options = {
        body: data.body,
        icon: 'https://cdn-icons-png.flaticon.com/512/3670/3670044.png',
        badge: 'https://cdn-icons-png.flaticon.com/512/3670/3670044.png',
        vibrate: [200, 100, 200],
        data: { url: '/' } 
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// --- 点击通知后的处理：回到网页 ---
self.addEventListener('notificationclick', (event) => {
    // 关闭当前点击的弹窗
    event.notification.close();

    // 尝试寻找已打开的网页窗口并聚焦，如果没有打开则新开一个
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            // 遍历所有窗口，寻找我们的 App
            for (let i = 0; i < clientList.length; i++) {
                let client = clientList[i];
                if (client.url.indexOf('/') !== -1 && 'focus' in client) {
                    return client.focus();
                }
            }
            // 如果没找到已打开的页面，则新打开主页
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});