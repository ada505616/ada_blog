import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { setHead } from "../utils/head";

const routes = [
  {
    path: "/",
    component: () => import("../layouts/PublicLayout.vue"),
    children: [
      { path: "", name: "home", component: () => import("../pages/public/HomePage.vue"), meta: { title: "首页" } },
      { path: "article/:slug", name: "article-detail", component: () => import("../pages/public/ArticleDetailPage.vue"), meta: { title: "文章详情" } },
      { path: "categories", name: "categories", component: () => import("../pages/public/CategoriesPage.vue"), meta: { title: "分类" } },
      { path: "categories/:slug", name: "category-detail", component: () => import("../pages/public/CategoriesPage.vue"), meta: { title: "分类详情" } },
      { path: "tags", name: "tags", component: () => import("../pages/public/TagsPage.vue"), meta: { title: "标签" } },
      { path: "tags/:slug", name: "tag-detail", component: () => import("../pages/public/TagsPage.vue"), meta: { title: "标签详情" } },
      { path: "archive", name: "archive", component: () => import("../pages/public/ArchivePage.vue"), meta: { title: "归档" } },
      { path: "about", name: "about", component: () => import("../pages/public/AboutPage.vue"), meta: { title: "关于" } }
    ]
  },
  {
    path: "/admin/login",
    name: "admin-login",
    component: () => import("../pages/admin/LoginPage.vue"),
    meta: { guestOnly: true }
  },
  {
    path: "/admin",
    component: () => import("../layouts/AdminLayout.vue"),
    meta: { requiresAuth: true },
    children: [
      { path: "", name: "admin-dashboard", component: () => import("../pages/admin/DashboardPage.vue"), meta: { title: "仪表盘" } },
      { path: "articles", name: "admin-articles", component: () => import("../pages/admin/ArticlesPage.vue"), meta: { title: "文章管理" } },
      { path: "articles/new", name: "admin-article-create", component: () => import("../pages/admin/ArticleEditorPage.vue"), meta: { title: "新建文章" } },
      { path: "articles/:id/edit", name: "admin-article-edit", component: () => import("../pages/admin/ArticleEditorPage.vue"), meta: { title: "编辑文章" } },
      { path: "categories", name: "admin-categories", component: () => import("../pages/admin/CategoriesPage.vue"), meta: { title: "分类管理" } },
      { path: "tags", name: "admin-tags", component: () => import("../pages/admin/TagsPage.vue"), meta: { title: "标签管理" } },
      { path: "comments", name: "admin-comments", component: () => import("../pages/admin/CommentsPage.vue"), meta: { title: "评论管理" } },
      { path: "media", name: "admin-media", component: () => import("../pages/admin/MediaPage.vue"), meta: { title: "资源管理" } }
    ]
  },
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: () => import("../pages/public/NotFoundPage.vue")
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 };
  }
});

router.beforeEach(async (to) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: "admin-login", query: { redirect: to.fullPath } };
  }

  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return { name: "admin-dashboard" };
  }

  return true;
});

router.afterEach((to) => {
  setHead({
    title: to.meta.title,
    description: to.meta.description
  });
});

export default router;
