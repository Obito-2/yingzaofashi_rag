# RAG 问答应用后端接口需求文档

根据前端 `uni-app` (Vue3) 代码梳理以及您的需求确认（存在后端数据库、流式输出、收集反馈、LLM自动总结标题），后端 (Python) 需提供以下接口。为保证良好的用户体验，核心问答接口采用 **SSE (Server-Sent Events)** 实现流式输出。

*提示：考虑到后续要部署到微信小程序，小程序对原生 SSE 支持较弱，Python 后端在实现流式时应注意兼容（例如前端可以使用微信小程序的 `request` 搭配 `enableChunked: true` 来接收分块流，后端保持标准的 Chunked/SSE 输出即可）。*

**基础约定：**
- **Base URL**: `/api/v1`
- **鉴权**: 建议在请求头中携带 `Authorization: Bearer <token>` 或 Header 中携带 `User-Id`。
- **数据交互格式**: `application/json` (除流式接口外)。
- **时间戳**: 统一使用 Unix 时间戳 (毫秒)。

---

## 1. 会话与历史记录管理

### 1.1 获取历史会话列表
前端在进入首页或初始加载侧边栏时调用，展示左侧的历史会话记录。
- **接口路径**: `GET /sessions`
- **请求参数**: 
  - `page` (int, 可选): 页码，默认 1
  - `size` (int, 可选): 每页数量，默认 20
- **响应示例**:
  ```json
  {
    "code": 200,
    "msg": "success",
    "data": [
      {
        "id": "session_123456",
        "title": "什么是《营造法式》中的「材分制」？",
        "updated_at": 1715432123456
      }
    ]
  }
  ```

### 1.2 获取指定会话的消息记录
用户在侧边栏点击某条历史记录时调用，用于在主聊天区还原当时的对话上下文。
- **接口路径**: `GET /sessions/{session_id}/messages`
- **响应示例**:
  ```json
  {
    "code": 200,
    "msg": "success",
    "data": [
      {
        "id": "msg_001",
        "role": "user",
        "content": "分析宋代建筑与唐代建筑的结构差异",
        "created_at": 1715432120000
      },
      {
        "id": "msg_002",
        "role": "assistant",
        "content": "宋代建筑相比唐代，其结构差异主要体现在...",
        "feedback": "like", // 可选: like, dislike, null (用于前端回显之前的点赞踩状态)
        "created_at": 1715432125000
      }
    ]
  }
  ```

### 1.3 删除会话 (可选补充)
- **接口路径**: `DELETE /sessions/{session_id}`
- **说明**: 用于满足用户清理特定历史记录的需求。

---

## 2. 核心问答接口 (流式输出 + 自动总结标题)

### 2.1 发送对话并获取流式回复
这是应用最核心的接口。考虑到**首轮对话需要自动总结标题**以及**流式返回文本**的需求，采用服务器推送事件（SSE）最能契合需求。
当 `session_id` 为空时，后端需执行 RAG 流程流式返回回答，同时**异步通过 LLM 总结标题**，并通过特定信号推送给前端。

- **接口路径**: `POST /chat/completions`
- **Headers**:
  - `Accept: text/event-stream`
  - `Content-Type: application/json`
- **请求体 (JSON)**:
  ```json
  {
    "session_id": "session_123456", // 如果是首页发起的全新提问，此字段传空字符串或不传
    "query": "如何通过榫卯结构实现建筑的抗震？"
  }
  ```
- **响应流 (SSE 格式)**:
  后端以 `data: {...}\n\n` 的格式不断推送。通过定义不同类型的 `event` 来区分数据。

  **推流事件设计建议：**
  
  1. **元数据事件 (生成开始)**：返回本次对话的 session_id 和 message_id。（用于前端更新 URL 并支持后续针对该消息点赞）
     ```text
     event: meta
     data: {"session_id": "session_123456", "message_id": "msg_003"}
     
     ```
  2. **内容增量事件 (生成中)**：LLM 吐出的增量文本。
     ```text
     event: message
     data: {"content": "榫"}
     
     event: message
     data: {"content": "卯结"}
     
     ```
  3. **标题生成事件 (仅首轮对话存在)**：LLM 成功总结出简练标题后推送。前端收到后立刻更新侧边栏和当前对话的 title。
     ```text
     event: title
     data: {"title": "榫卯结构抗震原理"}
     
     ```
  4. **结束事件**：生成结束。
     ```text
     event: done
     data: {"status": "finished"}
     
     ```

*对于 Python 后端：推荐使用 FastAPI 的 `StreamingResponse` 结合异步生成器轻松实现 SSE。*

---

## 3. 重新生成回复

### 3.1 重新请求最新回复 (Regenerate)
当用户对 AI 回复不满意或者由于网络中断导致生成不完整，点击“重新生成”时调用此接口。
- **接口路径**: `POST /chat/regenerate`
- **请求体**:
  ```json
  {
    "session_id": "session_123456"
  }
  ```
- **响应**: 同 `2.1` 的流式响应。后端应自动获取该 `session_id` 的上下文，截掉最后一次不理想的 AI 回复，然后针对当时的 Query 重新走一遍整个 RAG 流程并推流。

---

## 4. 用户交互与反馈

### 4.1 收集点赞/踩数据
用于收集用户反馈，从而持续优化检索和生成质量。此操作需要用到上面流式接口返回的 `message_id`。
- **接口路径**: `POST /messages/{message_id}/feedback`
- **请求体 (JSON)**:
  ```json
  {
    "action": "like" // 值域: "like" (点赞), "dislike" (踩), "none" (取消表态)
  }
  ```
- **响应示例**:
  ```json
  {
    "code": 200,
    "msg": "success"
  }
  ```
