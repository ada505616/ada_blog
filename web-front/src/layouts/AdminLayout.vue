<script setup>
import { computed, onMounted, ref } from "vue";
import { RouterLink, RouterView, useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const navOpen = ref(false);

const navItems = [
  { label: "仪表盘", to: { name: "admin-dashboard" } },
  { label: "文章管理", to: { name: "admin-articles" } },
  { label: "分类管理", to: { name: "admin-categories" } },
  { label: "标签管理", to: { name: "admin-tags" } },
  { label: "评论管理", to: { name: "admin-comments" } },
  { label: "资源管理", to: { name: "admin-media" } }
];

const adminName = computed(() => authStore.admin?.nickname || authStore.admin?.username || "管理员");

onMounted(async () => {
  if (authStore.isAuthenticated && !authStore.admin) {
    try {
      await authStore.fetchMe();
    } catch (error) {
      authStore.reset();
      router.push({ name: "admin-login" });
    }
  }
});

async function handleLogout() {
  await authStore.logout();
  router.push({ name: "admin-login" });
}

function isActive(item) {
  return route.name === item.to.name;
}
</script>

<template>
  <div class="admin-shell">
    <div class="admin-main">
      <header class="admin-topbar card">
        <div class="topbar-main">
          <RouterLink class="topbar-brand" :to="{ name: 'admin-dashboard' }">
            <span class="brand-mark">A</span>
            <div>
              <strong>Ada Blog</strong>
              <small>Admin Console</small>
            </div>
          </RouterLink>
          <div class="topbar-heading">
            <p class="eyebrow">后台管理</p>
            <h1 class="section-title">{{ route.meta.title || "内容管理" }}</h1>
          </div>
          <div class="topbar-user">
            <span class="badge">已登录</span>
            <strong>{{ adminName }}</strong>
            <button class="button button-secondary" type="button" @click="handleLogout">退出登录</button>
          </div>
          <button class="button button-secondary mobile-only" type="button" @click="navOpen = !navOpen">
            菜单
          </button>
        </div>

        <nav class="topbar-nav" :class="{ open: navOpen }">
          <RouterLink
            v-for="item in navItems"
            :key="item.label"
            class="topbar-link"
            :class="{ active: isActive(item) }"
            :to="item.to"
            @click="navOpen = false"
          >
            {{ item.label }}
          </RouterLink>
        </nav>
      </header>

      <RouterView />
    </div>
  </div>
</template>

<style scoped>
.admin-topbar {
  margin-bottom: 22px;
  padding: 16px 18px;
  display: grid;
  gap: 14px;
}

.topbar-main {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 16px;
}

.topbar-brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
}

.topbar-brand small {
  display: block;
  color: var(--text-soft);
}

.brand-mark {
  display: inline-grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--primary), #7db8a7);
  color: white;
  font-weight: 800;
}

.topbar-heading {
  min-width: 0;
}

.topbar-user {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.topbar-nav {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  padding-top: 12px;
  border-top: 1px solid var(--line);
}

.topbar-link {
  padding: 10px 14px;
  border-radius: 8px;
  color: var(--text-soft);
  background: #f8fafb;
  border: 1px solid var(--line);
}

.topbar-link.active {
  color: var(--text);
  border-color: rgba(47, 111, 123, 0.22);
  background: rgba(47, 111, 123, 0.08);
}

@media (max-width: 960px) {
  .topbar-main {
    grid-template-columns: 1fr auto;
  }

  .topbar-heading,
  .topbar-user {
    grid-column: 1 / -1;
  }

  .topbar-nav {
    display: none;
  }

  .topbar-nav.open {
    display: flex;
  }
}
</style>
