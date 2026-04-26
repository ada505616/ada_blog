<script setup>
import { onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { deleteArticle, fetchAdminArticles, publishArticle } from "../../api/articles";
import { formatDate } from "../../utils/format";

const router = useRouter();
const items = ref([]);
const pagination = ref({ page: 1, pageSize: 20, total: 0 });
const filters = reactive({
  keyword: "",
  status: ""
});

onMounted(loadData);

async function loadData() {
  const data = await fetchAdminArticles({
    page: pagination.value.page,
    pageSize: pagination.value.pageSize,
    keyword: filters.keyword || undefined,
    status: filters.status || undefined
  });
  items.value = data.items || [];
  pagination.value = data.pagination || pagination.value;
}

async function handleDelete(id) {
  if (!window.confirm("确认删除这篇文章吗？")) {
    return;
  }

  await deleteArticle(id);
  await loadData();
}

async function handlePublish(id) {
  await publishArticle(id);
  await loadData();
}
</script>

<template>
  <section class="stack">
    <div class="card panel">
      <div class="toolbar">
        <div class="toolbar">
          <input v-model="filters.keyword" class="input" placeholder="搜索标题或摘要" />
          <select v-model="filters.status" class="select">
            <option value="">全部状态</option>
            <option value="draft">草稿</option>
            <option value="published">已发布</option>
            <option value="private">私密</option>
          </select>
          <button class="button button-secondary" type="button" @click="loadData">筛选</button>
        </div>
        <RouterLink class="button button-primary" :to="{ name: 'admin-article-create' }">新建文章</RouterLink>
      </div>
    </div>

    <div class="card panel">
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>标题</th>
              <th>分类</th>
              <th>状态</th>
              <th>更新时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="item.id">
              <td>
                <strong>{{ item.title }}</strong>
                <div class="muted">{{ item.slug }}</div>
              </td>
              <td>{{ item.category?.name || "未分类" }}</td>
              <td>{{ item.status }}</td>
              <td>{{ formatDate(item.updatedAt) }}</td>
              <td>
                <div class="toolbar">
                  <RouterLink class="button button-secondary" :to="{ name: 'admin-article-edit', params: { id: item.id } }">编辑</RouterLink>
                  <button v-if="item.status !== 'published'" class="button button-secondary" type="button" @click="handlePublish(item.id)">发布</button>
                  <button class="button button-danger" type="button" @click="handleDelete(item.id)">删除</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="!items.length" class="empty-state">还没有文章，先创建第一篇。</div>
    </div>
  </section>
</template>

<style scoped>
.panel {
  padding: 20px;
  border-top: 3px solid rgba(47, 111, 123, 0.18);
}
</style>
