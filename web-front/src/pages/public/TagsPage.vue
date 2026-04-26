<script setup>
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { fetchPublicArticles } from "../../api/articles";
import { fetchTags } from "../../api/taxonomy";
import ArticleCard from "../../components/blog/ArticleCard.vue";

const route = useRoute();
const tags = ref([]);
const articles = ref([]);
const loading = ref(true);

const currentSlug = computed(() => route.params.slug || "");
const currentTag = computed(() => tags.value.find((item) => item.slug === currentSlug.value) || null);

watch(
  () => route.params.slug,
  () => loadData(),
  { immediate: true }
);

async function loadData() {
  loading.value = true;

  try {
    const [tagRes, articleRes] = await Promise.all([
      fetchTags(),
      fetchPublicArticles(currentSlug.value ? { tag: currentSlug.value, pageSize: 12 } : { pageSize: 12 })
    ]);
    tags.value = tagRes.items || [];
    articles.value = articleRes.items || [];
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <section class="container page-pad stack">
    <div class="page-title-row">
      <div>
        <p class="eyebrow">标签页</p>
        <h1 class="section-title">{{ currentTag ? `# ${currentTag.name}` : "所有标签" }}</h1>
        <p class="muted">标签更适合用来快速横向查找相似话题。</p>
      </div>
    </div>

    <div class="tag-cloud">
      <RouterLink class="pill-link" :to="{ name: 'tags' }">全部</RouterLink>
      <RouterLink
        v-for="tag in tags"
        :key="tag.id"
        class="pill-link"
        :to="{ name: 'tag-detail', params: { slug: tag.slug } }"
      >
        # {{ tag.name }} · {{ tag.articleCount }}
      </RouterLink>
    </div>

    <div v-if="loading" class="card empty-state">正在加载标签文章...</div>
    <div v-else class="stack">
      <ArticleCard v-for="article in articles" :key="article.id" :article="article" />
      <div v-if="!articles.length" class="card empty-state">这个标签下还没有文章。</div>
    </div>
  </section>
</template>

<style scoped>
.page-pad {
  padding: 30px 0 60px;
  max-width: 980px;
}

.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
</style>
