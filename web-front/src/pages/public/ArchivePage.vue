<script setup>
import { onMounted, ref } from "vue";
import { fetchPublicArticles } from "../../api/articles";
import { formatDate, groupArticlesByMonth } from "../../utils/format";

const groups = ref([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const data = await fetchPublicArticles({ pageSize: 100 });
    groups.value = groupArticlesByMonth(data.items || []);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <section class="container page-pad stack">
    <div class="page-title-row">
      <div>
        <p class="eyebrow">归档</p>
        <h1 class="section-title">按时间顺序回看</h1>
        <p class="muted">适合快速浏览整个博客的更新节奏。</p>
      </div>
    </div>

    <div v-if="loading" class="card empty-state">正在整理归档...</div>
    <div v-else class="stack">
      <div v-for="group in groups" :key="group.key" class="card archive-card">
        <h2>{{ group.label }}</h2>
        <div class="stack">
          <RouterLink
            v-for="article in group.articles"
            :key="article.id"
            class="archive-link"
            :to="{ name: 'article-detail', params: { slug: article.slug } }"
          >
            <strong>{{ article.title }}</strong>
            <span class="muted">{{ formatDate(article.publishedAt || article.createdAt) }}</span>
          </RouterLink>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.page-pad {
  padding: 30px 0 60px;
  max-width: 900px;
}

.archive-card {
  padding: 0;
  border: 0;
  box-shadow: none;
  background: transparent;
}

.archive-card h2 {
  margin-top: 0;
  font-family: var(--font-serif);
  padding-bottom: 12px;
  border-bottom: 1px solid var(--line);
}

.archive-link {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  padding: 14px 0;
  border-bottom: 1px solid var(--line);
}

.archive-link:last-child {
  border-bottom: 0;
}
</style>
