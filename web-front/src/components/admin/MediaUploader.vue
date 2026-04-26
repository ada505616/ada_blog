<script setup>
import { ref } from "vue";
import { uploadMedia } from "../../api/media";

const props = defineProps({
  label: {
    type: String,
    default: "上传图片"
  }
});

const emit = defineEmits(["uploaded", "error"]);
const uploading = ref(false);

async function handleFileChange(event) {
  const file = event.target.files?.[0];

  if (!file) {
    return;
  }

  uploading.value = true;

  try {
    const data = await uploadMedia(file);
    emit("uploaded", data.item);
  } catch (error) {
    emit("error", error.message || "上传失败");
  } finally {
    event.target.value = "";
    uploading.value = false;
  }
}
</script>

<template>
  <label class="upload-trigger">
    <input type="file" accept="image/*" hidden @change="handleFileChange" />
    <span class="button button-secondary">{{ uploading ? "上传中..." : label }}</span>
  </label>
</template>
