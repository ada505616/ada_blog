<script setup>
import { ref } from "vue";
import { formatDateTime } from "../../utils/format";

const props = defineProps({
  comments: {
    type: Array,
    default: () => []
  },
  canReply: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(["reply"]);
const activeReplyId = ref(null);

function handleReply(comment) {
  activeReplyId.value = comment.id;
  emit("reply", comment);
}

function isPending(comment) {
  return comment.status === "pending";
}
</script>

<template>
  <div class="stack">
    <div v-for="comment in comments" :key="comment.id" class="card comment-card" :class="{ pending: isPending(comment) }">
      <div class="comment-head">
        <div>
          <strong>{{ comment.nickname }}</strong>
          <div class="muted">{{ formatDateTime(comment.createdAt) }}</div>
        </div>
        <button v-if="canReply" class="button button-secondary" type="button" @click="handleReply(comment)">回复</button>
      </div>

      <p class="comment-text">{{ comment.content }}</p>
      <p v-if="isPending(comment)" class="comment-pending-tip">（评论已提交，请等待审核）</p>

      <div v-if="comment.replies?.length" class="reply-list">
        <CommentTree :comments="comment.replies" :can-reply="canReply" @reply="$emit('reply', $event)" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.comment-card {
  padding: 16px 0;
  border: 0;
  border-bottom: 1px solid var(--line);
  border-radius: 0;
  box-shadow: none;
  background: transparent;
}

.comment-card.pending {
  color: var(--text-soft);
}

.comment-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: start;
}

.comment-text {
  margin: 14px 0 0;
  white-space: pre-wrap;
}

.comment-pending-tip {
  margin: 6px 0 0;
  color: var(--text-soft);
  font-size: 0.92rem;
}

.reply-list {
  margin-top: 16px;
  padding-left: 18px;
  border-left: 1px solid var(--line);
}
</style>
