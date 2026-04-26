<template>
  <section class="container page-pad">
    <div class="grid-two">
      <div class="card hero-panel">
        <p class="eyebrow">关于这个站点</p>
        <h1 class="section-title">从今天开始把内容沉淀下来</h1>
        <p class="muted">
          看看AI时代的技术发展有多快。这是一个围绕个人技术总结输出 设计的轻量博客。
        </p>
      </div>

      <div class="card about-card">
        <div class="stack">
          <div>
            <p class="eyebrow">技术栈</p>
            <h2 class="section-title">结构简单，但足够长期使用</h2>
          </div>
          <div class="stack muted">
            <span>前端：Vue 3 + Vue Router + Pinia + Editor.js</span>
            <span>后端：Node.js + Express + SQLite</span>
            <span>内容模型：文章 / 分类 / 标签 / 评论 / 资源库</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.page-pad {
  padding: 34px 0 60px;
}

.about-card {
  padding: 28px;
}
</style>
