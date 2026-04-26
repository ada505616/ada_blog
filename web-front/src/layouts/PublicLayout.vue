<script setup>
import brandCat from "../assets/brand-cat.svg";
import { ref } from "vue";
import { RouterLink, RouterView, useRoute } from "vue-router";

const route = useRoute();
const mobileOpen = ref(false);

const navItems = [
  { label: "首页", to: { name: "home" } },
  { label: "分类", to: { name: "categories" } },
  { label: "标签", to: { name: "tags" } },
  { label: "归档", to: { name: "archive" } },
  { label: "关于", to: { name: "about" } }
];

function isActive(item) {
  return route.name === item.to.name;
}
</script>

<template>
  <div class="page-shell">
    <header class="public-header">
      <div class="container header-row">
        <RouterLink class="brand" :to="{ name: 'home' }">
          <span class="brand-mark">
            <img class="brand-mark-image" :src="brandCat" alt="Ada Blog brand" />
          </span>
          <span class="brand-copy">
            <strong>Ada Blog</strong>
            <small>路漫漫其修远兮，吾将上下而求索。</small>
          </span>
        </RouterLink>

        <nav class="desktop-nav">
          <RouterLink
            v-for="item in navItems"
            :key="item.label"
            class="nav-link"
            :class="{ active: isActive(item) }"
            :to="item.to"
          >
            {{ item.label }}
          </RouterLink>
          <RouterLink class="nav-link admin-entry" :to="{ name: 'admin-login' }">后台</RouterLink>
        </nav>

        <button
          class="button button-secondary mobile-only mobile-menu-button"
          type="button"
          :aria-expanded="mobileOpen"
          aria-label="打开导航菜单"
          @click="mobileOpen = !mobileOpen"
        >
          <span class="menu-icon" :class="{ open: mobileOpen }" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>
      </div>

      <div v-if="mobileOpen" class="mobile-nav card container">
        <RouterLink
          v-for="item in navItems"
          :key="item.label"
          class="mobile-nav-link"
          :to="item.to"
          @click="mobileOpen = false"
        >
          {{ item.label }}
        </RouterLink>
        <RouterLink class="mobile-nav-link" :to="{ name: 'admin-login' }" @click="mobileOpen = false">后台</RouterLink>
      </div>
    </header>

    <main>
      <RouterView />
    </main>

    <footer class="public-footer">
      <div class="container footer-grid">
        <div class="footer-brand-block">
          <strong class="footer-brand">Ada Blog</strong>
          <p class="footer-copy">记录 AI开发、架构实践、项目复盘和长期技术笔记。</p>
        </div>
        <div class="footer-meta">
          <span>Vue 3 + Node.js + SQLite</span>
          <span>内容优先 · 结构清晰</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.public-header {
  position: sticky;
  top: 0;
  z-index: 20;
  background: rgba(248, 250, 252, 0.92);
  backdrop-filter: blur(10px);
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 20px 0;
  border-bottom: 1px solid var(--line);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
}

.brand-copy strong,
.brand-copy small {
  display: block;
}

.brand-copy small {
  color: var(--text-soft);
}

.brand-mark {
  display: inline-grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 10px;
  overflow: hidden;
  background: var(--primary-soft);
  border: 1px solid var(--line);
}

.brand-mark-image {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.desktop-nav {
  display: flex;
  align-items: center;
  gap: 28px;
}

.nav-link {
  padding: 8px 0;
  color: var(--text-soft);
  border-bottom: 1px solid transparent;
  font-size: 15px;
}

.nav-link.active {
  color: var(--primary);
  border-color: var(--primary);
}

.admin-entry {
  margin-left: 10px;
  color: var(--primary);
  border-color: transparent;
}

.mobile-nav {
  margin-top: 12px;
  padding: 16px;
  display: grid;
  gap: 12px;
}

.mobile-menu-button {
  width: 44px;
  height: 44px;
  padding: 0;
  border-radius: 12px;
}

.menu-icon {
  position: relative;
  display: inline-grid;
  width: 18px;
  height: 14px;
}

.menu-icon span {
  position: absolute;
  left: 0;
  width: 100%;
  height: 2px;
  border-radius: 999px;
  background: currentColor;
  transition: transform 0.2s ease, opacity 0.2s ease, top 0.2s ease;
}

.menu-icon span:nth-child(1) {
  top: 0;
}

.menu-icon span:nth-child(2) {
  top: 6px;
}

.menu-icon span:nth-child(3) {
  top: 12px;
}

.menu-icon.open span:nth-child(1) {
  top: 6px;
  transform: rotate(45deg);
}

.menu-icon.open span:nth-child(2) {
  opacity: 0;
}

.menu-icon.open span:nth-child(3) {
  top: 6px;
  transform: rotate(-45deg);
}

.mobile-nav-link {
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.56);
}

.public-footer {
  margin-top: 64px;
  padding: 72px 0 40px;
  background: #0f172a;
  color: #94a3b8;
}

.footer-grid {
  display: grid;
  gap: 48px;
  grid-template-columns: minmax(0, 1fr) auto;
  padding: 0;
  border-top: 0;
}

.footer-brand {
  display: inline-block;
  margin-bottom: 8px;
  color: #fff;
}

.footer-copy {
  max-width: 560px;
  margin: 0;
  line-height: 1.8;
}

.footer-meta {
  display: grid;
  gap: 8px;
  justify-items: end;
  color: #94a3b8;
}

@media (max-width: 960px) {
  .desktop-nav {
    display: none;
  }

  .footer-grid {
    grid-template-columns: 1fr;
  }

  .footer-meta {
    justify-items: start;
  }
}
</style>
