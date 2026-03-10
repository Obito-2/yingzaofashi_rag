<template>
  <view class="page-container">

    <!-- 悬浮菜单按钮 -->
    <view class="menu-fab" :style="{ left: menuFabLeft }" @click="toggleSidebar">
      <i :class="isSidebarOpen ? 'fas fa-times' : 'fas fa-bars'" style="color:#6b7280; font-size:18px;"></i>
    </view>

    <!-- 侧边栏 -->
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
            v-for="item in historyList" 
            :key="item.id"
            @click="goToChat(item.id)"
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
      <view class="center-stage">
        <view class="content-wrapper">

          <!-- 标题区 -->
          <view class="title-area">
            <h1 class="main-title">
              <span class="gradient-text">你好，sun</span><br>
              <span class="gradient-text">想要了解哪些传统木建筑营造知识？</span>
            </h1>
          </view>

          <!-- 输入框 -->
          <view class="input-box-container" :class="{ focused: inputFocused }">
            <view class="input-inner">
              <textarea
                class="chat-textarea"
                v-model="inputText"
                placeholder="描述你想了解的传统木构建筑营造知识..."
                placeholder-style="color:#b0c5bb; font-weight:100;"
                @focus="inputFocused = true"
                @blur="inputFocused = false"
              ></textarea>
              <view class="input-actions">
                <view></view>
                <view class="action-btns">
                  <button class="icon-btn">
                    <i class="fas fa-microphone" style="font-size:24px; color:#9ca3af;"></i>
                  </button>
                  <view class="send-btn" :class="{ active: inputText.trim() }" @click="sendQuery">
                    <i class="fas fa-paper-plane" style="color:#fff;"></i>
                  </view>
                </view>
              </view>
            </view>
          </view>

          <!-- 示例卡片 -->
          <view class="sample-grid">
            <view class="sample-card" @click="fillSample('什么是《营造法式》中的材分制')">
              <i class="fas fa-chess-rook sample-icon"></i>
              <text class="sample-text">什么是《营造法式》中的「材分制」？</text>
            </view>
            <view class="sample-card" @click="fillSample('分析宋代建筑与唐代建筑的结构差异')">
              <i class="fas fa-tree sample-icon"></i>
              <text class="sample-text">分析宋代建筑与唐代建筑的结构差异</text>
            </view>
            <view class="sample-card" @click="fillSample('如何通过榫卯结构实现建筑的抗震？')">
              <i class="fas fa-puzzle-piece sample-icon"></i>
              <text class="sample-text">如何通过榫卯结构实现建筑的抗震？</text>
            </view>
            <view class="sample-card" @click="fillSample('解释「举折」与「屋面曲线」的关系')">
              <i class="fas fa-feather sample-icon"></i>
              <text class="sample-text">解释「举折」与「屋面曲线」的关系</text>
            </view>
          </view>

        </view>
      </view>

      <!-- 底部版权 -->
      <view class="footer">
        <text class="footer-text">Yingzao Encyclopedia · Knowledge Engine v1.1</text>
      </view>
    </main>

  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';

const isSidebarOpen = ref(false);
const windowWidth = ref(1024);
const inputText = ref('');
const inputFocused = ref(false);
const historyList = ref([]);

const menuFabLeft = computed(() => {
  if (!isSidebarOpen.value) return '20px';
  return windowWidth.value <= 768 ? 'calc(100% - 68px)' : '240px';
});

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

const newChat = () => {
  inputText.value = '';
};

const goToChat = (sessionId) => {
  uni.navigateTo({ url: `/pages/chat/chat?sessionId=${sessionId}` });
};

const sendQuery = () => {
  const text = inputText.value.trim();
  if (!text) return;
  uni.navigateTo({ url: `/pages/chat/chat?query=${encodeURIComponent(text)}` });
};

const fillSample = (text) => {
  inputText.value = text;
  sendQuery();
};

const handleResize = (res) => {
  windowWidth.value = res.size.windowWidth;
  if (windowWidth.value < 768 && isSidebarOpen.value) {
    isSidebarOpen.value = false;
  }
};

onMounted(() => {
  windowWidth.value = uni.getSystemInfoSync().windowWidth;
  uni.onWindowResize(handleResize);
});

onShow(() => {
});

onUnmounted(() => {
  uni.offWindowResize(handleResize);
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
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: left 0.4s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s;
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
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s;
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

.add-btn:hover {
  transform: rotate(90deg);
}

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

/* 高亮当前选中记录 */
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

.history-icon {
  font-size: 12px;
  color: #9ca3af;
  flex-shrink: 0;
}

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
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #73BA9B;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  flex-shrink: 0;
}

.user-info {
  margin-left: 12px;
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
}

.user-role {
  font-size: 12px;
  color: #9ca3af;
}

/* ---- 主内容 ---- */
.main-content {
  flex: 1;
  position: relative;
  background: #ffffff;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.center-stage {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  flex: 1;
  padding: 0 24px;
  min-height: 0;
}

.content-wrapper {
  width: 100%;
  max-width: 800px;
  display: flex;
  flex-direction: column;
  gap: 48px;
}

/* ---- 标题 ---- */
.title-area {
  text-align: center;
}

.main-title {
  font-size: 40px;
  font-weight: 500;
  letter-spacing: -0.02em;
  line-height: 1.3;
  margin: 0;
}

@media (min-width: 768px) {
  .main-title {
    font-size: 48px;
  }
}

/* ---- 输入框 ---- */
.input-box-container {
  background-color: #f1f8f5;
  border-radius: 32px;
  transition: background-color 0.3s, box-shadow 0.3s, border-color 0.3s;
  border: 1px solid transparent;
  padding: 16px;
  width: 100%;
  box-sizing: border-box;
}

.input-box-container:focus-within {
  background-color: #ffffff;
  box-shadow: 0 8px 24px rgba(115, 186, 155, 0.12);
  border-color: rgba(115, 186, 155, 0.31);
}

.input-inner {
  display: flex;
  flex-direction: column;
  height: 160px;
}

.chat-textarea {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 20px;
  color: #1f2937;
  padding: 8px 0;
  resize: none;
  line-height: 1.6;
  font-family: 'Noto Sans SC', sans-serif;
  width: 100%;
}

.chat-textarea:focus {
  outline: none;
}

.input-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
}

.action-btns {
  display: flex;
  align-items: center;
  gap: 16px;
}

.icon-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:hover i {
  color: #4b5563 !important;
}

.send-btn {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #c5dfd3;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.2s, background-color 0.3s, box-shadow 0.3s;
  flex-shrink: 0;
}

.send-btn.active {
  background-color: #73BA9B;
  box-shadow: 0 4px 12px rgba(115, 186, 155, 0.35);
}

.send-btn:hover {
  transform: scale(1.05);
}

/* ---- 示例卡片 ---- */
.sample-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 768px) {
  .sample-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.sample-card {
  height: 64px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  border-radius: 16px;
  cursor: pointer;
  border: 1px solid #e5e7eb;
  background: transparent;
  transition: border-color 0.2s, background-color 0.2s;
}

.sample-card:hover {
  border-color: #73BA9B;
  background-color: #f1f8f5;
}

.sample-card:hover .sample-icon {
  opacity: 1;
}

.sample-card:hover .sample-text {
  color: #1f2937;
}

.sample-icon {
  color: #73BA9B;
  opacity: 0.4;
  margin-right: 16px;
  font-size: 12px;
  flex-shrink: 0;
  transition: opacity 0.2s;
}

.sample-text {
  font-size: 14px;
  color: #6b7280;
  transition: color 0.2s;
}

/* ---- 底部版权 ---- */
.footer {
  text-align: center;
  padding: 24px 0;
}

.footer-text {
  font-size: 11px;
  color: #d1d5db;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

/* ---- 移动端：抽屉全屏侧边栏 ---- */
@media (max-width: 768px) {
  .sidebar {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    height: 100vh;
    z-index: 90;
  }

  .sidebar.expanded {
    width: 100%;
  }
}
</style>