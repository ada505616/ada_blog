<script setup>
import { onMounted, reactive, ref } from "vue";
import { createCategory, deleteCategory, fetchAdminCategories, updateCategory } from "../../api/taxonomy";

const items = ref([]);
const editingId = ref(null);
const form = reactive({
  name: "",
  slug: "",
  description: "",
  sort: 0,
  status: 1
});

onMounted(loadData);

async function loadData() {
  const data = await fetchAdminCategories();
  items.value = data.items || [];
}

function resetForm() {
  editingId.value = null;
  Object.assign(form, { name: "", slug: "", description: "", sort: 0, status: 1 });
}

function startEdit(item) {
  editingId.value = item.id;
  Object.assign(form, item);
}

async function submit() {
  if (editingId.value) {
    await updateCategory(editingId.value, form);
  } else {
    await createCategory(form);
  }

  resetForm();
  await loadData();
}

async function removeItem(id) {
  if (!window.confirm("确认删除分类吗？")) {
    return;
  }

  await deleteCategory(id);
  await loadData();
}
</script>

<template>
  <section class="stack">
    <div class="card panel">
      <p class="eyebrow">分类表单</p>
      <h2 class="section-title">{{ editingId ? "编辑分类" : "新建分类" }}</h2>
      <div class="form-grid">
        <div class="field"><label>名称</label><input v-model="form.name" class="input" /></div>
        <div class="field"><label>Slug</label><input v-model="form.slug" class="input" /></div>
        <div class="field"><label>描述</label><textarea v-model="form.description" class="textarea" /></div>
        <div class="field"><label>排序</label><input v-model="form.sort" type="number" class="input" /></div>
        <div class="field">
          <label>状态</label>
          <select v-model="form.status" class="select">
            <option :value="1">启用</option>
            <option :value="0">禁用</option>
          </select>
        </div>
        <div class="toolbar">
          <button class="button button-primary" type="button" @click="submit">{{ editingId ? "保存" : "创建" }}</button>
          <button class="button button-secondary" type="button" @click="resetForm">重置</button>
        </div>
      </div>
    </div>

    <div class="card panel">
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th>名称</th><th>Slug</th><th>排序</th><th>操作</th></tr></thead>
          <tbody>
            <tr v-for="item in items" :key="item.id">
              <td>{{ item.name }}</td>
              <td>{{ item.slug }}</td>
              <td>{{ item.sort }}</td>
              <td>
                <div class="toolbar">
                  <button class="button button-secondary" type="button" @click="startEdit(item)">编辑</button>
                  <button class="button button-danger" type="button" @click="removeItem(item.id)">删除</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<style scoped>
.panel {
  padding: 22px;
  border-top: 3px solid rgba(47, 111, 123, 0.18);
}
</style>
