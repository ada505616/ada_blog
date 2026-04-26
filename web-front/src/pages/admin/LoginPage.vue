<script setup>
import { reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const errorMessage = ref("");
const form = reactive({
  username: "admin",
  password: "admin123456"
});

async function submit() {
  errorMessage.value = "";

  try {
    await authStore.login(form);
    router.push(route.query.redirect || { name: "admin-dashboard" });
  } catch (error) {
    errorMessage.value = error.message || "登录失败";
  }
}
</script>

<template>
  <section class="login-page">
    <div class="login-panel card">
      <p class="eyebrow">后台管理</p>
      <h1 class="section-title">登录 Ada Blog</h1>
      <p class="muted">默认账号密码已按后端初始化值预填，方便你本地先跑通联调。</p>
      <div class="form-grid">
        <div class="field">
          <label>用户名</label>
          <input v-model="form.username" class="input" placeholder="请输入用户名" />
        </div>
        <div class="field">
          <label>密码</label>
          <input v-model="form.password" type="password" class="input" placeholder="请输入密码" />
        </div>
        <button class="button button-primary" type="button" @click="submit">
          {{ authStore.loading ? "登录中..." : "进入后台" }}
        </button>
        <p v-if="errorMessage" class="muted">{{ errorMessage }}</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
}

.login-panel {
  width: min(100%, 480px);
  padding: 28px;
  border-top: 4px solid var(--primary);
}
</style>
