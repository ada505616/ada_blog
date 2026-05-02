<script setup>
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { fetchPublicArticle } from "../../api/articles";
import { createComment, fetchArticleComments } from "../../api/comments";
import { formatDate } from "../../utils/format";
import { setHead } from "../../utils/head";
import CommentTree from "../../components/blog/CommentTree.vue";

const route = useRoute();
const loading = ref(true);
const article = ref(null);
const comments = ref([]);
const errorMessage = ref("");
const feedback = ref("");
const replyTarget = ref(null);
const previewImage = ref(null);

const commentForm = ref({
  nickname: "",
  email: "",
  website: "",
  content: ""
});

const articleDate = computed(() => formatDate(article.value?.publishedAt || article.value?.createdAt));

watch(
  () => route.params.slug,
  () => loadPage(),
  { immediate: true }
);

async function loadPage() {
  loading.value = true;
  errorMessage.value = "";
  previewImage.value = null;

  try {
    const articleData = await fetchPublicArticle(route.params.slug);
    article.value = articleData;
    setHead({
      title: articleData.title,
      description: articleData.summary || articleData.title,
      image: articleData.coverImageUrl || undefined,
      type: "article"
    });
    const commentData = await fetchArticleComments(articleData.id);
    comments.value = commentData.items || [];
  } catch (error) {
    errorMessage.value = error.message || "加载失败";
  } finally {
    loading.value = false;
  }
}

function openImagePreview(src, alt = "") {
  if (!src) {
    return;
  }

  previewImage.value = {
    src,
    alt: alt || article.value?.title || "文章图片"
  };
}

function openContentImage(event) {
  const image = event.target?.closest?.(".article-content img");

  if (!image) {
    return;
  }

  openImagePreview(image.currentSrc || image.src, image.alt);
}

function closeImagePreview() {
  previewImage.value = null;
}

async function submitComment() {
  if (!article.value) {
    return;
  }

  feedback.value = "";

  try {
    const payload = {
      ...commentForm.value,
      parentId: replyTarget.value?.parentId || replyTarget.value?.id || null,
      replyToCommentId: replyTarget.value?.id || null
    };
    const response = await createComment(article.value.id, payload);
    addPendingComment(response.item || payload);
    commentForm.value = {
      nickname: "",
      email: "",
      website: "",
      content: ""
    };
    replyTarget.value = null;
  } catch (error) {
    feedback.value = error.message || "提交失败";
  }
}

function addPendingComment(comment) {
  const pendingComment = {
    ...comment,
    id: comment.id || `pending-${Date.now()}`,
    status: "pending",
    createdAt: comment.createdAt || new Date().toISOString(),
    replies: []
  };

  if (!pendingComment.parentId) {
    comments.value = [...comments.value, pendingComment];
    return;
  }

  comments.value = appendReply(comments.value, pendingComment.parentId, pendingComment);
}

function appendReply(items, parentId, reply) {
  return items.map((item) => {
    if (item.id === parentId) {
      return {
        ...item,
        replies: [...(item.replies || []), reply]
      };
    }

    if (item.replies?.length) {
      return {
        ...item,
        replies: appendReply(item.replies, parentId, reply)
      };
    }

    return item;
  });
}
</script>

<template>
  <section class="container article-page">
    <div v-if="loading" class="card empty-state">正在加载文章...</div>
    <div v-else-if="errorMessage" class="card empty-state">{{ errorMessage }}</div>
    <template v-else-if="article">
      <article class="article-shell card">
        <header class="article-header">
          <div class="meta-line">
            <span>{{ article.category?.name || "未分类" }}</span>
            <span>{{ articleDate }}</span>
            <span>{{ article.viewCount }} 次阅读</span>
          </div>
          <h1 class="article-title">{{ article.title }}</h1>
          <p v-if="article.summary" class="article-summary">{{ article.summary }}</p>
          <div class="tag-row">
            <RouterLink
              v-for="tag in article.tags"
              :key="tag.id"
              class="tag-link"
              :to="{ name: 'tag-detail', params: { slug: tag.slug } }"
            >
              # {{ tag.name }}
            </RouterLink>
          </div>
        </header>

        <div v-if="article.coverImageUrl" class="article-cover-wrap">
          <img
            class="article-cover"
            :src="article.coverImageUrl"
            :alt="article.title"
            @click="openImagePreview(article.coverImageUrl, article.title)"
          />
        </div>

        <div class="prose article-content" @click="openContentImage" v-html="article.contentHtml" />
      </article>

      <section class="comment-panel">
        <div class="page-title-row">
          <div>
            <p class="eyebrow">评论区</p>
            <h2 class="section-title">留言与回复</h2>
          </div>
        </div>

        <div class="comment-grid">
          <div class="stack">
            <CommentTree :comments="comments" :can-reply="article.allowComment" @reply="replyTarget = $event" />
          </div>

          <div v-if="article.allowComment" class="comment-form">
            <div v-if="replyTarget" class="reply-tip">
              正在回复：{{ replyTarget.nickname }}
              <button class="button button-secondary" type="button" @click="replyTarget = null">取消</button>
            </div>
            <div class="form-grid">
              <div class="field">
                <label>昵称</label>
                <input v-model="commentForm.nickname" class="input" placeholder="怎么称呼你" />
              </div>
              <div class="field">
                <label>邮箱</label>
                <input v-model="commentForm.email" class="input" placeholder="可选，用于通知" />
              </div>
              <div class="field">
                <label>网站</label>
                <input v-model="commentForm.website" class="input" placeholder="可选" />
              </div>
              <div class="field">
                <label>内容</label>
                <textarea v-model="commentForm.content" class="textarea" placeholder="写下你的看法" />
              </div>
              <button class="button button-primary" type="button" @click="submitComment">提交评论</button>
              <p v-if="feedback" class="muted">{{ feedback }}</p>
            </div>
          </div>
          <div v-else class="card empty-state">当前文章未开放评论。</div>
        </div>
      </section>
    </template>

    <div
      v-if="previewImage"
      class="image-preview"
      role="dialog"
      aria-modal="true"
      @click="closeImagePreview"
    >
      <button class="image-preview-close" type="button" aria-label="关闭大图" @click.stop="closeImagePreview">
        关闭
      </button>
      <img class="image-preview-img" :src="previewImage.src" :alt="previewImage.alt" @click.stop />
    </div>
  </section>
</template>

<style scoped>
.article-page {
  display: grid;
  gap: 36px;
  padding: 42px 0 64px;
}

.article-shell {
  width: min(100%, 980px);
  margin: 0 auto;
  display: grid;
  gap: 24px;
  min-width: 0;
  padding: 36px 40px;
}

.article-shell > * {
  min-width: 0;
}

.article-header {
  display: grid;
  gap: 12px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--line);
}

.article-cover-wrap {
  width: 100%;
}

.article-title {
  margin: 0;
  font-size: clamp(2.1rem, 4vw, 3.2rem);
  line-height: 1.15;
}

.article-summary {
  margin: 0;
  font-size: 1.05rem;
  color: var(--text-soft);
  line-height: 1.8;
}

.article-cover {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 10px;
  cursor: zoom-in;
}

.article-content {
  min-width: 0;
  max-width: 100%;
  overflow-x: hidden;
  font-size: 1.08rem;
  line-height: 1.85;
}

.article-content :deep(figure) {
  margin-block: 1.6em;
  margin-inline: 0;
}

.article-content :deep(figure[class^="image-width-"]) {
  width: var(--image-width, 100%);
  max-width: 100%;
  margin-inline: auto;
}

.article-content :deep(figure img),
.article-content :deep(p > img) {
  display: block;
  width: 100%;
  height: auto;
  cursor: zoom-in;
}

.article-content :deep(figcaption) {
  margin-top: 0.6em;
  color: var(--text-soft);
  font-size: 0.92em;
  font-style: italic;
  line-height: 1.6;
  text-align: center;
}

.article-content :deep(.code-wrap) {
  display: block;
  margin: 1.6em 0;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: #0f172a;
}

.article-content :deep(pre) {
  display: block;
  margin: 0;
  padding: 18px 20px;
  min-width: max-content;
  width: max-content;
  max-width: none;
  background: #0f172a;
  color: #e2e8f0;
}

.article-content :deep(code) {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 0.94em;
}

.article-content :deep(pre code) {
  display: block;
  min-width: max-content;
  white-space: pre;
  word-break: normal;
  overflow-wrap: normal;
}

.article-content :deep(:not(pre) > code) {
  display: inline;
  padding: 0.18em 0.42em;
  border-radius: 6px;
  background: rgba(15, 23, 42, 0.06);
  color: #0f172a;
  white-space: break-spaces;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.article-content :deep(table) {
  margin: 0;
  width: max-content;
  min-width: 560px;
  border-collapse: collapse;
}

.article-content :deep(.table-wrap) {
  display: block;
  margin: 1.6em 0;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;
  border: 1px solid var(--line);
  border-radius: 12px;
}

.article-content :deep(th),
.article-content :deep(td) {
  padding: 12px 14px;
  border-bottom: 1px solid var(--line);
  text-align: left;
  vertical-align: top;
}

.article-content :deep(th) {
  background: #f8fafc;
  color: var(--text-soft);
  font-weight: 600;
}

.article-content :deep(tr:last-child td) {
  border-bottom: 0;
}

.tag-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.tag-link {
  color: var(--text-soft);
}

.comment-grid {
  width: min(100%, 980px);
  margin: 0 auto;
  display: grid;
  gap: 18px;
}

.comment-form {
  padding: 18px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: #fbfcfd;
}

.reply-tip {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 16px;
  color: var(--text-soft);
}

.image-preview {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  padding: 52px 16px 24px;
  background: rgba(15, 23, 42, 0.86);
}

.image-preview-img {
  max-width: min(100%, 1120px);
  max-height: calc(100dvh - 96px);
  object-fit: contain;
  border-radius: 10px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.32);
}

.image-preview-close {
  position: fixed;
  top: 14px;
  right: 14px;
  border: 1px solid rgba(255, 255, 255, 0.42);
  border-radius: 999px;
  padding: 8px 14px;
  background: rgba(15, 23, 42, 0.72);
  color: #ffffff;
  font: inherit;
  cursor: pointer;
}

@media (max-width: 900px) {
  .article-page {
    overflow-x: hidden;
  }

  .article-shell {
    width: 100%;
    padding: 24px;
  }

  .article-content :deep(pre) {
    padding: 16px;
  }

  .article-content :deep(table) {
    min-width: 480px;
  }

  .article-content :deep(figure[class^="image-width-"]) {
    width: 100%;
  }

  .comment-grid {
    width: 100%;
  }
}
</style>
