# Ada Blog Web Front Integration

这份文档约定 `web-front` 与 `api- server` 的联调方式，默认后端本地地址为：

- `http://localhost:3000`

## 1. 环境约定

前端建议准备：

```env
VITE_API_BASE_URL=http://localhost:3000
```

如果你不是 Vite，也保持同样的语义即可。

## 2. 认证流程

### 登录

- 请求：`POST /admin/auth/login`
- `Content-Type: application/json`

```json
{
  "username": "admin",
  "password": "admin123456"
}
```

返回：

```json
{
  "accessToken": "jwt-access-token",
  "refreshToken": "refresh-token",
  "admin": {
    "id": 1,
    "username": "admin",
    "nickname": "Administrator",
    "email": null,
    "avatarUrl": null,
    "lastLoginAt": null
  }
}
```

### 前端存储建议

- `accessToken` 放内存或状态管理里
- `refreshToken` 放 `localStorage`
- 所有后台接口都带：`Authorization: Bearer <accessToken>`

### 获取当前登录态

- 请求：`GET /admin/auth/me`

### 刷新 token

- 请求：`POST /admin/auth/refresh`

```json
{
  "refreshToken": "refresh-token"
}
```

建议前端做法：

- 后台接口返回 `401` 时触发一次刷新
- 刷新成功后重放原请求
- 刷新失败则清空本地登录态并回到登录页

### 退出登录

- 请求：`POST /admin/auth/logout`

```json
{
  "refreshToken": "refresh-token"
}
```

## 3. 通用请求头

后台接口统一：

```http
Authorization: Bearer <accessToken>
Content-Type: application/json
```

文件上传例外，使用 `multipart/form-data`，不要手动写 `Content-Type`，让浏览器自动带 boundary。

## 4. 文章编辑器数据结构

后端文章表保留三份内容：

- `contentJson`: Editor.js 原始结构数据
- `contentHtml`: 渲染后的 HTML
- `contentText`: 纯文本内容

前端保存文章时，建议直接提交：

```json
{
  "title": "Node.js + SQLite 搭建博客接口",
  "slug": "nodejs-sqlite-blog-api",
  "summary": "这是一篇关于博客后台接口设计的文章。",
  "coverImageUrl": "http://localhost:3000/uploads/xxx-cover.png",
  "categoryId": 1,
  "contentType": "editorjs",
  "contentJson": {
    "time": 1710000000000,
    "blocks": [
      {
        "type": "paragraph",
        "data": {
          "text": "正文内容"
        }
      }
    ],
    "version": "2.30.0"
  },
  "contentHtml": "<p>正文内容</p>",
  "contentText": "正文内容",
  "status": "draft",
  "isTop": false,
  "allowComment": true,
  "tagIds": [1, 2]
}
```

## 5. 图片上传联调

后端已经开放静态资源目录：

- 访问路径：`/uploads/*`

例如上传成功返回：

- `http://localhost:3000/uploads/1714040000000-a1b2c3d4e5f6.png`

### 后台通用上传接口

- 请求：`POST /admin/media-files/upload`
- `Content-Type: multipart/form-data`
- 表单字段：`file`

返回：

```json
{
  "item": {
    "id": 3,
    "fileName": "1714040000000-a1b2c3d4e5f6.png",
    "originalName": "cover.png",
    "fileExt": "png",
    "mimeType": "image/png",
    "fileSize": 245122,
    "storageType": "local",
    "fileUrl": "http://localhost:3000/uploads/1714040000000-a1b2c3d4e5f6.png",
    "filePath": "/abs/path/to/uploads/1714040000000-a1b2c3d4e5f6.png",
    "width": 1200,
    "height": 628,
    "hash": "sha256-hash",
    "uploaderId": 1,
    "createdAt": "2026-04-23T05:00:00.000Z",
    "updatedAt": "2026-04-23T05:00:00.000Z"
  }
}
```

前端常见用法：

- 封面上传后，把 `item.fileUrl` 回填到文章表单的 `coverImageUrl`
- 正文图片上传后，把 `item.fileUrl` 写入编辑器块数据

### Editor.js 图片接口

为了少写一层适配，后端另外提供了：

- 请求：`POST /admin/media-files/editorjs`

返回：

```json
{
  "success": 1,
  "file": {
    "url": "http://localhost:3000/uploads/1714040000000-a1b2c3d4e5f6.png",
    "name": "content.png",
    "size": 245122,
    "mimeType": "image/png",
    "width": 1200,
    "height": 628
  },
  "mediaFile": {
    "id": 3,
    "fileName": "1714040000000-a1b2c3d4e5f6.png"
  }
}
```

如果你在前端用的是 `@editorjs/image`，可以直接把 `byFile` 指向这个接口。

示例：

```ts
const imageToolConfig = {
  uploader: {
    async uploadByFile(file: File) {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE_URL}/admin/media-files/editorjs`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        body: formData
      });

      return response.json();
    }
  }
};
```

### 媒体库列表

- 请求：`GET /admin/media-files?page=1&pageSize=20&keyword=cover`

返回：

```json
{
  "items": [],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 0
  }
}
```

可用于：

- 后台素材管理页
- 封面选择弹窗
- 正文图片复用

### 删除媒体

- 请求：`DELETE /admin/media-files/:id`

删除后会同时删数据库记录和本地文件。

## 6. 后台管理接口约定

### 分类

- `GET /admin/categories`
- `POST /admin/categories`
- `PUT /admin/categories/:id`
- `DELETE /admin/categories/:id`

分类返回项：

```json
{
  "id": 1,
  "name": "技术",
  "slug": "tech",
  "description": "技术文章",
  "sort": 0,
  "status": 1,
  "createdAt": "2026-04-23T05:00:00.000Z",
  "updatedAt": "2026-04-23T05:00:00.000Z"
}
```

### 标签

- `GET /admin/tags`
- `POST /admin/tags`
- `PUT /admin/tags/:id`
- `DELETE /admin/tags/:id`

### 文章列表

- `GET /admin/articles?page=1&pageSize=10&status=draft&keyword=node`

### 创建文章

- `POST /admin/articles`

### 获取文章详情

- `GET /admin/articles/:id`

详情里会带：

- `category`
- `tags`
- `contentJson`
- `contentHtml`
- `contentText`

### 更新文章

- `PUT /admin/articles/:id`

### 发布文章

- `POST /admin/articles/:id/publish`

### 删除文章

- `DELETE /admin/articles/:id`

## 7. 前台展示接口约定

### 获取文章列表

- `GET /articles?page=1&pageSize=10`
- `GET /articles?page=1&pageSize=10&category=tech`
- `GET /articles?page=1&pageSize=10&tag=nodejs`
- `GET /articles?page=1&pageSize=10&keyword=sqlite`

### 获取文章详情

- `GET /articles/:slug`

这里的参数是 `slug`，不是文章 `id`。例如：

- `GET /articles/nodejs-sqlite-blog-api`

### 获取分类和标签

- `GET /categories`
- `GET /tags`

### 评论列表和发表评论

- `GET /articles/:id/comments`
- `POST /articles/:id/comments`

发表评论请求体：

```json
{
  "parentId": null,
  "replyToCommentId": null,
  "nickname": "访客A",
  "email": "visitor@example.com",
  "website": "https://example.com",
  "content": "写得很好"
}
```

新评论默认是 `pending`，前台提交后应提示：

- “评论已提交，等待审核”

## 8. 错误处理约定

后端错误返回统一形态：

```json
{
  "message": "具体错误信息"
}
```

前端建议：

- `400`：表单校验提示
- `401`：尝试刷新 token
- `403`：无权限或评论关闭
- `404`：资源不存在
- `409`：资源冲突，例如分类仍被文章使用
- `500`：统一错误提示

## 9. 最小前端封装建议

建议封装两个请求实例：

- `publicRequest`：不带 token，给前台页面用
- `adminRequest`：自动附带 `Authorization`，给后台管理页用

至少准备这些前端模块：

- `auth.ts`
- `articles.ts`
- `categories.ts`
- `tags.ts`
- `comments.ts`
- `media.ts`

其中 `media.ts` 建议提供：

```ts
export async function uploadMedia(file: File) {}
export async function uploadEditorImage(file: File) {}
export async function fetchMediaList(params?: { page?: number; pageSize?: number; keyword?: string }) {}
export async function deleteMedia(id: number) {}
```
