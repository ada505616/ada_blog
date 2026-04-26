<template>
  <section class="container page-pad">
    <div class="card empty-state">
      <p class="eyebrow">404</p>
      <h1 class="section-title">你访问的页面不存在。</h1>
      <RouterLink class="button button-primary" :to="{ name: 'home' }">返回首页</RouterLink>
    </div>
  </section>
</template>

<style scoped>
.page-pad {
  padding: 40px 0 80px;
}
</style>
