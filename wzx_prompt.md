# 提示词记录（wzx_prompt.md）

> 追加写入，禁止覆盖。格式：时间 | 提示词全文 | 大模型名称。

---

## 记录 01

- **时间**：2026-11-20
- **大模型**：DeepSeek-V4.1-Flash
- **提示词全文**：

```
https://spontaneous-valkyrie-4e4229.netlify.app/fullstack-init-lesson阅读并按照步骤完成任务 答辩问题也给出答案
```

---

## 记录 02

- **时间**：2026-11-20
- **大模型**：DeepSeek-V4.1-Flash
- **提示词全文**：

```
在当前项目根目录创建 AGENTS.md，写入以下规则。

## 项目结构与技术栈
- 前端：frontend/ 目录
 - 原生 HTML、CSS、JavaScript，禁止使用任何第三方库、框架、CDN 链接
 - 目录结构：frontend/ 下建 css/、js/、fonts/、images/ 子目录；
 fonts/ 存放 iconfont 图标文件（如果有）
- 后端：backend/ 目录，Node.js + Express，RESTful+MVC 风格，
 所有接口以 /api/ 为前缀，端口固定为 8xxx（学号后三位 207 → 8207）。
- 使用 express.static 托管 frontend/ 静态资源目录。
- 后端通过 cors 中间件开放全部跨域访问，本配置仅用于课程作业。
- 后端依赖安装：预先将 npm 源切换为国内镜像：
 npm config set registry https://registry.npmmirror.com
- 数据库：MySQL（用户名 root）
- 数据库凭据写入 backend/.env（变量名：DB_USER、DB_PASSWORD、DB_HOST、DB_NAME），
 不得出现在代码或 AGENTS.md 中；.env 同时加入 .gitignore
- 根据后端的要求自行建立和修改数据库表，每张表建立后，插入至少 8 条有真实业务意义的测试数据

## 命名与注释
- CSS 类名、JS 变量名、JS 函数名、数据库表名（及字段相关命名）一律以 wzx_ 开头
- 每个文件头部包含注释块：姓名 | 学号 | 时间 | 大模型

## 记录文件（一律追加写入，禁止覆盖已有内容）
- wzx_prompt.md（项目根目录）
- backend/wzx_interface.md
- backend/wzx_database.md
- 统一 JSON 响应格式：{ "code": 0, "msg": "提示信息", "data": {...} }

## 前端约定
- 服务器返回的数据和错误信息输出到浏览器控制台
- 新建 HTML 页面后，在 frontend/index.html 中追加超链接入口
```

---

## 记录 03

- **时间**：2026-11-20
- **大模型**：DeepSeek-V4.1-Flash
- **提示词全文**：

```
请初始化本项目：
1、git init + .gitignore（排除 node_modules、.env）+ 首次提交
2、按 AGENTS.md 规则创建前后端目录骨架、安装依赖、
3、创建前端首页 index.html，包括姓名、学号、项目名称、项目类别（自选、模仿），所有完成的 html 页面的超链接。有 canvas 背景动画。主体是页面链接导航。页面美观。
4、创建 readme.md，在根目录下，包括学号、姓名。
```

---

## 记录 04

- **时间**：2026-11-20
- **大模型**：DeepSeek-V4.1-Flash
- **提示词全文**：

```
创建运行后台的 bat 文件，放在项目根目录：
1、自动切换到 backend 目录再启动（用 %~dp0，双击时不受当前路径影响）；
2、使用 chcp 65001 避免中文日志乱码；
3、启动命令与 package.json 中的脚本保持一致；
4、结尾加 pause，出错时窗口不关闭。
```

---

## 记录 05

- **时间**：2026-11-20
- **大模型**：DeepSeek-V4.1-Flash
- **提示词全文**：

```
在 frontend/ 下创建 database.html：
1、页面有用户名、密码两个输入框，默认用户名 root，密码默认 123456，一个"测试连接"按钮；
2、点击后调用后端接口 /api/db-test，把用户名密码发给后端；
3、后端用 mysql2 尝试连接 MySQL，成功返回 { code:0, msg:"数据库连接成功", data:{ 数据库版本 } }，失败返回 code 非 0 和错误信息；
4、前端把结果显示在页面上：成功用绿色，失败用红色，同时在控制台输出；
5、数据库凭据从 backend/.env 读取，不要写死在代码里；
6、完成后在 frontend/index.html 加上本页面的超链接入口。
```

---

## 记录 06

- **时间**：2026-11-20
- **大模型**：DeepSeek-V4.1-Flash
- **提示词全文**：

```
完成科技新闻列表页面：
1、在 MySQL 中建表 wzx_news，字段包含：id、title、summary、content、source、publish_time、cover_img；
2、插入至少 8 条真实的科技新闻测试数据；
3、后端提供 GET /api/news 接口，返回全部新闻（按发布时间倒序），统一 JSON 格式 { code, msg, data }；
4、新建 frontend/news.html，页面顶部显示当前调用的接口地址，下方以列表展示新闻标题、摘要、来源、时间；
5、数据用 fetch 获取，控制台输出返回数据；
6、把建表与插入数据的 SQL 追加写入 backend/wzx_database.md，接口信息追加写入 backend/wzx_interface.md，本次提示词追加写入 wzx_prompt.md；
7、在 frontend/index.html 增加入口链接。
```

---

## 记录 07

- **时间**：2026-11-20
- **大模型**：DeepSeek-V4.1-Flash
- **提示词全文**：

```
完成图文列表页面：
1、在 MySQL 中新建表 wzx_gallery，字段：id、title、description、img_url、category、create_time，插入至少 8 条测试数据；
2、后端提供 GET /api/gallery 接口，返回全部图文数据；
3、新建 frontend/gallery.html，页面顶部显示接口地址，下方用网格布局展示"上图下文"卡片：图片、标题、描述；
4、图片加载失败时显示占位色块，不要出现破图图标；
5、页面适配手机宽度；
6、记录写入 backend/wzx_database.md、backend/wzx_interface.md 和 wzx_prompt.md，并在首页加入口。
```

---

## 记录 08

- **时间**：2026-11-20
- **大模型**：DeepSeek-V4.1-Flash
- **提示词全文**：

```
本机没有 MySQL，请装一个便携版 MySQL 8（root 密码 123456），项目放在与课堂练习目录同级的位置；
装好后把四个页面跑通，并用浏览器逐个验证：首页 canvas 动画、新闻 8 条、图文 8 张、数据库测试成功与失败分支。
```

---

## 记录 09

- **时间**：2026-11-20
- **大模型**：DeepSeek-V4.1-Flash
- **提示词全文**：

```
同级目录没有写权限，项目改放到课堂练习目录下 fullstack-0207/；MySQL 不支持中文路径，二进制与数据目录放到 C:\Users\Asus\wzx-mysql 与 C:\Users\Asus\.cache\wzx-mysql-data，并在文档里写清楚启动方式。
```
