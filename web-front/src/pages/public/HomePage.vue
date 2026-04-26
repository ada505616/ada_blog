<script setup>
import { computed, onMounted, ref } from "vue";
import { fetchPublicArticles } from "../../api/articles";
import { fetchCategories, fetchTags } from "../../api/taxonomy";
import ArticleCard from "../../components/blog/ArticleCard.vue";

const loading = ref(true);
const articles = ref([]);
const categories = ref([]);
const tags = ref([]);
const errorMessage = ref("");
const keyword = ref("");

const articleList = computed(() => articles.value);
const recentPosts = computed(() => articles.value.slice(0, 4));

onMounted(loadPage);

async function loadPage() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const [articleRes, categoryRes, tagRes] = await Promise.all([
      fetchPublicArticles({ pageSize: 7, keyword: keyword.value || undefined }),
      fetchCategories(),
      fetchTags()
    ]);
    articles.value = articleRes.items || [];
    categories.value = categoryRes.items || [];
    tags.value = tagRes.items || [];
  } catch (error) {
    errorMessage.value = error.message || "加载失败";
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  loadPage();
}

function getRecentThumbStyle(post) {
  if (!post?.coverImageUrl) {
    return null;
  }

  return {
    backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.08), rgba(15, 23, 42, 0.3)), url(${post.coverImageUrl})`
  };
}
</script>

<template>
  <section class="container home-wrap">
    <section class="hero-panel hero-section">
      <p class="eyebrow">我爱coding</p>
      <h1 class="home-title">记录技术、项目与长期积累。</h1>
      <p class="home-summary">
        链接AI，创造无限可能。让灵感、想法快速落地，把重复、基础、标准化的工作交给AI。
      </p>
      <RouterLink class="button hero-cta" :to="{ name: 'archive' }">
        <span class="hero-cta-dot" />
        <span>浏览文章</span>
        <span class="hero-cta-arrow">→</span>
      </RouterLink>
    </section>

    <div v-if="errorMessage" class="card empty-state">{{ errorMessage }}</div>

    <div class="home-grid">
      <section class="stack content-column">
        <h2 class="section-title">最新文章</h2>

        <div class="blog-grid">
          <ArticleCard v-for="item in articleList" :key="item.id" :article="item" horizontal />
        </div>
      </section>

      <aside class="sidebar">
        <section class="widget">
          <h3 class="widget-title">搜索</h3>
          <div class="search-box">
            <input v-model="keyword" type="text" placeholder="搜索文章标题或内容" @keyup.enter="handleSearch" />
            <button type="button" @click="handleSearch">搜索</button>
          </div>
        </section>

        <section class="widget">
          <div class="section-head">
            <h3 class="widget-title">分类</h3>
            <RouterLink class="text-link" :to="{ name: 'categories' }">全部</RouterLink>
          </div>
          <div class="stack compact-stack">
            <RouterLink
              v-for="category in categories"
              :key="category.id"
              class="category-link"
              :to="{ name: 'category-detail', params: { slug: category.slug } }"
            >
              <span>{{ category.name }}</span>
              <span class="category-count">{{ category.articleCount }}</span>
            </RouterLink>
          </div>
        </section>

        <section class="widget">
          <div class="section-head">
            <h3 class="widget-title">近期文章</h3>
            <RouterLink class="text-link" :to="{ name: 'archive' }">归档</RouterLink>
          </div>
          <div class="recent-list">
            <RouterLink
              v-for="post in recentPosts"
              :key="post.id"
              class="recent-post"
              :to="{ name: 'article-detail', params: { slug: post.slug } }"
            >
              <div class="recent-thumb" :class="{ 'has-cover': !!post.coverImageUrl }" :style="getRecentThumbStyle(post)" />
              <div class="recent-info">
                <strong>{{ post.title }}</strong>
                <span class="muted">{{ post.publishedAt || post.createdAt }}</span>
              </div>
            </RouterLink>
          </div>
        </section>

        <section class="widget">
          <div class="section-head">
            <h3 class="widget-title">标签</h3>
            <RouterLink class="text-link" :to="{ name: 'tags' }">全部</RouterLink>
          </div>
          <div class="tag-cloud">
            <RouterLink
              v-for="tag in tags"
              :key="tag.id"
              class="tag-link pill-link"
              :to="{ name: 'tag-detail', params: { slug: tag.slug } }"
            >
              # {{ tag.name }}
            </RouterLink>
          </div>
        </section>

        <div v-if="loading" class="card empty-state">正在加载内容...</div>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.home-wrap {
  display: grid;
  gap: 48px;
  padding: 0 0 60px;
}

.hero-section {
  text-align: center;
  padding: 90px 24px;
  background: linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%);
  border-bottom: 1px solid var(--line);
  border-radius: 0;
  border-left: 0;
  border-right: 0;
  box-shadow: none;
}

.home-title {
  margin: 0;
  font-size: clamp(2.6rem, 5vw, 4.5rem);
  line-height: 1.08;
}

.home-summary {
  max-width: 760px;
  margin: 0 auto 28px;
  color: var(--text-soft);
  line-height: 1.8;
  font-size: 1.1rem;
}

.hero-cta {
  position: relative;
  padding: 14px 22px;
  color: #fff;
  background:
    linear-gradient(135deg, rgba(129, 140, 248, 0.95), rgba(59, 130, 246, 0.98) 52%, rgba(16, 185, 129, 0.92));
  border: 1px solid rgba(255, 255, 255, 0.36);
  box-shadow:
    0 12px 28px rgba(59, 130, 246, 0.24),
    inset 0 1px 0 rgba(255, 255, 255, 0.28);
  overflow: hidden;
}

.hero-cta::before {
  content: "";
  position: absolute;
  inset: 1px;
  border-radius: inherit;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0));
  pointer-events: none;
}

.hero-cta:hover {
  transform: translateY(-2px);
  box-shadow:
    0 16px 36px rgba(59, 130, 246, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.28);
}

.hero-cta-dot,
.hero-cta-arrow,
.hero-cta span:not(.hero-cta-dot):not(.hero-cta-arrow) {
  position: relative;
  z-index: 1;
}

.hero-cta-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 0 14px rgba(255, 255, 255, 0.85);
}

.hero-cta-arrow {
  font-size: 1rem;
  opacity: 0.92;
}

.home-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 56px;
}

.content-column {
  gap: 12px;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.text-link {
  color: var(--primary);
}

.blog-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.sidebar {
  display: grid;
  gap: 24px;
  align-content: start;
}

.widget {
  padding: 24px;
  background: var(--surface-strong);
  border: 1px solid var(--line);
  border-radius: 14px;
}

.widget-title {
  margin: 0 0 18px;
  font-size: 1.1rem;
}

.search-box {
  display: flex;
  border: 1px solid var(--line);
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}

.search-box input {
  flex: 1;
  padding: 12px 14px;
  border: 0;
  outline: 0;
}

.search-box button {
  border: 0;
  border-left: 1px solid var(--line);
  background: #fff;
  padding: 0 16px;
  color: var(--text-soft);
}

.compact-stack {
  gap: 12px;
}

.category-link {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  color: var(--text-soft);
}

.category-count {
  background: var(--bg);
  color: var(--text-soft);
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
}

.recent-list {
  display: grid;
  gap: 16px;
}

.recent-post {
  display: flex;
  gap: 14px;
}

.recent-thumb {
  width: 72px;
  height: 72px;
  border-radius: 8px;
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  background-size: cover;
  background-position: center;
  flex: 0 0 72px;
}

.recent-thumb.has-cover {
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.2);
}

.recent-info {
  display: grid;
  gap: 6px;
}

.tag-cloud {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.tag-link {
  color: var(--text-soft);
}

@media (max-width: 900px) {
  .home-grid {
    grid-template-columns: 1fr;
    gap: 28px;
  }

  .blog-grid {
    grid-template-columns: 1fr;
  }
}
</style>
