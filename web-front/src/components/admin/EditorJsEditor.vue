<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import EditorJS from "@editorjs/editorjs";
import Header from "@editorjs/header";
import List from "@editorjs/list";
import Paragraph from "@editorjs/paragraph";
import ImageTool from "@editorjs/image";
import CodeTool from "@editorjs/code";
import Table from "@editorjs/table";
import { API_BASE_URL, getStoredAccessToken } from "../../api/http";
import { normalizeEditorData } from "../../utils/editor";

const props = defineProps({
  modelValue: {
    type: Object,
    default: null
  }
});

const holderId = `editor-${Math.random().toString(36).slice(2, 10)}`;
const ready = ref(false);
let editor = null;
let lastRenderedData = JSON.stringify(normalizeEditorData(props.modelValue));

onMounted(() => {
  editor = new EditorJS({
    holder: holderId,
    autofocus: true,
    minHeight: 240,
    data: normalizeEditorData(props.modelValue),
    tools: {
      paragraph: {
        class: Paragraph,
        inlineToolbar: true
      },
      header: {
        class: Header,
        config: {
          levels: [2, 3, 4],
          defaultLevel: 2
        }
      },
      list: {
        class: List,
        inlineToolbar: true
      },
      code: {
        class: CodeTool
      },
      table: {
        class: Table,
        inlineToolbar: true,
        config: {
          rows: 2,
          cols: 3,
          withHeadings: true
        }
      },
      image: {
        class: ImageTool,
        config: {
          uploader: {
            async uploadByFile(file) {
              const formData = new FormData();
              formData.append("file", file);

              const response = await fetch(`${API_BASE_URL}/admin/media-files/editorjs`, {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${getStoredAccessToken()}`
                },
                body: formData
              });

              return response.json();
            }
          }
        }
      }
    },
    onReady() {
      ready.value = true;
    }
  });
});

watch(
  () => props.modelValue,
  async (value) => {
    if (!editor) {
      return;
    }

    const nextData = normalizeEditorData(value);
    const serialized = JSON.stringify(nextData);

    if (serialized === lastRenderedData) {
      return;
    }

    await editor.isReady;
    await editor.render(nextData);
    lastRenderedData = serialized;
  },
  { deep: true }
);

onBeforeUnmount(() => {
  if (editor?.destroy) {
    editor.destroy();
  }
});

async function save() {
  if (!editor) {
    return normalizeEditorData();
  }

  const data = await editor.save();
  lastRenderedData = JSON.stringify(data);
  return data;
}

defineExpose({
  save,
  ready
});
</script>

<template>
  <div class="editor-shell card">
    <div :id="holderId" class="editor-holder" />
  </div>
</template>

<style scoped>
.editor-shell {
  padding: 12px;
}

.editor-holder {
  min-height: 320px;
}

.editor-shell :deep(.codex-editor__redactor) {
  padding-bottom: 0 !important;
}

.editor-shell :deep(.ce-block__content),
.editor-shell :deep(.ce-toolbar__content),
.editor-shell :deep(.cdx-block),
.editor-shell :deep(.tc-wrap),
.editor-shell :deep(.ce-code__textarea) {
  max-width: none;
}

.editor-shell :deep(.ce-toolbar__content),
.editor-shell :deep(.ce-block__content) {
  margin-left: 0;
  margin-right: 0;
}

.editor-shell :deep(.ce-code__textarea) {
  min-height: 220px;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
}
</style>
