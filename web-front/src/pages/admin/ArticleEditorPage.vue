<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { createArticle, fetchAdminArticle, updateArticle } from "../../api/articles";
import { fetchAdminCategories, fetchAdminTags } from "../../api/taxonomy";
import EditorJsEditor from "../../components/admin/EditorJsEditor.vue";
import MediaUploader from "../../components/admin/MediaUploader.vue";
import { editorDataToHtml, editorDataToText, normalizeEditorData } from "../../utils/editor";
import { slugify } from "../../utils/format";

const route = useRoute();
const router = useRouter();
const editorRef = ref(null);
const loading = ref(false);
const feedback = ref("");
const categories = ref([]);
const tags = ref([]);
const selectedTagIds = ref([]);

const isEdit = computed(() => Boolean(route.params.id));

const form = reactive({
  title: "",
  slug: "",
  summary: "",
  coverImageUrl: "",
  categoryId: "",
  contentType: "editorjs",
  status: "draft",
  isTop: false,
  allowComment: true,
  publishedAt: ""
});

const editorData = ref(normalizeEditorData());

watch(
  () => form.title,
  (value) => {
    if (!isEdit.value || !form.slug) {
      form.slug = slugify(value);
    }
  }
);

onMounted(async () => {
  const [categoryRes, tagRes] = await Promise.all([fetchAdminCategories(), fetchAdminTags()]);
  categories.value = categoryRes.items || [];
  tags.value = tagRes.items || [];

  if (isEdit.value) {
    loading.value = true;
    try {
      const article = await fetchAdminArticle(route.params.id);
      form.title = article.title;
      form.slug = article.slug;
      form.summary = article.summary || "";
      form.coverImageUrl = article.coverImageUrl || "";
      form.categoryId = article.category?.id || "";
      form.contentType = article.contentType;
      form.status = article.status;
      form.isTop = article.isTop;
      form.allowComment = article.allowComment;
      form.publishedAt = article.publishedAt || "";
      selectedTagIds.value = (article.tags || []).map((item) => item.id);
      editorData.value = normalizeEditorData(article.contentJson);
    } finally {
      loading.value = false;
    }
  }
});

function toggleTag(id) {
  if (selectedTagIds.value.includes(id)) {
    selectedTagIds.value = selectedTagIds.value.filter((item) => item !== id);
    return;
  }

  selectedTagIds.value = [...selectedTagIds.value, id];
}

async function saveArticle() {
  feedback.value = "";
  loading.value = true;

  try {
    const contentJson = await editorRef.value.save();
    const payload = {
      title: form.title,
      slug: form.slug,
      summary: form.summary,
      coverImageUrl: form.coverImageUrl,
      categoryId: form.categoryId || null,
      contentType: "editorjs",
      contentJson,
      contentHtml: editorDataToHtml(contentJson),
      contentText: editorDataToText(contentJson),
      status: form.status,
      isTop: form.isTop,
      allowComment: form.allowComment,
      publishedAt: form.publishedAt || null,
      tagIds: selectedTagIds.value
    };

    if (isEdit.value) {
      await updateArticle(route.params.id, payload);
      feedback.value = "文章已更新";
    } else {
      const article = await createArticle(payload);
      feedback.value = "文章已创建";
      router.replace({ name: "admin-article-edit", params: { id: article.id } });
    }
  } catch (error) {
    feedback.value = error.message || "保存失败";
  } finally {
    loading.value = false;
  }
}

function handleCoverUploaded(file) {
  form.coverImageUrl = file.fileUrl;
}
</script>

<template>
  <section class="stack">
    <div class="card panel">
      <div class="page-title-row">
        <div>
          <p class="eyebrow">文章编辑</p>
          <h2 class="section-title">{{ isEdit ? "编辑文章" : "新建文章" }}</h2>
        </div>
      </div>

      <div class="editor-grid stack">
        <div class="stack editor-panel">
          <EditorJsEditor ref="editorRef" :model-value="editorData" />
          <div class="editor-actions">
            <button class="button button-primary" type="button" :disabled="loading" @click="saveArticle">
              {{ loading ? "保存中..." : "保存文章" }}
            </button>
          </div>
          <p v-if="feedback" class="muted">{{ feedback }}</p>
        </div>

        <div class="stack form-panel">
          <div class="field">
            <label>标题</label>
            <input v-model="form.title" class="input" placeholder="请输入标题" />
          </div>
          <div class="field">
            <label>Slug</label>
            <input v-model="form.slug" class="input" placeholder="url slug" />
          </div>
          <div class="field">
            <label>摘要</label>
            <textarea v-model="form.summary" class="textarea" placeholder="文章摘要" />
          </div>
          <div class="field">
            <label>分类</label>
            <select v-model="form.categoryId" class="select">
              <option value="">未分类</option>
              <option v-for="item in categories" :key="item.id" :value="item.id">{{ item.name }}</option>
            </select>
          </div>
          <div class="field">
            <label>状态</label>
            <select v-model="form.status" class="select">
              <option value="draft">草稿</option>
              <option value="published">已发布</option>
              <option value="private">私密</option>
            </select>
          </div>
          <label class="field checkbox-field">
            <span>置顶</span>
            <input v-model="form.isTop" type="checkbox" />
          </label>
          <label class="field checkbox-field">
            <span>允许评论</span>
            <input v-model="form.allowComment" type="checkbox" />
          </label>
          <div class="field">
            <label>封面图</label>
            <input v-model="form.coverImageUrl" class="input" placeholder="上传后自动回填 URL" />
            <MediaUploader label="上传封面" @uploaded="handleCoverUploaded" />
          </div>
          <div v-if="form.coverImageUrl" class="cover-preview">
            <img :src="form.coverImageUrl" alt="cover" />
          </div>
          <div class="field">
            <label>标签</label>
            <div class="tag-selects">
              <button
                v-for="tag in tags"
                :key="tag.id"
                class="pill-link"
                :class="{ active: selectedTagIds.includes(tag.id) }"
                type="button"
                @click="toggleTag(tag.id)"
              >
                # {{ tag.name }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.panel {
  padding: 22px;
  border-top: 3px solid rgba(47, 111, 123, 0.18);
}

.editor-grid {
  gap: 18px;
}

.form-panel,
.editor-panel {
  padding: 18px;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--surface-strong);
}

.editor-panel {
  min-width: 0;
}

.editor-actions {
  display: flex;
  justify-content: flex-end;
}

.checkbox-field {
  grid-template-columns: 1fr auto;
  align-items: center;
  padding: 14px 16px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.56);
}

.tag-selects {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tag-selects .active {
  background: var(--primary-soft);
  color: var(--primary);
  border-color: rgba(31, 122, 100, 0.2);
}

.cover-preview {
  max-width: 420px;
  overflow: hidden;
  border-radius: 12px;
  border: 1px solid var(--line);
}
</style>
