import { request, streamRequest } from '@/utils/request';

/**
 * 1.1 获取历史会话列表
 * @param {Object} params { page, size }
 */
export function getSessions(params = { page: 1, size: 20 }) {
  return request({
    url: '/sessions',
    method: 'GET',
    data: params
  });
}

/**
 * 1.2 获取指定会话的消息记录
 * @param {String} sessionId 
 */
export function getSessionMessages(sessionId) {
  return request({
    url: `/sessions/${sessionId}/messages`,
    method: 'GET'
  });
}

/**
 * 1.3 删除会话
 * @param {String} sessionId 
 */
export function deleteSession(sessionId) {
  return request({
    url: `/sessions/${sessionId}`,
    method: 'DELETE'
  });
}

/**
 * 3.1 提交点赞/踩反馈
 * @param {String} messageId 
 * @param {Object} data { action: 'like' | 'dislike' | 'none', remark?: string }
 */
export function submitFeedback(messageId, data) {
  return request({
    url: `/messages/${messageId}/feedback`,
    method: 'POST',
    data: data
  });
}

/**
 * 2.1 发送对话并获取流式回复
 * @param {Object} data { session_id?: string, query: string }
 * @param {Object} callbacks { onMeta, onMessage, onTitle, onDone, onError }
 * @returns {Object} requestTask (可用于中止请求: requestTask.abort())
 */
export function streamChatCompletion(data, callbacks) {
  return streamRequest({
    url: '/chat/completions',
    data: data,
    ...callbacks
  });
}

/**
 * 2.2 重新生成回复
 * @param {Object} data { session_id: string }
 * @param {Object} callbacks { onMeta, onMessage, onTitle, onDone, onError }
 * @returns {Object} requestTask (可用于中止请求: requestTask.abort())
 */
export function streamRegenerate(data, callbacks) {
  return streamRequest({
    url: '/chat/regenerate',
    data: data,
    ...callbacks
  });
}
