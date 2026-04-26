<script setup>
import { onMounted, ref } from "vue";
import { fetchAdminArticles } from "../../api/articles";
import { fetchAdminCategories, fetchAdminTags } from "../../api/taxonomy";
import { fetchAdminComments } from "../../api/comments";
import { fetchMediaFiles } from "../../api/media";
import StatCard from "../../components/admin/StatCard.vue";

const stats = ref([
  { label: "文章总数", value: 0, hint: "已创建文章" },
  { label: "分类数量", value: 0, hint: "站点分类" },
  { label: "标签数量", value: 0, hint: "已定义标签" },
  { label: "评论总数", value: 0, hint: "待审核与已审核" },
  { label: "资源数量", value: 0, hint: "图片与封面" }
]);

onMounted(async () => {
  const [articles, categories, tags, comments, media] = await Promise.all([
    fetchAdminArticles({ pageSize: 1 }),
    fetchAdminCategories(),
    fetchAdminTags(),
    fetchAdminComments({ pageSize: 1 }),
    fetchMediaFiles({ pageSize: 1 })
  ]);

  stats.value = [
    { label: "文章总数", value: articles.pagination?.total || 0, hint: "已创建文章" },
    { label: "分类数量", value: categories.items?.length || 0, hint: "站点分类" },
    { label: "标签数量", value: tags.items?.length || 0, hint: "已定义标签" },
    { label: "评论总数", value: comments.pagination?.total || 0, hint: "待审核与已审核" },
    { label: "资源数量", value: media.pagination?.total || 0, hint: "图片与封面" }
  ];
});
</script>

<template>
  <section class="stack">
    <div class="grid-four">
      <StatCard v-for="item in stats" :key="item.label" :label="item.label" :value="item.value" :hint="item.hint" />
    </div>

    <div class="grid-two">
      <div class="card panel">
        <p class="eyebrow">内容工作流</p>
        <h2 class="section-title">后台使用建议</h2>
        <div class="stack muted">
          <span>1. 先建分类和标签，再进入文章编辑。</span>
          <span>2. 文章正文直接使用 Editor.js，图片可以边写边传。</span>
          <span>3. 评论默认进待审核队列，后台审核后前台才会显示。</span>
        </div>
      </div>
      <div class="card panel">
        <p class="eyebrow">资源建议</p>
        <h2 class="section-title">封面与正文图片统一管理</h2>
        <div class="stack muted">
          <span>上传过的图片会进入资源库，后续可复用。</span>
          <span>后端已做 hash 去重，重复上传会直接复用旧记录。</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.panel {
  padding: 24px;
  border-top: 3px solid rgba(47, 111, 123, 0.18);
}
</style>
