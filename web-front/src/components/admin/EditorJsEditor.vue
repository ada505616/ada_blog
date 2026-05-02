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

const IMAGE_WIDTH_OPTIONS = [50, 80, 100];

function normalizeImageWidthPercent(value) {
  const width = Number(value);
  return IMAGE_WIDTH_OPTIONS.includes(width) ? width : 100;
}

function normalizeImageBlockData(data = {}) {
  const file = typeof data.file === "object" && data.file ? data.file : {};
  const url = file.url || data.url || data.fileUrl || "";

  return {
    ...data,
    file: {
      ...file,
      url
    }
  };
}

class SizedImageTool extends ImageTool {
  constructor(options) {
    const data = normalizeImageBlockData(options.data);
    super({ ...options, data });
    this.imageWidthPercent = normalizeImageWidthPercent(data.widthPercent);
    this.readOnly = options.readOnly;
    this.imageObserver = null;
    this.sizeButtons = [];
    this.waitingImageEl = null;
    this.wrapper = null;
  }

  render() {
    const wrapper = super.render();
    this.wrapper = wrapper;
    wrapper.classList.add("image-tool--sized");
    this.renderSizeControls(wrapper);
    this.applyImageSize();
    this.ensureImageVisible();
    this.renderExistingImageWhenVisible();
    return wrapper;
  }

  renderSizeControls(wrapper) {
    if (this.readOnly || wrapper.querySelector(".image-tool__size-controls")) {
      return;
    }

    const controls = document.createElement("div");
    controls.className = "image-tool__size-controls";
    controls.setAttribute("aria-label", "图片展示比例");

    this.sizeButtons = IMAGE_WIDTH_OPTIONS.map((width) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = `${width}%`;
      button.dataset.imageWidth = String(width);
      button.className = "image-tool__size-button";
      button.addEventListener("click", () => this.selectImageWidth(width));
      controls.appendChild(button);
      return button;
    });

    wrapper.querySelector(".image-tool__image")?.after(controls);
    this.syncSizeButtons();
  }

  selectImageWidth(width) {
    this.imageWidthPercent = normalizeImageWidthPercent(width);
    this.syncSizeButtons();
    this.applyImageSize();
  }

  syncSizeButtons() {
    this.sizeButtons.forEach((button) => {
      button.classList.toggle("active", Number(button.dataset.imageWidth) === this.imageWidthPercent);
    });
  }

  applyImageSize() {
    if (!this.wrapper) {
      return;
    }

    this.wrapper.dataset.imageWidth = String(this.imageWidthPercent);

    const image = this.wrapper.querySelector(".image-tool__image-picture");
    if (!image) {
      return;
    }

    image.loading = "lazy";
    image.decoding = "async";
    image.style.maxWidth = `${this.imageWidthPercent}%`;
    image.style.marginInline = "auto";

    if (image.complete || image.naturalWidth > 0) {
      this.ensureImageVisible();
      return;
    }

    if (this.waitingImageEl !== image) {
      this.waitingImageEl = image;
      image.addEventListener("load", () => this.ensureImageVisible(), { once: true });
    }
  }

  renderExistingImageWhenVisible() {
    if (!this.wrapper || this.wrapper.querySelector(".image-tool__image-picture") || !this.data?.file?.url) {
      return;
    }

    if (!("IntersectionObserver" in window)) {
      this.renderImage();
      return;
    }

    this.imageObserver?.disconnect();
    this.imageObserver = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) {
          return;
        }

        this.imageObserver?.disconnect();
        this.renderImage();
      },
      { rootMargin: "900px 0px" }
    );
    this.imageObserver.observe(this.wrapper);
  }

  renderImage() {
    const url = this.data?.file?.url;
    if (!url || this.wrapper?.querySelector(".image-tool__image-picture")) {
      return;
    }

    this.ui.fillImage(url);
    this.applyImageSize();
    this.ensureImageVisible();
  }

  ensureImageVisible() {
    if (!this.wrapper || !this.data?.file?.url) {
      return;
    }

    this.wrapper.classList.remove("image-tool--empty", "image-tool--uploading");
    this.wrapper.classList.add("image-tool--filled");
    this.waitingImageEl = null;
  }

  save() {
    return {
      ...super.save(),
      widthPercent: this.imageWidthPercent
    };
  }

  set data(value) {
    const data = normalizeImageBlockData(value);

    if (!this._data) {
      return;
    }

    this._data = {
      ...this._data,
      ...data,
      caption: data.caption || "",
      file: data.file || { url: "" },
      widthPercent: normalizeImageWidthPercent(data.widthPercent)
    };

    this.ui?.fillCaption?.(this._data.caption);
    ImageTool.tunes.forEach(({ name }) => {
      const enabled = typeof data[name] < "u" ? data[name] === true || data[name] === "true" : false;
      this.setTune(name, enabled);
    });

    if (this._data.caption) {
      this.setTune("caption", true);
    }
  }

  get data() {
    return this._data;
  }

  set image(file) {
    this._data.file = file || { url: "" };
    this.renderImage();
  }

  destroy() {
    this.imageObserver?.disconnect();
  }
}

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
        class: SizedImageTool,
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

.editor-shell :deep(.image-tool__image) {
  contain: layout paint;
  min-height: 220px;
  background: #f8fafc;
}

.editor-shell :deep(.image-tool__image-picture) {
  height: auto;
}

.editor-shell :deep(.image-tool__size-controls) {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  margin: 0 0 10px;
}

.editor-shell :deep(.image-tool__size-button) {
  padding: 6px 10px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: #ffffff;
  color: var(--text-soft);
  cursor: pointer;
}

.editor-shell :deep(.image-tool__size-button.active) {
  border-color: rgba(59, 130, 246, 0.42);
  background: var(--primary-soft);
  color: var(--primary);
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
