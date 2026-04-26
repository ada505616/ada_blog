<script setup>
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { fetchPublicArticles } from "../../api/articles";
import { fetchCategories } from "../../api/taxonomy";
import ArticleCard from "../../components/blog/ArticleCard.vue";

const route = useRoute();
const categories = ref([]);
const articles = ref([]);
const loading = ref(true);

const currentSlug = computed(() => route.params.slug || "");
const currentCategory = computed(() => categories.value.find((item) => item.slug === currentSlug.value) || null);

watch(
  () => route.params.slug,
  () => loadData(),
  { immediate: true }
);

async function loadData() {
  loading.value = true;

  try {
    const [categoryRes, articleRes] = await Promise.all([
      fetchCategories(),
      fetchPublicArticles(currentSlug.value ? { category: currentSlug.value, pageSize: 12 } : { pageSize: 12 })
    ]);
    categories.value = categoryRes.items || [];
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
        <p class="eyebrow">分类页</p>
        <h1 class="section-title">{{ currentCategory ? currentCategory.name : "所有分类" }}</h1>
        <p class="muted">{{ currentCategory?.description || "按固定主题组织文章，适合连续阅读。" }}</p>
      </div>
    </div>

    <div class="tag-cloud">
      <RouterLink class="pill-link" :to="{ name: 'categories' }">全部</RouterLink>
      <RouterLink
        v-for="category in categories"
        :key="category.id"
        class="pill-link"
        :to="{ name: 'category-detail', params: { slug: category.slug } }"
      >
        {{ category.name }} · {{ category.articleCount }}
      </RouterLink>
    </div>

    <div v-if="loading" class="card empty-state">正在加载分类文章...</div>
    <div v-else class="stack">
      <ArticleCard v-for="article in articles" :key="article.id" :article="article" />
      <div v-if="!articles.length" class="card empty-state">这个分类下还没有文章。</div>
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
