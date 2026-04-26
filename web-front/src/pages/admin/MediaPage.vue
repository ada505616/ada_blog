<script setup>
import { onMounted, reactive, ref } from "vue";
import { deleteMediaFile, fetchMediaFiles } from "../../api/media";
import MediaUploader from "../../components/admin/MediaUploader.vue";
import { formatDate } from "../../utils/format";

const items = ref([]);
const pagination = ref({ page: 1, pageSize: 20, total: 0 });
const filters = reactive({ keyword: "" });

onMounted(loadData);

async function loadData() {
  const data = await fetchMediaFiles({
    page: pagination.value.page,
    pageSize: pagination.value.pageSize,
    keyword: filters.keyword || undefined
  });
  items.value = data.items || [];
  pagination.value = data.pagination || pagination.value;
}

async function removeItem(id) {
  if (!window.confirm("确认删除这个资源吗？")) {
    return;
  }

  await deleteMediaFile(id);
  await loadData();
}
</script>

<template>
  <section class="stack">
    <div class="card panel">
      <div class="toolbar">
        <div class="toolbar">
          <input v-model="filters.keyword" class="input" placeholder="按原始文件名搜索" />
          <button class="button button-secondary" type="button" @click="loadData">搜索</button>
        </div>
        <MediaUploader label="上传图片" @uploaded="loadData" />
      </div>
    </div>

    <div class="grid-three">
      <article v-for="item in items" :key="item.id" class="card media-card">
        <img class="media-preview" :src="item.fileUrl" :alt="item.originalName || item.fileName" />
        <div class="stack">
          <strong>{{ item.originalName || item.fileName }}</strong>
          <span class="muted">{{ formatDate(item.createdAt) }}</span>
          <input class="input" :value="item.fileUrl" readonly />
          <button class="button button-danger" type="button" @click="removeItem(item.id)">删除</button>
        </div>
      </article>
    </div>

    <div v-if="!items.length" class="card empty-state">资源库还没有文件。</div>
  </section>
</template>

<style scoped>
.panel {
  padding: 20px;
  border-top: 3px solid rgba(47, 111, 123, 0.18);
}

.media-card {
  padding: 16px;
  display: grid;
  gap: 14px;
  border-top: 3px solid rgba(47, 111, 123, 0.12);
}

.media-preview {
  aspect-ratio: 16 / 10;
  width: 100%;
  object-fit: cover;
  border-radius: 18px;
  background: rgba(31, 122, 100, 0.08);
}
</style>
