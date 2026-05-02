# Ada Blog 前端项目说明

本文档面向新接手 `web-front` 的同事，用来快速理解项目结构、模块职责、调用关系和常见改代码入口。前端是一个 Vue 3 单页应用，同时包含博客前台和后台管理台。

## 1. 技术栈与启动方式

- 框架：Vue 3 + Composition API
- 构建：Vite
- 路由：Vue Router
- 状态：Pinia
- HTTP：Axios
- 正文编辑器：Editor.js
- 样式：全局 CSS + Vue scoped CSS

常用命令：

```bash
cd web-front
npm install
npm run dev
npm run build
```

环境变量：

| 变量 | 作用 | 默认/示例 |
| --- | --- | --- |
| `VITE_APP_BASE_PATH` | 前端部署子路径，传给 Vite `base` 和 router history | `/`，生产为 `/blog/` |
| `VITE_API_BASE_URL` | API 服务地址，Axios baseURL | `http://localhost:3000` |
| `VITE_API_PROXY_TARGET` | 本地 Vite `/api`、`/uploads` 代理目标 | `http://localhost:3000` |
| `VITE_API_PROXY_REWRITE` | 是否把 `/api` 前缀转发时去掉 | 默认去掉 |

相关文件：

- `package.json`：脚本和依赖
- `vite.config.js`：Vite base、端口、代理
- `.env.example`：本地环境变量模板

## 2. 目录职责

```text
src/
  api/                 Axios 实例和接口封装
  assets/              静态资源
  components/admin/    后台复用组件
  components/blog/     前台博客复用组件
  layouts/             前台/后台布局
  pages/admin/         后台管理页面
  pages/public/        前台展示页面
  router/              路由表与路由守卫
  stores/              Pinia 状态
  styles/              全局样式
  utils/               格式化、SEO、Editor.js 转换工具
```

入口链路：

```text
index.html
  -> src/main.js
    -> App.vue
      -> router-view
        -> PublicLayout.vue 或 AdminLayout.vue
          -> 各页面组件
            -> api/*.js
              -> api/http.js
                -> api-server
```

## 3. 路由与页面关系

路由定义在 `src/router/index.js`。

### 前台路由

| 路由 | name | 页面 | 作用 |
| --- | --- | --- | --- |
| `/` | `home` | `pages/public/HomePage.vue` | 首页、最新文章、分类、标签、近期文章 |
| `/article/:slug` | `article-detail` | `pages/public/ArticleDetailPage.vue` | 文章详情、正文、评论 |
| `/categories` | `categories` | `pages/public/CategoriesPage.vue` | 分类列表和全部分类文章 |
| `/categories/:slug` | `category-detail` | `pages/public/CategoriesPage.vue` | 某分类文章 |
| `/tags` | `tags` | `pages/public/TagsPage.vue` | 标签列表和全部标签文章 |
| `/tags/:slug` | `tag-detail` | `pages/public/TagsPage.vue` | 某标签文章 |
| `/archive` | `archive` | `pages/public/ArchivePage.vue` | 按月份归档文章 |
| `/about` | `about` | `pages/public/AboutPage.vue` | 关于页 |

前台统一布局是 `layouts/PublicLayout.vue`，负责顶部导航、移动端菜单、页脚和前台 `RouterView`。

### 后台路由

| 路由 | name | 页面 | 作用 |
| --- | --- | --- | --- |
| `/admin/login` | `admin-login` | `pages/admin/LoginPage.vue` | 管理员登录 |
| `/admin` | `admin-dashboard` | `pages/admin/DashboardPage.vue` | 后台仪表盘 |
| `/admin/articles` | `admin-articles` | `pages/admin/ArticlesPage.vue` | 文章列表、筛选、发布、删除 |
| `/admin/articles/new` | `admin-article-create` | `pages/admin/ArticleEditorPage.vue` | 新建文章 |
| `/admin/articles/:id/edit` | `admin-article-edit` | `pages/admin/ArticleEditorPage.vue` | 编辑文章 |
| `/admin/categories` | `admin-categories` | `pages/admin/CategoriesPage.vue` | 分类管理 |
| `/admin/tags` | `admin-tags` | `pages/admin/TagsPage.vue` | 标签管理 |
| `/admin/comments` | `admin-comments` | `pages/admin/CommentsPage.vue` | 评论审核 |
| `/admin/media` | `admin-media` | `pages/admin/MediaPage.vue` | 媒体文件管理 |

后台统一布局是 `layouts/AdminLayout.vue`，负责顶部管理区、后台导航、登录用户信息、退出登录和后台 `RouterView`。

### 路由守卫

`router.beforeEach` 做两件事：

- 后台路由 `meta.requiresAuth`：未登录时跳转到 `admin-login`，并携带 `redirect`。
- 登录页 `meta.guestOnly`：已登录时跳转到后台首页。

`router.afterEach` 调用 `utils/head.js` 的 `setHead`，根据路由 `meta.title` 更新页面标题和 SEO meta。

## 4. HTTP 与鉴权调用关系

核心文件是 `src/api/http.js`。

```text
publicHttp
  -> 无 token，给前台接口和登录/刷新 token 使用

adminHttp
  -> 请求拦截器读取 localStorage accessToken，写入 Authorization
  -> 响应 401 时自动用 refreshToken 调 /admin/auth/refresh
  -> 刷新成功后重放原请求
  -> 刷新失败时清理本地登录态并跳回 /admin/login
```

本地存储 key：

| key | 内容 |
| --- | --- |
| `ada_blog_access_token` | 后台 access token |
| `ada_blog_refresh_token` | refresh token |
| `ada_blog_admin` | 当前管理员信息 |

Pinia store：`src/stores/auth.js`

- `login(form)`：调用 `api/auth.js` 的 `loginAdmin`，写入 token 和 admin。
- `fetchMe()`：获取当前管理员和会话列表。
- `logout()`：调用后端退出并清理本地状态。
- `isAuthenticated`：基于 accessToken 判断是否登录。

## 5. API 封装与后端接口映射

所有页面原则上不直接写 axios URL，而是调用 `src/api/*.js`。

### `api/articles.js`

| 函数 | 后端接口 | 调用页面 |
| --- | --- | --- |
| `fetchPublicArticles(params)` | `GET /articles` | 首页、分类页、标签页、归档页 |
| `fetchPublicArticle(slug)` | `GET /articles/:slug` | 文章详情页 |
| `fetchAdminArticles(params)` | `GET /admin/articles` | 仪表盘、文章管理 |
| `fetchAdminArticle(id)` | `GET /admin/articles/:id` | 文章编辑页 |
| `createArticle(payload)` | `POST /admin/articles` | 新建文章 |
| `updateArticle(id, payload)` | `PUT /admin/articles/:id` | 编辑文章 |
| `publishArticle(id)` | `POST /admin/articles/:id/publish` | 文章管理 |
| `deleteArticle(id)` | `DELETE /admin/articles/:id` | 文章管理 |

### `api/taxonomy.js`

| 函数 | 后端接口 | 调用页面 |
| --- | --- | --- |
| `fetchCategories()` | `GET /categories` | 首页、分类页 |
| `fetchTags()` | `GET /tags` | 首页、标签页 |
| `fetchAdminCategories()` | `GET /admin/categories` | 文章编辑、分类管理、仪表盘 |
| `createCategory(payload)` | `POST /admin/categories` | 分类管理 |
| `updateCategory(id, payload)` | `PUT /admin/categories/:id` | 分类管理 |
| `deleteCategory(id)` | `DELETE /admin/categories/:id` | 分类管理 |
| `fetchAdminTags()` | `GET /admin/tags` | 文章编辑、标签管理、仪表盘 |
| `createTag(payload)` | `POST /admin/tags` | 标签管理 |
| `updateTag(id, payload)` | `PUT /admin/tags/:id` | 标签管理 |
| `deleteTag(id)` | `DELETE /admin/tags/:id` | 标签管理 |

### `api/comments.js`

| 函数 | 后端接口 | 调用页面 |
| --- | --- | --- |
| `fetchArticleComments(articleId)` | `GET /articles/:id/comments` | 文章详情页 |
| `createComment(articleId, payload)` | `POST /articles/:id/comments` | 文章详情页 |
| `fetchAdminComments(params)` | `GET /admin/comments` | 评论管理、仪表盘 |
| `auditComment(id, status)` | `PUT /admin/comments/:id/audit` | 评论管理 |
| `deleteComment(id)` | `DELETE /admin/comments/:id` | 评论管理 |

### `api/media.js`

| 函数 | 后端接口 | 调用页面/组件 |
| --- | --- | --- |
| `fetchMediaFiles(params)` | `GET /admin/media-files` | 媒体管理、仪表盘 |
| `uploadMedia(file)` | `POST /admin/media-files/upload` | `MediaUploader.vue` |
| `uploadEditorImage(file)` | `POST /admin/media-files/editorjs` | 当前未直接使用，Editor.js 组件内有自定义上传 |
| `deleteMediaFile(id)` | `DELETE /admin/media-files/:id` | 媒体管理 |

### `api/auth.js`

| 函数 | 后端接口 | 调用位置 |
| --- | --- | --- |
| `loginAdmin(payload)` | `POST /admin/auth/login` | `stores/auth.js` |
| `fetchAdminMe()` | `GET /admin/auth/me` | `stores/auth.js`、`AdminLayout.vue` |
| `logoutAdmin(refreshToken)` | `POST /admin/auth/logout` | `stores/auth.js` |

## 6. 前台模块说明

### 首页 `pages/public/HomePage.vue`

调用关系：

```text
HomePage.vue
  -> fetchPublicArticles({ pageSize: 7, keyword })
  -> fetchCategories()
  -> fetchTags()
  -> ArticleCard.vue
```

职责：

- 展示最新文章列表。
- 展示搜索框、分类、标签和近期文章。
- 搜索只重新调用文章列表接口，不改路由。

### 文章卡片 `components/blog/ArticleCard.vue`

职责：

- 展示文章封面、标题、摘要、作者、日期、评论数、标签。
- 支持 `horizontal` 横向列表模式。
- 封面使用真实 `<img>`，带 lazy load、async decode、加载占位和淡入效果。

### 文章详情 `pages/public/ArticleDetailPage.vue`

调用关系：

```text
ArticleDetailPage.vue
  -> fetchPublicArticle(slug)
  -> setHead(article SEO)
  -> fetchArticleComments(article.id)
  -> CommentTree.vue
  -> createComment(article.id, payload)
```

职责：

- 加载文章详情并用 `v-html` 渲染后端返回的 `contentHtml`。
- 点击正文图片打开大图预览。
- 加载审核通过的评论树。
- 提交评论后不重新拉取接口，而是把后端返回的 `pending` 评论插入本地评论树，用灰色展示并提示“（评论已提交，请等待审核）”。
- PC 端正文图片支持 `50% / 80% / 100%` 宽度；移动端统一 `100%`。

### 评论树 `components/blog/CommentTree.vue`

职责：

- 递归渲染评论和回复。
- 点击回复按钮把目标评论 emit 给文章详情页。
- `status === "pending"` 的评论用灰色展示，并显示审核提示。

### 分类和标签页

`CategoriesPage.vue` 和 `TagsPage.vue` 结构一致：

```text
watch(route.params.slug)
  -> 同时拉取 taxonomy 列表和文章列表
  -> 用 ArticleCard.vue 展示文章
```

区别：

- 分类页按 `category` query 调 `GET /articles`。
- 标签页按 `tag` query 调 `GET /articles`。

### 归档页 `ArchivePage.vue`

调用 `fetchPublicArticles({ pageSize: 100 })`，再用 `groupArticlesByMonth` 按月份分组。

## 7. 后台模块说明

### 后台布局 `layouts/AdminLayout.vue`

职责：

- 展示后台导航、当前页面标题、管理员信息和退出登录。
- 挂载后台页面 `RouterView`。
- `onMounted` 时如果本地有 token 但没有 admin 信息，会调用 `authStore.fetchMe()` 补齐。
- 当前 topbar 不做 sticky，随页面内容滚动。

### 登录页 `pages/admin/LoginPage.vue`

调用关系：

```text
LoginPage.vue
  -> authStore.login(form)
    -> loginAdmin()
      -> POST /admin/auth/login
```

登录成功后跳转到 `route.query.redirect`，没有则进入后台首页。

安全约定：

- 登录页不预填管理员用户名或密码。
- 管理员账号来自后端 `.env` 中的 `ADMIN_DEFAULT_USERNAME` 和 `ADMIN_DEFAULT_PASSWORD`，不要在前端代码或公开文档中写真实账号密码。

### 仪表盘 `pages/admin/DashboardPage.vue`

并行调用：

- `fetchAdminArticles({ pageSize: 1 })`
- `fetchAdminCategories()`
- `fetchAdminTags()`
- `fetchAdminComments({ pageSize: 1 })`
- `fetchMediaFiles({ pageSize: 1 })`

用途是读取各模块总数并通过 `StatCard.vue` 展示。

### 文章管理 `pages/admin/ArticlesPage.vue`

职责：

- 按状态和关键词筛选文章。
- 支持新建、编辑、发布、删除。
- 删除调用后端软删除接口。

调用关系：

```text
ArticlesPage.vue
  -> fetchAdminArticles(filters)
  -> publishArticle(id)
  -> deleteArticle(id)
```

### 文章编辑 `pages/admin/ArticleEditorPage.vue`

调用关系：

```text
ArticleEditorPage.vue
  -> fetchAdminCategories()
  -> fetchAdminTags()
  -> edit mode: fetchAdminArticle(id)
  -> EditorJsEditor.save()
  -> editorDataToHtml(contentJson)
  -> editorDataToText(contentJson)
  -> createArticle(payload) 或 updateArticle(id, payload)
```

职责：

- 管理文章基础字段：标题、slug、摘要、分类、状态、置顶、评论开关、封面、标签。
- 使用 `EditorJsEditor.vue` 编辑正文。
- 保存时同时提交三份内容：
  - `contentJson`：Editor.js 原始 JSON
  - `contentHtml`：前台直接渲染用 HTML
  - `contentText`：搜索和摘要用纯文本
- 保存按钮位于编辑器下方，方便长文编辑后直接保存。

### Editor.js 组件 `components/admin/EditorJsEditor.vue`

职责：

- 初始化 Editor.js 工具：paragraph、header、list、code、table、image。
- 自定义 `SizedImageTool` 包装 `@editorjs/image`。
- 图片上传走 `POST /admin/media-files/editorjs`，请求头带 `Authorization`。
- 图片块支持 `50% / 80% / 100%` 三档显示比例，保存到 `block.data.widthPercent`。
- 旧文章图片兼容 `file.url`、`url`、`fileUrl`。
- 旧文章编辑时图片接近视口再加载，避免大量图片一次性加载导致编辑页卡顿。

### 媒体上传 `components/admin/MediaUploader.vue`

职责：

- 封装普通媒体上传按钮。
- 选择文件后调用 `uploadMedia(file)`。
- 上传成功 emit `uploaded`，上传失败 emit `error`。

使用位置：

- `ArticleEditorPage.vue`：上传封面。
- `MediaPage.vue`：上传媒体库图片。

### 分类管理 `pages/admin/CategoriesPage.vue`

职责：

- 列表展示分类。
- 创建、编辑、删除分类。
- 后端删除分类前会检查该分类是否仍有关联文章。

### 标签管理 `pages/admin/TagsPage.vue`

职责：

- 列表展示标签。
- 创建、编辑、删除标签。
- 标签颜色用 `input type="color"` 色盘选择。
- 色盘旁展示当前色块和十六进制色号。
- 编辑已有标签时会规范化非法颜色，默认回退到 `#1f7a64`。

### 评论管理 `pages/admin/CommentsPage.vue`

职责：

- 按状态筛选评论。
- 审核状态支持：通过 `approved`、拒绝 `rejected`、垃圾 `spam`。
- 删除评论。

调用关系：

```text
CommentsPage.vue
  -> fetchAdminComments(filters)
  -> auditComment(id, status)
  -> deleteComment(id)
```

### 媒体管理 `pages/admin/MediaPage.vue`

职责：

- 搜索和展示媒体文件。
- 上传图片。
- 删除媒体文件。
- 展示图片预览、URL、上传时间。

## 8. 内容数据流

### 写文章

```text
管理员进入 /admin/articles/new 或 /admin/articles/:id/edit
  -> ArticleEditorPage 加载分类/标签/文章详情
  -> EditorJsEditor 编辑 contentJson
  -> saveArticle()
    -> editorRef.save() 得到 contentJson
    -> editorDataToHtml(contentJson) 得到 contentHtml
    -> editorDataToText(contentJson) 得到 contentText
    -> createArticle/updateArticle
      -> api-server 保存 article 和 article_tag
```

### 看文章

```text
用户进入 /article/:slug
  -> ArticleDetailPage 调 fetchPublicArticle(slug)
  -> 后端返回 article.contentHtml
  -> 前端 v-html 渲染正文
  -> fetchArticleComments(article.id) 加载 approved 评论
```

### 评论提交

```text
用户提交评论
  -> createComment(article.id, payload)
  -> 后端写入 pending 评论并返回 item
  -> 前端把 item 插入 comments
  -> CommentTree 以灰色显示 pending 评论和审核提示
```

### 图片上传

封面和媒体库：

```text
MediaUploader.vue
  -> uploadMedia(file)
  -> POST /admin/media-files/upload
  -> 返回 fileUrl
```

正文图片：

```text
EditorJsEditor.vue image uploader
  -> POST /admin/media-files/editorjs
  -> 返回 Editor.js image tool 需要的 { success, file: { url } }
  -> 图片 URL 存到 contentJson.blocks[].data.file.url
```

## 9. 全局样式和滚动

全局样式在 `src/styles/base.css`。

当前滚动策略：

- `html` 和 `body` 高度固定，并禁止滚动。
- `#app` 是真实滚动容器，`height: 100dvh; overflow-y: auto;`。
- 这样可以避免移动端下拉时露出 body 外层白边。

公共样式：

- `.card`：卡片基础样式。
- `.button`、`.button-primary`、`.button-secondary`、`.button-danger`：按钮。
- `.input`、`.textarea`、`.select`：表单控件。
- `.toolbar`：按钮组。
- `.table`、`.table-wrap`：后台表格。
- `.prose`：文章正文基础排版。

## 10. 近期关键改动说明（2026-05-02）

本节记录最近一次前端体验优化的改动入口。新同事排查相关问题时，优先从这里定位代码。

### 后台文章编辑保存按钮

代码位置：`src/pages/admin/ArticleEditorPage.vue`

- 保存按钮已经移动到编辑器下方的 `.editor-actions` 区域。
- 保存逻辑仍然走 `saveArticle()`，创建和更新接口没有变化。
- 这样编辑长文章时，用户不需要滚回页面顶部才能保存。

### 编辑器图片展示、比例和滚动性能

代码位置：

- `src/components/admin/EditorJsEditor.vue`
- `src/utils/editor.js`
- `src/pages/public/ArticleDetailPage.vue`

后台编辑器侧：

- `EditorJsEditor.vue` 使用 `SizedImageTool` 包装 `@editorjs/image`。
- 图片块支持 `50%`、`80%`、`100%` 三个固定比例，默认是 `100%`。
- 选中的比例保存在 Editor.js block 的 `data.widthPercent` 中，不需要新增接口字段。
- 兼容旧文章图片数据：`data.file.url`、`data.url`、`data.fileUrl` 都会尝试读取，避免编辑旧文章时图片不显示。
- 为了减少多图文章编辑时的卡顿，旧图片会先移除真实 `src`，等图片接近视口后再通过 `IntersectionObserver` 恢复加载。

前台展示侧：

- `utils/editor.js` 在生成正文 HTML 时，会给图片外层 `figure` 输出 `image-width-50`、`image-width-80`、`image-width-100` 类名，并写入 `--image-width-percent`。
- `ArticleDetailPage.vue` 负责最终样式：PC 端按比例展示，移动端统一恢复为 `100%` 宽度。
- 只影响前台文章详情正文图片展示，不影响接口协议。

### 文章列表封面渐进加载

代码位置：`src/components/blog/ArticleCard.vue`

- 文章卡片封面改为真实 `<img>` 元素加载，使用 `loading="lazy"` 和 `decoding="async"`。
- 图片加载完成前展示占位背景和轻量 shimmer，加载成功后再淡入封面图。
- 目标是避免弱网下用户看到封面图从上到下一点点绘制完成。

### 标签颜色可视化选择

代码位置：`src/pages/admin/TagsPage.vue`

- 标签创建和编辑表单中的颜色输入改成 `input type="color"`。
- 旁边展示颜色预览块和当前十六进制色号。
- 提交给后端的字段仍然是 `color`，接口不需要调整。

### 页面滚动容器和后台头部

代码位置：

- `src/styles/base.css`
- `src/layouts/AdminLayout.vue`

滚动策略：

- `html`、`body` 禁止滚动。
- `#app` 是唯一页面滚动容器，避免页面下拉时顶部露出 body 白边。

后台头部：

- 后台管理页的 head 区域不再 sticky，会跟随内容一起滚动。

### 评论提交后的待审核展示

代码位置：

- `src/pages/public/ArticleDetailPage.vue`
- `src/components/blog/CommentTree.vue`

行为说明：

- 用户提交评论后，如果后端返回了新评论对象，前端会直接把这条评论插入当前评论区。
- 待审核评论会以灰色文本展示。
- 评论内容下方会换行展示 `（评论已提交，请等待审核）`。
- 不再只弹出提示，而是让用户能在评论区看到自己刚提交的内容。

## 11. 常见改动入口

### 新增前台页面

1. 在 `src/pages/public/` 新建页面。
2. 在 `src/router/index.js` 的 PublicLayout children 中加路由。
3. 如需导航入口，改 `layouts/PublicLayout.vue` 的 `navItems`。
4. 如需接口，优先在 `src/api/*.js` 封装函数。

### 新增后台页面

1. 在 `src/pages/admin/` 新建页面。
2. 在 `src/router/index.js` 的 AdminLayout children 中加路由，并设置 `meta.title`。
3. 在 `layouts/AdminLayout.vue` 的 `navItems` 中加导航。
4. 后台接口必须走 `adminHttp`，不要直接用 `publicHttp`。

### 新增后端字段并在前端展示

1. 后端路由或 service map 函数先返回新字段。
2. 前端对应 `api/*.js` 通常无需改，页面直接使用字段。
3. 如果字段参与表单，检查创建、编辑、重置、回填四个路径。
4. 如果字段是内容正文相关，检查 `utils/editor.js` 的 HTML/Text 转换。

### 修改文章正文渲染

后台编辑器显示：

- 改 `components/admin/EditorJsEditor.vue`。

保存到前台 HTML：

- 改 `utils/editor.js` 的 `editorDataToHtml`。

前台文章页样式：

- 改 `pages/public/ArticleDetailPage.vue` 的 `.article-content` 样式。

### 修改登录和 token 行为

- 前端请求拦截和刷新：`api/http.js`
- 前端状态：`stores/auth.js`
- 登录页：`pages/admin/LoginPage.vue`

## 12. 注意事项

- 不要在页面组件里重复写接口 URL，优先加到 `src/api/*.js`。
- 后台接口统一使用 `adminHttp`，这样才能自动带 token 和刷新 token。
- `ArticleDetailPage.vue` 用 `v-html` 渲染后端存储的 `contentHtml`；如果引入用户可控 HTML，需要同步考虑 XSS 风险。
- Editor.js 图片比例只影响前台 PC 端展示，移动端会强制 `100%`。
- 当前没有单元测试，改动后至少跑 `npm run build`。
