const BASE_URL = 'https://gpumcpsgnnjp.sealoshzh.site';

// 获取 User-Id
function getUserId() {
  let userId = uni.getStorageSync('user_id');
  if (!userId) {
    // 随机生成一个唯一ID，此处使用简易实现
    userId = 'user_' + Math.random().toString(36).substring(2, 9) + Date.now();
    uni.setStorageSync('user_id', userId);
  }
  return userId;
}

// 获取 Token
function getToken() {
  return uni.getStorageSync('token') || '';
}

// 统一处理 401 未授权
function handleUnauthorized() {
  uni.removeStorageSync('token');
  uni.removeStorageSync('userInfo');
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const currentRoute = currentPage ? '/' + currentPage.route : '';

  // 避免在登录页无限重定向
  if (currentRoute !== '/pages/login/login') {
    uni.showToast({ title: '登录已过期，请重新登录', icon: 'none' });
    setTimeout(() => {
      uni.navigateTo({
        url: '/pages/login/login'
      });
    }, 1500);
  }
}

/**
 * 常规请求封装
 */
export function request(options) {
  return new Promise((resolve, reject) => {
    uni.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': options.header?.['Content-Type'] || 'application/json',
        'User-Id': getUserId(),
        'Authorization': getToken() ? `Bearer ${getToken()}` : '',
        ...options.header
      },
      success: (res) => {
        // 请求成功
        if (res.statusCode === 401) {
          handleUnauthorized();
          reject(res.data);
          return;
        }

        if (res.statusCode >= 200 && res.statusCode < 300) {
          if (res.data && res.data.code === 200) {
            resolve(res.data);
          } else {
            reject(res.data);
          }
        } else {
          reject(res);
        }
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
}

// 模拟 TextDecoder 的简单实现（用于不支持 TextDecoder 的底层基础库环境降级）
function utf8ArrayToStr(array) {
  let out, i, len, c;
  let char2, char3;

  out = "";
  len = array.length;
  i = 0;
  while (i < len) {
    c = array[i++];
    switch (c >> 4) {
      case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7: // 0xxxxxxx
        out += String.fromCharCode(c);
        break;
      case 12: case 13: // 110x xxxx   10xx xxxx
        char2 = array[i++];
        out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
        break;
      case 14: // 1110 xxxx  10xx xxxx  10xx xxxx
        char2 = array[i++];
        char3 = array[i++];
        out += String.fromCharCode(((c & 0x0F) << 12) |
          ((char2 & 0x3F) << 6) |
          ((char3 & 0x3F) << 0));
        break;
    }
  }
  return out;
}

/**
 * 流式请求封装 (SSE)
 * 对于微信小程序环境，必须使用 enableChunked: true
 */
export function streamRequest(options) {
  const { url, data, onMessage, onTitle, onMeta, onDone, onError } = options;
  const requestTask = uni.request({
    url: BASE_URL + url,
    method: 'POST',
    data: data,
    enableChunked: true,
    header: {
      'Accept': 'text/event-stream',
      'Content-Type': 'application/json',
      'User-Id': getUserId(),
      'Authorization': getToken() ? `Bearer ${getToken()}` : ''
    },
    success: (res) => {
      if (res.statusCode === 401) {
        handleUnauthorized();
        if (onError) onError(new Error(`Unauthorized`));
        return;
      }
      // 捕获非 200 的报错情况
      if (res.statusCode !== 200) {
        if (onError) onError(new Error(`HTTP Error: ${res.statusCode}`));
      }
    },
    fail: (err) => {
      if (onError) onError(err);
    }
  });

  let buffer = '';

  requestTask.onChunkReceived((res) => {
    const arrayBuffer = res.data;
    let text = '';

    try {
      // 尝试使用环境自带的 TextDecoder
      const decoder = new TextDecoder('utf-8');
      text = decoder.decode(arrayBuffer);
    } catch (e) {
      // 降级处理
      const uint8Array = new Uint8Array(arrayBuffer);
      text = utf8ArrayToStr(uint8Array);
    }

    buffer += text;

    // 按 \n\n 切分事件块
    const parts = buffer.split('\n\n');
    buffer = parts.pop() || ''; // 最后一部分可能不完整，保留到下次拼接处理

    parts.forEach(part => {
      if (!part.trim()) return;

      const lines = part.split('\n');
      let eventType = 'message';
      let eventData = '';

      lines.forEach(line => {
        if (line.startsWith('event:')) {
          eventType = line.substring(6).trim();
        } else if (line.startsWith('data:')) {
          eventData = line.substring(5).trim();
        }
      });

      if (eventData) {
        try {
          const parsedData = JSON.parse(eventData);
          switch (eventType) {
            case 'meta':
              if (onMeta) onMeta(parsedData);
              break;
            case 'message':
              if (onMessage) onMessage(parsedData);
              break;
            case 'title':
              if (onTitle) onTitle(parsedData);
              break;
            case 'done':
              if (onDone) onDone(parsedData);
              break;
            case 'error':
              if (onError) onError(parsedData);
              break;
            default:
              break;
          }
        } catch (e) {
          console.error('SSE JSON 分析错误:', e, '数据内容:', eventData);
        }
      }
    });
  });

  return requestTask;
}
