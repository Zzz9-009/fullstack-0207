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

---

## 2026-11-25 · 知识库（RAG）与多模态接口

知识库数据保存在 `backend/data/kb.json`，原始文件另存 `backend/data/kb-uploads/`，不依赖 MySQL。
检索方式：中文按单字 + 相邻二元组、英文按整词分词，按词频加权打分取前 topK 个片段。

### GET /api/kb/files

- **方法**：GET
- **请求参数**：无
- **响应示例**：

```json
{
  "code": 0,
  "msg": "查询成功",
  "data": {
    "total": 2,
    "files": [
      {
        "id": "mwvq1ixkh3ev",
        "name": "wzx-科技图文站知识库.txt",
        "ext": ".txt",
        "size": 1892,
        "chars": 880,
        "chunkCount": 3,
        "note": "",
        "createdAt": "2026-11-25T06:07:17.528Z"
      }
    ]
  }
}
```

### POST /api/kb/files

- **方法**：POST
- **Content-Type**：`multipart/form-data`
- **请求参数**：`file`，支持 `.txt .md .csv .doc .docx .ppt .pptx .pdf`，单文件 ≤20MB
- **成功响应示例**：

```json
{
  "code": 0,
  "msg": "解析并入库成功",
  "data": {
    "id": "mwvq5aodqpja",
    "name": "wzx-临时测试.txt",
    "ext": ".txt",
    "size": 49,
    "chars": 17,
    "chunkCount": 1,
    "note": "",
    "createdAt": "2026-11-25T06:10:13.453Z"
  }
}
```

- **说明**：docx 用 mammoth、pptx 用 jszip 解析 `ppt/slides/slideN.xml`、pdf 用 pdf-parse、doc 用 word-extractor、
  ppt 旧格式按 UTF-16LE 文本流尽力提取；`note` 字段会提示旧版格式的解析限制。
  失败码：`6001` 未选择文件、`6002` 解析失败或没有可读文字。

### DELETE /api/kb/files/:id

- **方法**：DELETE
- **请求参数**：路径参数 `id`
- **说明**：删除知识库记录的同时删除 `data/kb-uploads/` 里的原始文件；找不到时返回 `6003`。

### POST /api/kb/chat

- **方法**：POST
- **Content-Type**：`application/json`
- **请求参数**：

```json
{ "question": "你们营业时间到几点？", "topK": 4 }
```

- **成功响应示例**：

```json
{
  "code": 0,
  "msg": "回答成功",
  "data": {
    "answer": "营业时间：每天 10:00 开始营业，22:00 结束营业…",
    "sources": [
      {
        "fileId": "mwvq1ixaaz2p",
        "fileName": "wzx-客服知识库-中华美食街.docx",
        "index": 1,
        "score": 24.83,
        "preview": "中华美食街 · 客服知识库…"
      }
    ],
    "hitCount": 4,
    "model": "deepseek/deepseek-v4.1-flash",
    "provider": "七牛云",
    "usage": { "prompt_tokens": 971, "completion_tokens": 242, "total_tokens": 1213 }
  }
}
```

- **说明**：优先使用七牛 `QINIU_MODEL`，未配置七牛 Key 时退回硅基流动。
  后端控制台会完整打印“发送给大模型的数据”与“接收自大模型的数据”。
  没有命中任何片段时直接返回提示文字，`sources` 为空数组，不调用大模型。
  失败码：`6004` 问题为空、`6005` 问题过长、`6006` 知识库为空、`6007` 未配置 Key、`6008` 上游异常、`6009` 无有效内容、`6010` 超时。

### POST /api/vision

- **方法**：POST
- **Content-Type**：`multipart/form-data`
- **请求参数**：`image`，支持 png/jpg/jpeg/webp/gif/bmp，≤10MB
- **成功响应示例**：

```json
{
  "code": 0,
  "msg": "识别成功",
  "data": {
    "description": "这张图片采用极简的纯白背景，左侧是一个纯蓝色的实心正圆…",
    "fileName": "wzx-test-image.png",
    "imageSize": 3311,
    "model": "deepseek/deepseek-v4-flash-vision-exp",
    "usage": { "prompt_tokens": 257, "completion_tokens": 529, "total_tokens": 786 }
  }
}
```

- **说明**：图片转为 base64 data URL，通过 `/chat/completions` 以 `content` 数组发送；
  模型为 `QINIU_VISION_MODEL`，默认 `deepseek/deepseek-v4-flash-vision-exp`，`max_tokens` 固定 1000（该模型为推理模型，过小会导致正文为空）。
  控制台打印请求时会把 base64 截断为 `<N 字符已省略>`。失败码：`7001` 未选择图片、`7002` 未配置 Key、`7003` 上游异常、`7004` 无有效描述、`7005` 超时。

### POST /api/asr

- **方法**：POST
- **Content-Type**：`multipart/form-data`
- **请求参数**：`audio`，支持 wav/mp3/m4a/webm/ogg/aac/flac/amr，≤20MB，建议 60 秒内
- **成功响应示例**：

```json
{
  "code": 0,
  "msg": "识别成功",
  "data": {
    "text": "This is a speech recognition test. Hello world.",
    "fileName": "wzx-test-asr.wav",
    "audioSize": 222902,
    "model": "qwen-audio-3.0-asr-flash",
    "usage": { "seconds": 5, "type": "duration" }
  }
}
```

- **说明**：后端用 Node 24 自带的 FormData / Blob 原样转发到七牛 `POST /v1/audio/transcriptions`，
  字段固定 `model=qwen-audio-3.0-asr-flash`（大小写与拼写必须一致，否则返回 400 model_not_found）。
  失败码：`8001` 未选择音频、`8002` 未配置 Key、`8003` 上游异常、`8004` 未识别出文字、`8005` 超时。
