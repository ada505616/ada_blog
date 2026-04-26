<script setup>
import { computed } from "vue";
import { RouterLink } from "vue-router";
import { formatDate, makeExcerpt } from "../../utils/format";

const props = defineProps({
  article: {
    type: Object,
    required: true
  },
  horizontal: {
    type: Boolean,
    default: false
  }
});

const coverStyle = computed(() =>
  props.article.coverImageUrl
    ? { backgroundImage: `linear-gradient(180deg, rgba(23, 19, 16, 0.08), rgba(23, 19, 16, 0.42)), url(${props.article.coverImageUrl})` }
    : null
);

const summaryText = computed(() => props.article.summary || makeExcerpt(props.article.contentText, props.horizontal ? 88 : 110));
const visibleTags = computed(() => (props.horizontal ? (props.article.tags || []).slice(0, 2) : props.article.tags || []));
</script>

<template>
  <article class="card article-card" :class="{ horizontal }">
    <div class="cover" :style="coverStyle">
      <span class="cover-badge">{{ article.category?.name || "未分类" }}</span>
    </div>
    <div class="body">
      <div class="meta-line">
        <span>{{ article.author?.nickname || article.author?.username }}</span>
        <span>{{ formatDate(article.publishedAt || article.createdAt) }}</span>
        <span>{{ article.commentCount }} 条评论</span>
      </div>
      <RouterLink :to="{ name: 'article-detail', params: { slug: article.slug } }">
        <h3>{{ article.title }}</h3>
      </RouterLink>
      <p class="summary muted">{{ summaryText }}</p>
      <div v-if="visibleTags.length" class="tags-row">
        <RouterLink
          v-for="tag in visibleTags"
          :key="tag.id"
          class="pill-link"
          :to="{ name: 'tag-detail', params: { slug: tag.slug } }"
        >
          # {{ tag.name }}
        </RouterLink>
      </div>
    </div>
  </article>
</template>

<style scoped>
.article-card {
  overflow: hidden;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.article-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.08);
}

.article-card.horizontal {
  display: grid;
  grid-template-columns: 216px minmax(0, 1fr);
  align-items: stretch;
  min-height: 180px;
}

.cover {
  min-height: 180px;
  padding: 18px;
  background:
    linear-gradient(135deg, rgba(219, 234, 254, 0.9), rgba(191, 219, 254, 0.72)),
    linear-gradient(180deg, rgba(255, 255, 255, 0.12), rgba(30, 41, 59, 0.12));
  background-size: cover;
  background-position: center;
}

.cover-badge {
  display: inline-flex;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.96);
  color: var(--primary);
  font-size: 13px;
}

.body {
  padding: 24px;
}

.body h3 {
  margin: 10px 0 8px;
  font-size: 1.4rem;
  line-height: 1.32;
}

.summary {
  margin: 0;
  line-height: 1.75;
}

.tags-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 14px;
}

.article-card.horizontal .cover {
  min-height: 100%;
  padding: 16px;
}

.article-card.horizontal .body {
  display: grid;
  align-content: center;
  padding: 18px 20px;
}

.article-card.horizontal .body h3 {
  margin: 8px 0 8px;
  font-size: 1.16rem;
  line-height: 1.38;
}

.article-card.horizontal .summary {
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  font-size: 0.95rem;
  line-height: 1.7;
}

.article-card.horizontal .tags-row {
  margin-top: 12px;
  gap: 8px;
}

.article-card.horizontal :deep(.pill-link) {
  padding: 7px 10px;
  font-size: 0.84rem;
}

@media (max-width: 900px) {
  .article-card.horizontal {
    grid-template-columns: 1fr;
  }

  .article-card.horizontal .cover {
    min-height: 180px;
  }
}
</style>
