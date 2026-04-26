<script setup>
import { onMounted, reactive, ref } from "vue";
import { auditComment, deleteComment, fetchAdminComments } from "../../api/comments";
import { formatDate } from "../../utils/format";

const items = ref([]);
const pagination = ref({ page: 1, pageSize: 20, total: 0 });
const filters = reactive({
  status: ""
});

onMounted(loadData);

async function loadData() {
  const data = await fetchAdminComments({
    page: pagination.value.page,
    pageSize: pagination.value.pageSize,
    status: filters.status || undefined
  });
  items.value = data.items || [];
  pagination.value = data.pagination || pagination.value;
}

async function updateStatus(id, status) {
  await auditComment(id, status);
  await loadData();
}

async function removeItem(id) {
  if (!window.confirm("确认删除这条评论吗？")) {
    return;
  }

  await deleteComment(id);
  await loadData();
}
</script>

<template>
  <section class="stack">
    <div class="card panel">
      <div class="toolbar">
        <select v-model="filters.status" class="select">
          <option value="">全部状态</option>
          <option value="pending">待审核</option>
          <option value="approved">已通过</option>
          <option value="rejected">已拒绝</option>
          <option value="spam">垃圾评论</option>
        </select>
        <button class="button button-secondary" type="button" @click="loadData">筛选</button>
      </div>
    </div>

    <div class="card panel">
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th>昵称</th><th>文章</th><th>状态</th><th>时间</th><th>操作</th></tr></thead>
          <tbody>
            <tr v-for="item in items" :key="item.id">
              <td>
                <strong>{{ item.nickname }}</strong>
                <div class="muted">{{ item.content }}</div>
              </td>
              <td>{{ item.articleTitle }}</td>
              <td>{{ item.status }}</td>
              <td>{{ formatDate(item.createdAt) }}</td>
              <td>
                <div class="toolbar">
                  <button class="button button-secondary" type="button" @click="updateStatus(item.id, 'approved')">通过</button>
                  <button class="button button-secondary" type="button" @click="updateStatus(item.id, 'rejected')">拒绝</button>
                  <button class="button button-secondary" type="button" @click="updateStatus(item.id, 'spam')">垃圾</button>
                  <button class="button button-danger" type="button" @click="removeItem(item.id)">删除</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="!items.length" class="empty-state">当前没有评论记录。</div>
    </div>
  </section>
</template>

<style scoped>
.panel {
  padding: 20px;
  border-top: 3px solid rgba(47, 111, 123, 0.18);
}
</style>
