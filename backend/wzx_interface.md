# 接口记录（wzx_interface.md）

> 追加写入，禁止覆盖。统一响应格式：`{ "code": 0, "msg": "提示信息", "data": {...} }`，`code=0` 成功。
> 服务地址：`http://localhost:8207`，全部接口以 `/api` 为前缀。

---

## 2026-11-20 · GET /api/health

- **方法**：GET
- **请求参数**：无
- **响应示例**：

```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "service": "科技图文站后端",
    "port": 8207,
    "time": "2026-11-20T05:34:27.400Z"
  }
}
```

- **说明**：用于确认服务已启动，验收时先访问这个地址。

---

## 2026-11-20 · POST /api/db-test

- **方法**：POST
- **Content-Type**：`application/json`
- **请求参数**：

```json
{ "user": "root", "password": "123456" }
```

- **成功响应示例**：

```json
{
  "code": 0,
  "msg": "数据库连接成功",
  "data": { "version": "8.0.28", "database": "wzx_fullstack" }
}
```

- **失败响应示例**（`code` 非 0）：

```json
{
  "code": 4002,
  "msg": "连接失败：Access denied for user 'root'@'localhost' (using password: YES)",
  "data": null
}
```

- **说明**：用页面传入的账号密码临时建立连接，库名与主机取自 `backend/.env`。

---

## 2026-11-20 · GET /api/news

- **方法**：GET
- **请求参数**：无
- **响应示例**：

```json
{
  "code": 0,
  "msg": "查询成功",
  "data": {
    "list": [
      {
        "id": 1,
        "title": "国产大模型推理框架开源，单卡吞吐提升四成",
        "summary": "新框架针对长上下文场景重写了注意力计算……",
        "content": "该框架由国内团队开源……",
        "source": "机器之心",
        "publish_time": "2026-11-19T09:30:00.000Z",
        "cover_img": ""
      }
    ],
    "total": 8
  }
}
```

- **说明**：查询 `wzx_news`，按 `publish_time` 倒序；查询异常返回 `code=5001`。

---

## 2026-11-20 · GET /api/gallery

- **方法**：GET
- **请求参数**：无
- **响应示例**：

```json
{
  "code": 0,
  "msg": "查询成功",
  "data": {
    "list": [
      {
        "id": 1,
        "title": "光之穹顶",
        "description": "环形灯阵在穹顶投下缓慢流动的光带……",
        "img_url": "/images/gallery-1.svg",
        "category": "建筑",
        "create_time": "2026-11-19T10:00:00.000Z"
      }
    ],
    "total": 8
  }
}
```

- **说明**：查询 `wzx_gallery`，按 `create_time` 倒序；查询异常返回 `code=5002`；图片为本地 SVG，随 `frontend/` 一起由 Express 托管。

---

## 2026-11-25 · POST /api/chat

- **方法**：POST
- **请求参数**：

```json
{
  "messages": [
    { "role": "system", "content": "你是一个有用的助手，请用简体中文简洁准确地回答。" },
    { "role": "user", "content": "你好" }
  ],
  "temperature": 0.7,
  "maxTokens": 1024
}
```

- **响应示例**：

```json
{
  "code": 0,
  "msg": "回答成功",
  "data": {
    "reply": "你好！有什么可以帮你的吗？",
    "model": "deepseek-ai/DeepSeek-V4-Flash",
    "usage": { "prompt_tokens": 20, "completion_tokens": 10, "total_tokens": 30 }
  }
}
```

- **说明**：后端读取 `backend/.env` 中的 `SILICONFLOW_API_KEY / SILICONFLOW_BASE_URL / SILICONFLOW_MODEL`，
  携带 Key 转发到 `POST {BASE_URL}/chat/completions`，前端源码中不出现 Key。
  `messages` 需为非空数组，`role` 仅接受 `system / user / assistant`；`temperature`、`maxTokens` 可省略，默认 0.7 与 1024。
  失败码：`5003` 未配置 Key、`5004` 参数不合法、`5005` 上游返回 401/402/404/429 等、`5006` 返回结构异常、`5007` 请求超时或网络异常。
  多轮对话由前端维护完整 `messages` 数组实现，模型本身不存储上下文。

### 平台参数补充（2026-11-25 · 第三步）

- **新增请求字段**：`provider`，可选 `siliconflow` 或 `qiniu`，省略时取 `.env` 的 `AI_PROVIDER`（默认 `siliconflow`）。
- **响应新增**：`data.provider = { key, name }`，便于前端显示当前平台。
- **平台配置位置**：`backend/.env` 中的 `SILICONFLOW_*` 与 `QINIU_*`，两个平台都是 OpenAI 兼容格式，切换只改 key、baseUrl、model 三个值。
- **新增失败码**：`5008` provider 不在支持列表；七牛未填 Key 时复用 `5003` 并提示具体平台名。
- **七牛模型选择（2026-11-25 实测）**：课程默认的 `qiniu/conatus-free` 返回 `429 free_campaign_global_limit`（免费模型全局限流，与 Key 无关）；
  部分旧模型（`glm-4.5`、`qwen-turbo`、`meituan/longcat-flash-lite` 等）已下线返回 502，`deepseek-v3` 返回 `model_disabled`。
  改用 `deepseek/deepseek-v4.1-flash` 后正常返回；该 Key 存在每分钟请求数（RPM）限制，连续快速请求会返回 `429 rate_limit_rpm_exceeded`，等一分钟即可恢复。
