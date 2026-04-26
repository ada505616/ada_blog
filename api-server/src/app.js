const express = require("express");
const path = require("path");
const cors = require("cors");
const env = require("./config/env");
const adminAuthRouter = require("./routes/admin/auth");
const adminArticlesRouter = require("./routes/admin/articles");
const adminCategoriesRouter = require("./routes/admin/categories");
const adminTagsRouter = require("./routes/admin/tags");
const adminCommentsRouter = require("./routes/admin/comments");
const adminMediaFilesRouter = require("./routes/admin/media-files");
const publicArticlesRouter = require("./routes/public/articles");
const publicTaxonomyRouter = require("./routes/public/taxonomy");
const publicCommentsRouter = require("./routes/public/comments");
const { notFoundHandler, errorHandler } = require("./middleware/error-handler");

const app = express();

app.set("trust proxy", 1);

app.use(
  cors({
    origin: env.corsOrigin === "*" ? true : env.corsOrigin.split(",").map((item) => item.trim())
  })
);
app.use(express.json({ limit: "2mb" }));
app.use("/uploads", express.static(path.resolve(env.uploadDir)));

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/admin/auth", adminAuthRouter);
app.use("/admin/articles", adminArticlesRouter);
app.use("/admin/categories", adminCategoriesRouter);
app.use("/admin/tags", adminTagsRouter);
app.use("/admin/comments", adminCommentsRouter);
app.use("/admin/media-files", adminMediaFilesRouter);

app.use("/articles", publicArticlesRouter);
app.use("/", publicTaxonomyRouter);
app.use("/", publicCommentsRouter);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
