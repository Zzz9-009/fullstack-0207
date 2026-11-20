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
