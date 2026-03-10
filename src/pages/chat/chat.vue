<template>
  <view class="page-container">

    <!-- 悬浮菜单按钮 -->
    <view class="menu-fab" :style="{ left: menuFabLeft }" @click="toggleSidebar">
      <i :class="isSidebarOpen ? 'fas fa-times' : 'fas fa-bars'" style="color:#6b7280; font-size:18px;"></i>
    </view>

    <!-- 侧边栏（与首页保持一致） -->
    <aside :class="['sidebar', { 'expanded': isSidebarOpen }]">
      <view class="sidebar-inner">
        <view class="sidebar-header">
          <text class="sidebar-title">历史对话</text>
          <button class="add-btn" @click="newChat">
            <i class="fas fa-plus"></i>
          </button>
        </view>
        <view class="history-list">
          <view 
            class="history-item" 
            :class="{ 'active': currentSessionId === item.id }"
            v-for="item in historyList" 
            :key="item.id"
            @click="switchSession(item.id)"
          >
            <i class="far fa-message history-icon"></i>
            <text class="history-text">{{ item.title }}</text>
          </view>
        </view>
      </view>
      <view class="sidebar-footer">
        <view class="avatar">S</view>
        <view class="user-info">
          <text class="user-name">Sun Junqiang</text>
          <text class="user-role">Postgraduate</text>
        </view>
      </view>
    </aside>

    <!-- 主内容区 -->
    <main class="main-content">

      <!-- 消息列表 -->
      <scroll-view class="message-list" scroll-y :scroll-top="scrollTop" scroll-with-animation>
        <view class="message-list-inner">

          <view v-for="(msg, idx) in messages" :key="idx" :class="['message-row', msg.role]">

            <!-- AI 消息 -->
            <template v-if="msg.role === 'assistant'">
              <view class="ai-avatar">
                <i class="fas fa-dungeon" style="color:#73BA9B; font-size:16px;"></i>
              </view>
              <view class="bubble ai-bubble">
                <text class="bubble-text" v-if="!msg.typing">{{ msg.content }}</text>
                <!-- 打字中动效 -->
                <view v-else class="typing-wrap">
                  <text class="bubble-text">{{ msg.content }}</text>
                  <view class="typing-cursor"></view>
                </view>
                <!-- 操作按钮 -->
                <view class="ai-actions" v-if="!msg.typing">
                  <button class="action-icon-btn" title="点赞">
                    <i class="far fa-thumbs-up"></i>
                  </button>
                  <button class="action-icon-btn" title="踩">
                    <i class="far fa-thumbs-down"></i>
                  </button>
                  <button class="action-icon-btn" title="重新生成" @click="regenerate(idx)">
                    <i class="fas fa-redo-alt"></i>
                  </button>
                </view>
              </view>
            </template>

            <!-- 用户消息 -->
            <template v-else>
              <view class="bubble user-bubble">
                <text class="bubble-text">{{ msg.content }}</text>
              </view>
            </template>

          </view>

          <!-- 底部 padding 占位，防止被 input 遮住 -->
          <view style="height: 120px;"></view>
        </view>
      </scroll-view>

      <!-- 底部输入框（固定） -->
      <view class="input-bar">
        <view class="input-box-container" :class="{ focused: inputFocused }">
          <view class="input-inner">
            <textarea
              class="chat-textarea"
              v-model="inputText"
              placeholder="继续提问..."
              placeholder-style="color:#b0c5bb; font-weight:100;"
              :auto-height="true"
              :max-height="120"
              @focus="inputFocused = true"
              @blur="inputFocused = false"
              @confirm="sendMessage"
            ></textarea>
            <view class="input-actions">
              <view></view>
              <view class="action-btns">
                <button class="icon-btn">
                  <i class="fas fa-microphone" style="font-size:20px; color:#9ca3af;"></i>
                </button>
                <button class="send-btn" :class="{ active: inputText.trim() }" @click="sendMessage">
                  <i class="fas fa-paper-plane" style="color:#fff;"></i>
                </button>
              </view>
            </view>
          </view>
        </view>
        <view class="footer-tip">
          <text class="footer-text">Yingzao Encyclopedia · Knowledge Engine v1.1</text>
        </view>
      </view>

    </main>

  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';

/* ---- 侧边栏 ---- */
const isSidebarOpen = ref(false);
const windowWidth = ref(1024);

const menuFabLeft = computed(() => {
  if (!isSidebarOpen.value) return '20px';
  return windowWidth.value <= 768 ? 'calc(100% - 68px)' : '240px';
});

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

const MOCK_ANSWER = `根据《营造法式》的记载：\n\n**材分制**是宋代官方建筑规范中关于建筑构件尺...`;

const historyList = ref([]);
const currentSessionId = ref(null);
const messages = ref([]);
const inputText = ref('');
const inputFocused = ref(false);
const scrollTop = ref(0);

const saveHistory = () => {
  historyList.value.sort((a,b) => b.timestamp - a.timestamp);
  uni.setStorageSync('chatHistory', JSON.parse(JSON.stringify(historyList.value)));
};

const loadHistory = () => {
  const data = uni.getStorageSync('chatHistory');
  if (data && data.length > 0) {
    historyList.value = data.sort((a,b) => b.timestamp - a.timestamp);
  } else {
    historyList.value = [
      {
        id: 'mock-1',
        title: '《营造法式》材分制深度研究',
        timestamp: Date.now() - 100000,
        messages: [{ role: 'user', content: '什么是《营造法式》中的「材分制」？' }, { role: 'assistant', content: MOCK_ANSWER }]
      }
    ];
    saveHistory();
  }
};

const newChat = () => {
  if (windowWidth.value < 768) isSidebarOpen.value = false;
  uni.reLaunch({ url: '/pages/index/index' });
};

const switchSession = (sessionId) => {
  if (currentSessionId.value === sessionId) return;
  const session = historyList.value.find(s => s.id === sessionId);
  if (session) {
    currentSessionId.value = sessionId;
    messages.value = JSON.parse(JSON.stringify(session.messages));
    if (windowWidth.value < 768) {
      isSidebarOpen.value = false;
    }
    scrollToBottom();
  }
};

const typeWriter = async (msgIndex, fullText, expectedSessionId) => {
  const delay = (ms) => new Promise(r => setTimeout(r, ms));
  let current = '';
  const session = historyList.value.find(s => s.id === expectedSessionId);

  for (let i = 0; i < fullText.length; i++) {
    current += fullText[i];
    
    // Background update
    if (session && session.messages[msgIndex]) {
      session.messages[msgIndex].content = current;
    }

    // UI update only if active
    if (currentSessionId.value === expectedSessionId && messages.value[msgIndex]) {
      messages.value[msgIndex].content = current;
      if (i % 5 === 0) scrollToBottom();
    }
    await delay(30);
  }
  
  // Finish background
  if (session && session.messages[msgIndex]) {
    session.messages[msgIndex].typing = false;
    saveHistory();
  }

  // Finish UI
  if (currentSessionId.value === expectedSessionId && messages.value[msgIndex]) {
    messages.value[msgIndex].typing = false;
    scrollToBottom();
  }
};

const scrollToBottom = () => {
  nextTick(() => {
    scrollTop.value = 99999;
  });
};

const sendMessage = async () => {
  const text = inputText.value.trim();
  if (!text) return;

  // 添加用户消息
  messages.value.push({ role: 'user', content: text });
  inputText.value = '';
  scrollToBottom();

  if (!currentSessionId.value) {
    const newId = Date.now().toString();
    currentSessionId.value = newId;
    historyList.value.unshift({
      id: newId,
      title: text.length > 15 ? text.substring(0, 15) + '...' : text,
      timestamp: Date.now(),
      messages: JSON.parse(JSON.stringify(messages.value))
    });
  } else {
    const session = historyList.value.find(s => s.id === currentSessionId.value);
    if (session) {
      session.messages = JSON.parse(JSON.stringify(messages.value));
      session.timestamp = Date.now();
    }
  }
  saveHistory();

  // 模拟等待，然后添加 AI 消息
  await new Promise(r => setTimeout(r, 600));
  
  const typingSessionId = currentSessionId.value;

  const aiMsgIndex = messages.value.length;
  messages.value.push({ role: 'assistant', content: '', typing: true });
  scrollToBottom();

  // 更新存储以便包含空状态
  const session = historyList.value.find(s => s.id === currentSessionId.value);
  if (session) {
    session.messages = JSON.parse(JSON.stringify(messages.value));
    saveHistory();
  }

  // 打字机效果包含会话ID进行校验
  await typeWriter(aiMsgIndex, MOCK_ANSWER, typingSessionId);
};

const regenerate = async (idx) => {
  messages.value[idx].content = '';
  messages.value[idx].typing = true;
  await typeWriter(idx, MOCK_ANSWER, currentSessionId.value);
};

/* ---- 接收首页传来的 query ---- */
onMounted(async () => {
  windowWidth.value = uni.getSystemInfoSync().windowWidth;
  uni.onWindowResize((res) => {
    windowWidth.value = res.size.windowWidth;
  });

  loadHistory();

  // 读取页面传参（ query 或 sessionId ）
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const options = currentPage?.$page?.options ?? currentPage?.options ?? {};
  
  if (options.sessionId) {
    // 点击侧边栏历史记录跳转进来的
    switchSession(options.sessionId);
  } else if (options.query) {
    // 从首页发起的新 query
    inputText.value = options.query;
    
    // 模拟：创建一条新对话记录，然后高亮
    const newId = Date.now().toString();
    currentSessionId.value = newId;
    historyList.value.unshift({
      id: newId,
      title: options.query.slice(0, 15) + '...' // 自动生成标题
    });

    await nextTick();
    sendMessage();
  }
});

onUnmounted(() => {
  uni.offWindowResize(() => {});
});
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&display=swap');
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');

/* ---- 整体布局 ---- */
.page-container {
  display: flex;
  font-family: 'Noto Sans SC', sans-serif;
  background-color: #ffffff;
  color: #1f1f1f;
  overflow: hidden;
  width: 100vw;
  height: 100vh;
  position: relative;
}

/* ---- 渐变文字 ---- */
.gradient-text {
  background: linear-gradient(90deg, #50a3a2 0%, #73BA9B 45%, #d4c27b 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  display: inline-block;
}

/* ---- 悬浮菜单按钮 ---- */
.menu-fab {
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 100;
  width: 48px;
  height: 48px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: left 0.4s cubic-bezier(0.4,0,0.2,1), background-color 0.2s;
}

.menu-fab:hover {
  background-color: #f0f4f9;
  transform: scale(1.05);
}

/* ---- 侧边栏 ---- */
.sidebar {
  flex-shrink: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background-color: #f8fafb;
  width: 0;
  opacity: 0;
  overflow: hidden;
  transition: width 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.4s;
  z-index: 50;
}

.sidebar.expanded {
  width: 300px;
  opacity: 1;
  border-right: 1px solid #f0f0f0;
}

.sidebar-inner {
  padding: 80px 32px 32px;
  flex: 1;
  overflow-y: auto;
}

/* 新建对话按钮 */
.new-chat-btn {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  padding: 12px 16px;
  background-color: #ffffff;
  border-radius: 12px;
  cursor: pointer;
  margin-bottom: 32px;
  border: 1px solid #e5e7eb;
  transition: all 0.2s;
  color: #1f2937;
  font-weight: 500;
  font-size: 15px;
}

.new-chat-btn:hover {
  border-color: #73BA9B;
  color: #73BA9B;
  background-color: #f1f8f5;
}

.new-chat-btn i {
  font-size: 16px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.sidebar-title {
  font-size: 14px;
  font-weight: 700;
  color: #6b7280;
}

.add-btn {
  color: #73BA9B;
  background: transparent;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 4px;
  transition: transform 0.2s;
}

.add-btn:hover { transform: rotate(90deg); }

.history-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.history-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  border-left: 3px solid transparent;
  transition: background-color 0.2s, box-shadow 0.2s, border-color 0.2s;
}

.history-item:hover {
  background-color: #e8f5ef; /* 更改底色提示 */
}

/* 高亮当前展示的记录 */
.history-item.active {
  background-color: #e8f5ef;
  border-left-color: #73BA9B;
}

.history-item.active .history-icon {
  color: #73BA9B;
}

.history-item.active .history-text {
  color: #1f2937;
  font-weight: 500;
}

.history-icon { font-size: 12px; color: #9ca3af; flex-shrink: 0; }

.history-text {
  margin-left: 12px;
  font-size: 14px;
  color: #4b5563;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-footer {
  display: flex;
  align-items: center;
  padding: 24px 32px;
  border-top: 1px solid #f3f4f6;
}

.avatar {
  width: 40px; height: 40px;
  border-radius: 50%;
  background-color: #73BA9B;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-weight: 700; flex-shrink: 0;
}

.user-info { margin-left: 12px; display: flex; flex-direction: column; }
.user-name { font-size: 14px; font-weight: 500; color: #1f2937; }
.user-role  { font-size: 12px; color: #9ca3af; }

/* ---- 主内容 ---- */
.main-content {
  flex: 1;
  position: relative;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ---- 消息列表 ---- */
.message-list {
  flex: 1;
  overflow-y: auto;
}

.message-list-inner {
  max-width: 760px;
  margin: 0 auto;
  padding: 80px 24px 0;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

/* ---- 消息行 ---- */
.message-row {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.message-row.user {
  flex-direction: row-reverse;
}

/* ---- AI 头像 ---- */
.ai-avatar {
  width: 36px; height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e8f5ef 0%, #d0eddf 100%);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
  box-shadow: 0 2px 8px rgba(115,186,155,0.2);
}

/* ---- 气泡 ---- */
.bubble {
  max-width: 72%;
  padding: 16px 20px;
  border-radius: 20px;
  line-height: 1.75;
}

.ai-bubble {
  background: #f1f8f5;
  border-radius: 4px 20px 20px 20px;
}

.user-bubble {
  background: linear-gradient(135deg, #73BA9B 0%, #50a3a2 100%);
  border-radius: 20px 4px 20px 20px;
}

.user-bubble .bubble-text {
  color: #ffffff;
}

.bubble-text {
  font-size: 15px;
  color: #1f2937;
  white-space: pre-wrap;
}

/* ---- 打字光标 ---- */
.typing-wrap {
  display: flex;
  align-items: flex-end;
  flex-wrap: wrap;
}

.typing-cursor {
  display: inline-block;
  width: 2px;
  height: 18px;
  background-color: #73BA9B;
  margin-left: 2px;
  margin-bottom: 1px;
  animation: blink 0.8s infinite;
  flex-shrink: 0;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}

/* ---- AI 操作按钮 ---- */
.ai-actions {
  display: flex;
  gap: 4px;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid rgba(0,0,0,0.05);
}

.action-icon-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  font-size: 13px;
  color: #9ca3af;
  border-radius: 6px;
  transition: color 0.2s, background 0.2s;
  display: flex; align-items: center;
}

.action-icon-btn:hover {
  color: #73BA9B;
  background: rgba(115,186,155,0.08);
}

/* ---- 底部输入栏 ---- */
.input-bar {
  padding: 12px 24px 16px;
  background: #ffffff;
  border-top: 1px solid rgba(0,0,0,0.04);
}

.input-box-container {
  background-color: #f1f8f5;
  border-radius: 24px;
  border: 1px solid transparent;
  padding: 12px 16px;
  transition: background-color 0.3s, box-shadow 0.3s, border-color 0.3s;
  max-width: 760px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.input-box-container.focused {
  background-color: #ffffff;
  box-shadow: 0 8px 24px rgba(115,186,155,0.12);
  border-color: rgba(115,186,155,0.31);
}

.input-inner {
  display: flex;
  flex-direction: column;
}

.chat-textarea {
  background: transparent;
  border: none;
  outline: none;
  font-size: 16px;
  color: #1f2937;
  resize: none;
  line-height: 1.6;
  font-family: 'Noto Sans SC', sans-serif;
  width: 100%;
  min-height: 24px;
}

.chat-textarea:focus { outline: none; }

.input-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
}

.action-btns {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex; align-items: center; justify-content: center;
}

.send-btn {
  width: 40px; height: 40px;
  display: flex; align-items: center; justify-content: center;
  background-color: #c5dfd3;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.2s, background-color 0.3s, box-shadow 0.3s;
  flex-shrink: 0;
}

.send-btn.active {
  background-color: #73BA9B;
  box-shadow: 0 4px 12px rgba(115,186,155,0.35);
}

.send-btn:hover {
  transform: scale(1.05);
}

/* ---- 底部提示文字 ---- */
.footer-tip {
  text-align: center;
  padding-top: 8px;
}

.footer-text {
  font-size: 11px;
  color: #d1d5db;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

/* ---- 移动端侧边栏全屏抽屉 ---- */
@media (max-width: 768px) {
  .sidebar {
    position: absolute;
    top: 0; left: 0; bottom: 0;
    height: 100vh;
    z-index: 90;
  }

  .sidebar.expanded { width: 100%; }

  .bubble { max-width: 85%; }

  .input-bar { padding: 10px 16px 20px; }
}
</style>
