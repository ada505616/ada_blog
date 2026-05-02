# Ada Blog 后端接口项目说明

本文档面向新接手 `api-server` 的同事，用来快速理解 Express + SQLite 后端的模块职责、接口调用关系、数据库关系和常见改代码入口。

## 1. 技术栈与启动方式

- Runtime：Node.js
- Web 框架：Express
- 数据库：SQLite
- 鉴权：JWT access token + refresh session
- 上传：Multer 本地文件上传
- 密码：bcryptjs

常用命令：

```bash
cd api-server
npm install
cp .env.example .env
npm run dev
```

生产启动：

```bash
npm run start
```

服务启动链路：

```text
src/server.js
  -> initializeDatabase()
  -> app.listen(env.port)

src/app.js
  -> CORS / JSON / uploads static
  -> admin routers
  -> public routers
  -> 404 handler
  -> error handler
```

## 2. 环境变量

配置读取在 `src/config/env.js`。

| 变量 | 作用 | 默认值 |
| --- | --- | --- |
| `PORT` | API 服务端口 | `3000` |
| `DB_PATH` | SQLite 数据库文件 | `./data/blog.sqlite` |
| `JWT_ACCESS_SECRET` | access token 签名密钥 | 必填，无默认值 |
| `JWT_ACCESS_EXPIRES_IN` | access token 有效期 | `2h` |
| `ADMIN_DEFAULT_USERNAME` | 首次启动默认管理员用户名 | 首次初始化管理员时必填 |
| `ADMIN_DEFAULT_PASSWORD` | 首次启动默认管理员密码 | 首次初始化管理员时必填 |
| `ADMIN_DEFAULT_NICKNAME` | 默认管理员昵称 | `Administrator` |
| `CORS_ORIGIN` | CORS 白名单，逗号分隔，`*` 表示不限 | `*` |
| `PUBLIC_BASE_URL` | 生成上传文件 URL 时使用的公网 base URL | 空，默认用请求 host |
| `UPLOAD_DIR` | 上传文件目录 | `./uploads` |
| `UPLOAD_MAX_FILE_SIZE_MB` | 单文件上传大小限制 | `10` |

## 3. 目录职责

```text
src/
  app.js                 Express app 装配，注册中间件和路由
  server.js              启动入口，初始化数据库并监听端口
  config/env.js          环境变量解析
  db/connection.js       SQLite 连接和 Promise 化 run/get/all/transaction
  db/init.js             建表、索引、默认管理员初始化
  middleware/auth.js     后台 access token 鉴权
  middleware/error-handler.js 统一 404 和错误响应
  middleware/upload.js   图片上传中间件
  routes/admin/          后台管理接口
  routes/public/         前台公开接口
  services/              复用业务映射和 token 服务
  utils/                 通用工具函数
```

## 4. Express 路由装配关系

`src/app.js` 中的挂载关系：

| 挂载路径 | 路由文件 | 说明 |
| --- | --- | --- |
| `/health` | `app.js` 内部 | 健康检查 |
| `/uploads/*` | `express.static(env.uploadDir)` | 静态访问上传文件 |
| `/admin/auth` | `routes/admin/auth.js` | 管理员登录、刷新、退出、当前用户 |
| `/admin/articles` | `routes/admin/articles.js` | 后台文章管理 |
| `/admin/categories` | `routes/admin/categories.js` | 后台分类管理 |
| `/admin/tags` | `routes/admin/tags.js` | 后台标签管理 |
| `/admin/comments` | `routes/admin/comments.js` | 后台评论审核 |
| `/admin/media-files` | `routes/admin/media-files.js` | 后台媒体文件管理 |
| `/articles` | `routes/public/articles.js` | 前台文章列表和详情 |
| `/` | `routes/public/taxonomy.js` | 前台分类、标签 |
| `/` | `routes/public/comments.js` | 前台评论查询和提交 |

后台除 `auth` 的 login/refresh 外，其余模块都使用 `requireAdminAuth`。

## 5. 数据库结构和表关系

数据库初始化在 `src/db/init.js`，服务启动时自动建表和索引。

### 核心表

| 表 | 作用 |
| --- | --- |
| `admin_user` | 后台管理员账号 |
| `admin_session` | refresh token 会话 |
| `category` | 文章分类 |
| `tag` | 文章标签 |
| `article` | 文章主体 |
| `article_tag` | 文章和标签多对多关系 |
| `comment` | 评论和回复 |
| `media_file` | 上传文件记录 |

### 主要关系

```text
admin_user 1 -> N article
admin_user 1 -> N admin_session
admin_user 1 -> N media_file

category 1 -> N article

article N -> N tag
  through article_tag

article 1 -> N comment
comment 1 -> N comment
  through parent_id / reply_to_comment_id
```

### 文章内容字段

`article` 同时存三份正文：

| 字段 | 用途 |
| --- | --- |
| `content_json` | Editor.js 原始 JSON，后台编辑回填使用 |
| `content_html` | 前台文章详情直接渲染 |
| `content_text` | 搜索、摘要、纯文本读取 |

### 删除策略

| 模块 | 删除方式 |
| --- | --- |
| 文章 | 软删除，写 `deleted_at` |
| 评论 | 软删除，写 `deleted_at` |
| 分类 | 硬删除，但删除前检查是否有关联文章 |
| 标签 | 删除前清理 `article_tag`，然后硬删除 |
| 媒体文件 | 删除数据库记录，并尝试删除本地文件 |

## 6. 中间件和服务模块

### `middleware/auth.js`

职责：

- 从 `Authorization: Bearer <token>` 读取 access token。
- 调用 `verifyAccessToken` 校验 JWT。
- 查询 `admin_user`，确认管理员存在且启用。
- 写入 `req.admin`，包括 `sessionId`。

失败时抛出 401。

### `middleware/upload.js`

职责：

- 使用 multer 保存上传图片到 `env.uploadDir`。
- 支持 MIME：
  - `image/jpeg`
  - `image/png`
  - `image/webp`
  - `image/gif`
  - `image/svg+xml`
  - `image/avif`
- 文件名格式：`Date.now()` + 随机 hex + 原扩展名。
- 超出 `UPLOAD_MAX_FILE_SIZE_MB` 返回 400。

### `middleware/error-handler.js`

- `notFoundHandler`：统一 404 JSON 响应。
- `errorHandler`：统一错误 JSON 响应，5xx 会输出 server log。

### `db/connection.js`

封装 SQLite：

- `run(sql, params)`：执行写操作，返回 `lastID`、`changes`。
- `get(sql, params)`：取单行。
- `all(sql, params)`：取多行。
- `transaction(callback)`：BEGIN/COMMIT/ROLLBACK 事务。

### `services/token-service.js`

- `signAccessToken(payload)`：签发 JWT。
- `verifyAccessToken(token)`：校验 JWT。
- `generateRefreshToken()`：生成随机 refresh token。

### `services/article-service.js`

负责把数据库行映射成前端需要的 camelCase：

- `mapArticleListItem(row)`
- `mapArticleDetail(row, tags)`

## 7. 后台接口模块

### 管理员鉴权 `routes/admin/auth.js`

| 方法 | 路径 | 鉴权 | 作用 |
| --- | --- | --- | --- |
| `POST` | `/admin/auth/login` | 否 | 用户名密码登录，创建 refresh session，返回 accessToken/refreshToken/admin |
| `POST` | `/admin/auth/logout` | 是 | 删除当前或指定 refresh session |
| `POST` | `/admin/auth/refresh` | 否 | 校验 refresh token，轮换 refresh token，返回新 accessToken |
| `GET` | `/admin/auth/me` | 是 | 返回当前管理员信息和会话列表 |

登录流程：

```text
POST /admin/auth/login
  -> 查 admin_user
  -> bcrypt 校验密码
  -> 写 admin_session
  -> 更新 last_login_at
  -> 签发 accessToken
  -> 返回 accessToken + refreshToken + admin
```

刷新流程：

```text
POST /admin/auth/refresh
  -> 查 admin_session + admin_user
  -> 校验账号状态和 expired_at
  -> 生成 nextRefreshToken
  -> 更新 admin_session
  -> 签发新 accessToken
```

### 后台文章 `routes/admin/articles.js`

| 方法 | 路径 | 作用 |
| --- | --- | --- |
| `GET` | `/admin/articles` | 文章分页列表，支持 `page`、`pageSize`、`status`、`keyword` |
| `POST` | `/admin/articles` | 创建文章 |
| `GET` | `/admin/articles/:id` | 获取文章详情 |
| `PUT` | `/admin/articles/:id` | 更新文章 |
| `DELETE` | `/admin/articles/:id` | 软删除文章 |
| `POST` | `/admin/articles/:id/publish` | 发布文章 |

创建文章调用链：

```text
POST /admin/articles
  -> validateArticlePayload()
  -> transaction()
    -> buildArticleSlug()
    -> serializeJsonField(contentJson)
    -> normalizeTagIds()
    -> ensureCategoryExists()
    -> ensureTagsExist()
    -> INSERT article
    -> INSERT article_tag
  -> loadArticleDetail()
  -> mapArticleDetail()
```

更新文章调用链：

```text
PUT /admin/articles/:id
  -> 检查 article 存在且未删除
  -> updateArticle()
    -> validateArticlePayload()
    -> transaction()
      -> 按字段动态拼 UPDATE article
      -> tagIds 存在时重建 article_tag
  -> loadArticleDetail()
```

注意：

- `status` 只允许 `draft`、`published`、`private`。
- `contentType` 只允许 `markdown`、`editorjs`、`tiptap`。
- 发布时如果没有 `published_at` 会写当前时间。
- 后台列表包含 draft/private/published，前台只暴露 published。

### 后台分类 `routes/admin/categories.js`

| 方法 | 路径 | 作用 |
| --- | --- | --- |
| `GET` | `/admin/categories` | 分类列表，按 `sort` 和创建时间排序 |
| `POST` | `/admin/categories` | 创建分类 |
| `PUT` | `/admin/categories/:id` | 更新分类 |
| `DELETE` | `/admin/categories/:id` | 删除分类 |

注意：

- 创建必须有 `name`。
- `slug` 缺省时用 `name` 生成。
- 删除前检查是否存在未删除文章引用该分类，存在则返回 400。

### 后台标签 `routes/admin/tags.js`

| 方法 | 路径 | 作用 |
| --- | --- | --- |
| `GET` | `/admin/tags` | 标签列表 |
| `POST` | `/admin/tags` | 创建标签 |
| `PUT` | `/admin/tags/:id` | 更新标签 |
| `DELETE` | `/admin/tags/:id` | 删除标签 |

注意：

- 创建必须有 `name`。
- `slug` 缺省时用 `name` 生成。
- `color` 可为空，由前端色盘生成 `#RRGGBB`。
- 删除标签时会先删除 `article_tag` 关联，再删除 `tag`。

### 后台评论 `routes/admin/comments.js`

| 方法 | 路径 | 作用 |
| --- | --- | --- |
| `GET` | `/admin/comments` | 评论分页列表，支持 `status` 筛选 |
| `PUT` | `/admin/comments/:id/audit` | 修改评论状态 |
| `DELETE` | `/admin/comments/:id` | 软删除评论 |

评论状态：

- `pending`：待审核
- `approved`：通过，前台可见
- `rejected`：拒绝
- `spam`：垃圾

副作用：

- 审核状态从非 `approved` 改为 `approved` 时，文章 `comment_count + 1`。
- 审核状态从 `approved` 改为非 `approved` 或删除时，文章 `comment_count - 1`。

### 后台媒体 `routes/admin/media-files.js`

| 方法 | 路径 | 作用 |
| --- | --- | --- |
| `GET` | `/admin/media-files` | 媒体分页列表，支持 `keyword` |
| `GET` | `/admin/media-files/:id` | 媒体详情 |
| `POST` | `/admin/media-files/upload` | 普通上传，返回媒体记录 |
| `POST` | `/admin/media-files/editorjs` | Editor.js 上传，返回 `{ success, file: { url } }` |
| `DELETE` | `/admin/media-files/:id` | 删除媒体记录和本地文件 |

上传调用链：

```text
handleSingleUpload("file")
  -> persistUploadedFile(req, file, adminId)
    -> 计算 sha256 hash
    -> 检查相同 hash + file_size 是否已存在
    -> getImageMetadata()
    -> INSERT media_file
    -> buildFileUrl()
```

去重策略：

- 如果已存在相同 hash 和 size 的媒体记录，会删除本次临时上传文件，并返回已有媒体记录，带 `duplicated: true`。

URL 生成：

- 有 `PUBLIC_BASE_URL` 时使用它。
- 否则使用当前请求的 `protocol + host`。
- 最终 URL 形如 `/uploads/<encoded-file-name>`。

## 8. 前台公开接口模块

### 公开文章 `routes/public/articles.js`

| 方法 | 路径 | 作用 |
| --- | --- | --- |
| `GET` | `/articles` | 已发布文章分页列表 |
| `GET` | `/articles/:slug` | 已发布文章详情 |

`GET /articles` 支持 query：

| query | 作用 |
| --- | --- |
| `page` | 页码，默认 1 |
| `pageSize` | 每页数量，最大 100 |
| `category` | 分类 slug |
| `tag` | 标签 slug |
| `keyword` | 搜索 title、summary、content_text |

列表排序：

```text
ORDER BY a.is_top DESC, a.published_at DESC, a.created_at DESC
```

详情逻辑：

```text
GET /articles/:slug
  -> 查 published 且未删除文章
  -> 查 tags
  -> view_count + 1
  -> mapArticleDetail()
```

### 公开分类/标签 `routes/public/taxonomy.js`

| 方法 | 路径 | 作用 |
| --- | --- | --- |
| `GET` | `/categories` | 分类列表，包含已发布文章数 |
| `GET` | `/tags` | 标签列表，包含已发布文章数 |

注意：

- 文章数只统计 `status = 'published'` 且未删除文章。
- 分类按 `sort ASC, created_at DESC`。
- 标签按 `name ASC`。

### 公开评论 `routes/public/comments.js`

| 方法 | 路径 | 作用 |
| --- | --- | --- |
| `GET` | `/articles/:id/comments` | 获取已审核通过评论树 |
| `POST` | `/articles/:id/comments` | 提交评论，状态为 `pending` |

获取评论：

```text
GET /articles/:id/comments
  -> 校验文章存在且 published
  -> SELECT status = approved
  -> buildCommentTree()
```

提交评论：

```text
POST /articles/:id/comments
  -> 校验文章存在且 allow_comment = 1
  -> 校验 nickname 和 content 必填
  -> parentId / replyToCommentId 存在时校验目标评论存在
  -> INSERT comment(status = pending)
  -> 返回 message 和 item
```

注意：

- 新提交评论不会立刻进入 `comment_count`，只有审核通过后才计数。
- 前端会把返回的 pending 评论本地展示为灰色，并提示等待审核。

## 9. 前后端接口调用关系

### 前台

```text
HomePage.vue
  -> GET /articles
  -> GET /categories
  -> GET /tags

CategoriesPage.vue
  -> GET /categories
  -> GET /articles?category=<slug>

TagsPage.vue
  -> GET /tags
  -> GET /articles?tag=<slug>

ArchivePage.vue
  -> GET /articles?pageSize=100

ArticleDetailPage.vue
  -> GET /articles/:slug
  -> GET /articles/:id/comments
  -> POST /articles/:id/comments
```

### 后台

```text
LoginPage.vue
  -> POST /admin/auth/login

AdminLayout.vue / auth store
  -> GET /admin/auth/me
  -> POST /admin/auth/logout
  -> POST /admin/auth/refresh

DashboardPage.vue
  -> GET /admin/articles?pageSize=1
  -> GET /admin/categories
  -> GET /admin/tags
  -> GET /admin/comments?pageSize=1
  -> GET /admin/media-files?pageSize=1

ArticlesPage.vue
  -> GET /admin/articles
  -> POST /admin/articles/:id/publish
  -> DELETE /admin/articles/:id

ArticleEditorPage.vue
  -> GET /admin/categories
  -> GET /admin/tags
  -> GET /admin/articles/:id
  -> POST /admin/articles
  -> PUT /admin/articles/:id
  -> POST /admin/media-files/upload
  -> POST /admin/media-files/editorjs

CategoriesPage.vue
  -> GET/POST/PUT/DELETE /admin/categories

TagsPage.vue
  -> GET/POST/PUT/DELETE /admin/tags

CommentsPage.vue
  -> GET /admin/comments
  -> PUT /admin/comments/:id/audit
  -> DELETE /admin/comments/:id

MediaPage.vue
  -> GET /admin/media-files
  -> POST /admin/media-files/upload
  -> DELETE /admin/media-files/:id
```

## 10. 常见改动入口

### 新增接口

1. 判断是前台公开接口还是后台管理接口。
2. 前台接口放 `src/routes/public/`。
3. 后台接口放 `src/routes/admin/`，并确认是否需要 `router.use(requireAdminAuth)`。
4. 复杂异步 handler 用 `asyncHandler` 包裹。
5. 业务错误使用 `throw new HttpError(status, message)`。
6. 如果返回 article，优先复用 `services/article-service.js` 的 mapper。

### 新增数据库字段

1. 修改 `src/db/init.js` 的建表 SQL。
2. SQLite 不会自动给已有表加新列；已有环境需要手写迁移 SQL 或临时处理。
3. 修改对应 route 的 `INSERT` / `UPDATE` / `SELECT`。
4. 修改 mapper，把 snake_case 转成前端 camelCase。
5. 前端对应页面表单和展示同步更新。

### 新增后台管理模块

1. 新建 `src/routes/admin/<module>.js`。
2. `router.use(requireAdminAuth)`。
3. 在 `src/app.js` 挂载到 `/admin/<module>`。
4. 前端 `web-front/src/api/` 增加封装。
5. 前端 `router/index.js` 和 `AdminLayout.vue` 增加页面和导航。

### 修改文章保存逻辑

后端入口：

- `routes/admin/articles.js`
  - `createArticle`
  - `updateArticle`
  - `validateArticlePayload`
  - `loadArticleDetail`

前端入口：

- `web-front/src/pages/admin/ArticleEditorPage.vue`
- `web-front/src/components/admin/EditorJsEditor.vue`
- `web-front/src/utils/editor.js`

### 修改评论审核逻辑

后端入口：

- `routes/public/comments.js`：用户提交评论。
- `routes/admin/comments.js`：管理员审核评论。
- `syncCommentCount()`：维护文章评论数。

前端入口：

- `web-front/src/pages/public/ArticleDetailPage.vue`
- `web-front/src/components/blog/CommentTree.vue`
- `web-front/src/pages/admin/CommentsPage.vue`

### 修改上传逻辑

后端入口：

- `middleware/upload.js`：文件类型、大小限制、文件名。
- `routes/admin/media-files.js`：持久化、去重、URL 生成、Editor.js 返回结构。

前端入口：

- `web-front/src/components/admin/MediaUploader.vue`
- `web-front/src/components/admin/EditorJsEditor.vue`
- `web-front/src/pages/admin/MediaPage.vue`

## 11. 调试建议

- `GET /health` 可确认服务是否启动。
- 默认数据库在 `api-server/data/blog.sqlite`。
- 上传文件默认在 `api-server/uploads/`。
- 本地接口默认 `http://localhost:3000`。
- 后台接口 401 时，先看 access token 是否过期，再看 refresh token 是否存在于 `admin_session`。
- 图片上传 URL 不对时，检查 `PUBLIC_BASE_URL` 和反向代理 header。
- 评论数不准时，检查评论状态变更是否经过 `PUT /admin/comments/:id/audit`，直接改库不会触发 `syncCommentCount()`。

## 12. 注意事项

- `src/db/init.js` 只负责首次建表，不是完整迁移系统。
- 文章和评论是软删除，查询时都要带 `deleted_at IS NULL`。
- 前台文章接口只返回 `published` 文章。
- 后台接口需要 `Authorization: Bearer <accessToken>`。
- refresh token 会轮换，前端每次 refresh 后要保存新 refresh token。
- `content_html` 当前由前端生成并提交，后端只存储，不做 HTML 清洗；如果开放更多用户输入 HTML，需要补安全策略。
- 媒体删除会尝试删除本地文件，但如果多个媒体记录复用同一文件或文件不存在，要注意异常处理策略。
