<script setup>
defineProps({
  label: {
    type: String,
    required: true
  },
  value: {
    type: [String, Number],
    required: true
  },
  hint: {
    type: String,
    default: ""
  }
});
</script>

<template>
  <div class="card stat-card">
    <span class="eyebrow">{{ label }}</span>
    <strong>{{ value }}</strong>
    <span class="muted">{{ hint }}</span>
  </div>
</template>

<style scoped>
.stat-card {
  padding: 20px;
  display: grid;
  gap: 10px;
  border-top: 3px solid rgba(47, 111, 123, 0.2);
}

.stat-card strong {
  font-size: 2rem;
  font-family: var(--font-sans);
  font-weight: 700;
}
</style>
