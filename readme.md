# 科技图文站 · 全栈项目初始化

- 姓名：王振旭
- 学号：24002120207
- 项目名称：科技图文站
- 项目类别：模仿（按课堂案例 fullstack-init-lesson 的链路实现）
- 技术栈：原生 HTML/CSS/JS + Node.js 24 + Express + MySQL 8

## 目录结构

```
fullstack-0207/
├── frontend/            前端静态页面（express.static 托管）
│   ├── index.html       首页：姓名学号、项目信息、页面导航、canvas 粒子动画
│   ├── database.html    数据库连接测试
│   ├── news.html        科技新闻列表
│   ├── gallery.html     图文列表（上图下文）
│   ├── css/ js/ images/ fonts/
├── backend/             后端服务
│   ├── app.js           入口：cors、静态托管、路由挂载
│   ├── config/          数据库连接池与环境变量
│   ├── models/          数据访问层（SQL）
│   ├── controllers/     控制器（统一响应）
│   ├── routes/          路由（/api/*）
│   ├── wzx_interface.md 接口记录
│   └── wzx_database.md  建表与测试数据 SQL 记录
├── start-backend.bat    一键启动后端
├── AGENTS.md            项目规则
├── wzx_prompt.md        提示词记录
└── readme.md            本文件
```

## 启动方式

1. 双击根目录 `start-database.bat` 启动便携版 MySQL（端口 3306，窗口不要关）。
   - 二进制：`C:\Users\Asus\wzx-mysql\mysql-8.0.28-winx64`
   - 数据目录：`C:\Users\Asus\.cache\wzx-mysql-data`
   - 之所以放在英文路径，是因为 MySQL 在 Windows 上无法处理中文路径。
2. 双击根目录 `start-backend.bat` 启动后端，或手动执行：

```powershell
cd backend
npm run start
```

3. 浏览器访问 `http://localhost:8207/`，接口健康检查：`http://localhost:8207/api/health`。

## 数据库

- 主机 127.0.0.1，端口 3306，库名 `wzx_fullstack`，账号 root
- 账号密码写在 `backend/.env`，该文件已加入 `.gitignore`，不会提交
- 重建表结构与测试数据：双击数据库窗口里执行 `backend/setup.sql`，或照 `backend/wzx_database.md` 顺序执行

## 页面

| 页面 | 说明 |
|---|---|
| index.html | 首页导航 + canvas 粒子背景 |
| database.html | 输入用户名密码测试 MySQL 连接 |
| news.html | 读取 `wzx_news` 表，展示科技新闻 |
| gallery.html | 读取 `wzx_gallery` 表，网格展示图文卡片 |
