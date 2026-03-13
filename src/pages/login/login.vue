<template>
  <view class="login-container">
    <!-- 顶部返回/关闭按钮 -->
    <view class="back-nav" @click="goBack">
      <i class="fas fa-arrow-left"></i>
    </view>

    <view class="content-wrapper">
      <!-- 标题部分 -->
      <view class="header">
        <h1 class="main-title">
          <span class="gradient-text">{{ isLogin ? '欢迎登录' : '注册账号' }}</span>
        </h1>
        <text class="subtitle">{{ isLogin ? '登录以继续探索传统木建筑知识' : '加入属于你的营造百科世界' }}</text>
      </view>

      <!-- 选项卡切换 -->
      <view class="tabs">
        <view class="tab-item" :class="{ active: isLogin }" @click="switchTab(true)">登录</view>
        <view class="tab-item" :class="{ active: !isLogin }" @click="switchTab(false)">注册</view>
        <view class="tab-indicator" :style="{ transform: isLogin ? 'translateX(0)' : 'translateX(100%)' }"></view>
      </view>

      <!-- 表单部分 -->
      <view class="form-container">
        <!-- 用户名 -->
        <view class="input-group">
          <view class="input-box" :class="{ focused: activeField === 'username' }">
            <i class="fas fa-user input-icon"></i>
            <input
              type="text"
              class="custom-input"
              v-model="form.username"
              placeholder="请输入用户名"
              placeholder-class="input-placeholder"
              @focus="activeField = 'username'"
              @blur="activeField = ''"
            />
          </view>
        </view>

        <!-- 昵称 (注册时可见) -->
        <view class="input-group animated-field" v-if="!isLogin">
          <view class="input-box" :class="{ focused: activeField === 'nickname' }">
            <i class="fas fa-id-card input-icon"></i>
            <input
              type="text"
              class="custom-input"
              v-model="form.nickname"
              placeholder="请输入昵称 (可选)"
              placeholder-class="input-placeholder"
              @focus="activeField = 'nickname'"
              @blur="activeField = ''"
            />
          </view>
        </view>

        <!-- 密码 -->
        <view class="input-group">
          <view class="input-box" :class="{ focused: activeField === 'password' }">
            <i class="fas fa-lock input-icon"></i>
            <input
              :type="showPassword ? 'text' : 'password'"
              class="custom-input"
              v-model="form.password"
              placeholder="请输入密码"
              placeholder-class="input-placeholder"
              @focus="activeField = 'password'"
              @blur="activeField = ''"
            />
            <i 
              class="fas input-icon-right" 
              :class="showPassword ? 'fa-eye-slash' : 'fa-eye'"
              @click="showPassword = !showPassword"
            ></i>
          </view>
        </view>

        <!-- 确认密码 (注册时可见) -->
        <view class="input-group animated-field" v-if="!isLogin">
          <view class="input-box" :class="{ focused: activeField === 'confirmPassword' }">
            <i class="fas fa-check-circle input-icon"></i>
            <input
              :type="showPassword ? 'text' : 'password'"
              class="custom-input"
              v-model="form.confirmPassword"
              placeholder="请再输入一次密码"
              placeholder-class="input-placeholder"
              @focus="activeField = 'confirmPassword'"
              @blur="activeField = ''"
            />
          </view>
        </view>

        <!-- 提交按钮 -->
        <button 
          class="submit-btn" 
          :class="{ loading: isSubmitting }" 
          @click="handleSubmit"
          :disabled="isSubmitting"
        >
          <text v-if="!isSubmitting">{{ isLogin ? '登录' : '注册并登录' }}</text>
          <i v-else class="fas fa-spinner fa-spin"></i>
        </button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { login, register } from '@/api/auth';

const isLogin = ref(true);
const activeField = ref('');
const isSubmitting = ref(false);
const showPassword = ref(false);

const form = ref({
  username: '',
  password: '',
  confirmPassword: '',
  nickname: ''
});

const switchTab = (loginMode) => {
  if (isLogin.value === loginMode) return;
  isLogin.value = loginMode;
  // 清空多余字段
  form.value.password = '';
  form.value.confirmPassword = '';
  if (loginMode) {
    form.value.nickname = '';
  }
};

const goBack = () => {
  const pages = getCurrentPages();
  if (pages.length > 1) {
    uni.navigateBack();
  } else {
    uni.switchTab({ url: '/pages/index/index' });
  }
};

const validate = () => {
  if (!form.value.username.trim()) {
    uni.showToast({ title: '请输入用户名', icon: 'none' });
    return false;
  }
  if (!form.value.password) {
    uni.showToast({ title: '请输入密码', icon: 'none' });
    return false;
  }
  if (!isLogin.value) {
    if (form.value.password !== form.value.confirmPassword) {
      uni.showToast({ title: '两次输入的密码不一致', icon: 'none' });
      return false;
    }
  }
  return true;
};

const handleSubmit = async () => {
  if (!validate()) return;
  
  isSubmitting.value = true;
  try {
    let res;
    if (isLogin.value) {
      res = await login({
        username: form.value.username.trim(),
        password: form.value.password
      });
    } else {
      res = await register({
        username: form.value.username.trim(),
        password: form.value.password,
        nickname: form.value.nickname.trim()
      });
    }
    
    if (res && res.data && res.data.token) {
      uni.setStorageSync('token', res.data.token);
      uni.setStorageSync('userInfo', res.data.user);
      
      uni.showToast({ title: isLogin.value ? '登录成功' : '注册成功', icon: 'success' });
      
      setTimeout(() => {
        // 返回上一页
        const pages = getCurrentPages();
        if (pages.length > 1) {
          uni.navigateBack();
        } else {
          uni.reLaunch({ url: '/pages/index/index' });
        }
      }, 1000);
    }
  } catch (err) {
    const errorMsg = err.message || (isLogin.value ? '登录失败，请检查账号和密码' : '注册失败');
    uni.showToast({ title: errorMsg, icon: 'none' });
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&display=swap');
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');

.login-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  font-family: 'Noto Sans SC', sans-serif;
  background-color: #ffffff;
  color: #1f1f1f;
  position: relative;
}

/* 返回按钮 */
.back-nav {
  position: absolute;
  top: 44px; /* 安全区适当留白，实际可在onLoad处理状态栏高度 */
  left: 20px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: #f8fafb;
  cursor: pointer;
  z-index: 10;
  transition: background-color 0.2s;
  color: #6b7280;
}

.back-nav:hover {
  background-color: #f1f8f5;
  color: #73BA9B;
}

/* 渐变文字 */
.gradient-text {
  background: linear-gradient(90deg, #50a3a2 0%, #73BA9B 45%, #d4c27b 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  display: inline-block;
}

/* 核心内容区 */
.content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 32px;
  max-width: 400px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
  animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 标题区 */
.header {
  text-align: center;
  margin-bottom: 40px;
  width: 100%;
}

.main-title {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 12px 0;
  letter-spacing: -0.02em;
}

.subtitle {
  font-size: 14px;
  color: #6b7280;
}

/* Tabs */
.tabs {
  position: relative;
  display: flex;
  width: 100%;
  background-color: #f3f4f6;
  border-radius: 20px;
  padding: 4px;
  margin-bottom: 32px;
  box-sizing: border-box;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 10px 0;
  font-size: 15px;
  font-weight: 500;
  color: #6b7280;
  position: relative;
  z-index: 2;
  transition: color 0.3s;
  cursor: pointer;
}

.tab-item.active {
  color: #1f2937;
}

.tab-indicator {
  position: absolute;
  top: 4px;
  left: 4px;
  bottom: 4px;
  width: calc(50% - 4px);
  background-color: #ffffff;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1;
}

/* 表单容器 */
.form-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 动画字段（出现和消失） */
.animated-field {
  animation: slideDown 0.3s ease-out forwards;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); height: 0; margin-bottom: -20px; }
  to { opacity: 1; transform: translateY(0); height: auto; margin-bottom: 0; }
}

/* 输入框 */
.input-group {
  width: 100%;
}

.input-box {
  display: flex;
  align-items: center;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 0 16px;
  height: 52px;
  transition: all 0.3s ease;
}

.input-box.focused {
  background-color: #ffffff;
  border-color: #73BA9B;
  box-shadow: 0 0 0 4px rgba(115, 186, 155, 0.1);
}

.input-icon {
  color: #9ca3af;
  font-size: 16px;
  margin-right: 12px;
  width: 16px;
  text-align: center;
  transition: color 0.3s;
}

.input-box.focused .input-icon {
  color: #73BA9B;
}

.custom-input {
  flex: 1;
  height: 100%;
  border: none;
  background: transparent;
  font-size: 15px;
  color: #1f2937;
  outline: none;
}

.input-placeholder {
  color: #9ca3af;
}

.input-icon-right {
  color: #9ca3af;
  font-size: 16px;
  margin-left: 12px;
  padding: 8px;
  cursor: pointer;
  transition: color 0.3s;
}

.input-icon-right:hover {
  color: #4b5563;
}

/* 提交按钮 */
.submit-btn {
  margin-top: 12px;
  width: 100%;
  height: 52px;
  border-radius: 16px;
  background: linear-gradient(135deg, #73BA9B 0%, #50a3a2 100%);
  color: #ffffff;
  font-size: 16px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
  box-shadow: 0 8px 16px rgba(115, 186, 155, 0.25);
}

.submit-btn::after {
  border: none;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 20px rgba(115, 186, 155, 0.35);
}

.submit-btn:active:not(:disabled) {
  transform: translateY(0);
}

.submit-btn.loading {
  opacity: 0.8;
  cursor: not-allowed;
  transform: none;
}
</style>
