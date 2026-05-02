<script setup>
import { onMounted, reactive, ref } from "vue";
import { createTag, deleteTag, fetchAdminTags, updateTag } from "../../api/taxonomy";

const items = ref([]);
const editingId = ref(null);
const form = reactive({
  name: "",
  slug: "",
  color: "#1f7a64"
});

function normalizeColor(value) {
  return /^#[0-9a-fA-F]{6}$/.test(value || "") ? value : "#1f7a64";
}

onMounted(loadData);

async function loadData() {
  const data = await fetchAdminTags();
  items.value = data.items || [];
}

function resetForm() {
  editingId.value = null;
  Object.assign(form, { name: "", slug: "", color: "#1f7a64" });
}

function startEdit(item) {
  editingId.value = item.id;
  Object.assign(form, { ...item, color: normalizeColor(item.color) });
}

async function submit() {
  if (editingId.value) {
    await updateTag(editingId.value, form);
  } else {
    await createTag(form);
  }

  resetForm();
  await loadData();
}

async function removeItem(id) {
  if (!window.confirm("确认删除标签吗？")) {
    return;
  }

  await deleteTag(id);
  await loadData();
}
</script>

<template>
  <section class="stack">
    <div class="card panel">
      <p class="eyebrow">标签表单</p>
      <h2 class="section-title">{{ editingId ? "编辑标签" : "新建标签" }}</h2>
      <div class="form-grid">
        <div class="field"><label>名称</label><input v-model="form.name" class="input" /></div>
        <div class="field"><label>Slug</label><input v-model="form.slug" class="input" /></div>
        <div class="field">
          <label>颜色</label>
          <div class="color-picker-row">
            <input v-model="form.color" class="color-picker" type="color" />
            <span class="color-preview" :style="{ background: form.color }" />
            <code class="color-code">{{ form.color }}</code>
          </div>
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
          <thead><tr><th>名称</th><th>Slug</th><th>颜色</th><th>操作</th></tr></thead>
          <tbody>
            <tr v-for="item in items" :key="item.id">
              <td>{{ item.name }}</td>
              <td>{{ item.slug }}</td>
              <td><span class="color-chip" :style="{ background: item.color || '#ddd' }" /></td>
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

.color-chip {
  display: inline-block;
  width: 18px;
  height: 18px;
  border-radius: 6px;
  border: 1px solid var(--line);
  vertical-align: middle;
}

.color-picker-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.color-picker {
  width: 52px;
  height: 42px;
  padding: 4px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: #ffffff;
  cursor: pointer;
}

.color-preview {
  width: 30px;
  height: 30px;
  border: 1px solid var(--line);
  border-radius: 8px;
}

.color-code {
  padding: 8px 10px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #f8fafb;
  color: var(--text-soft);
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
}
</style>
