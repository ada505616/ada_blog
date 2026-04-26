function mapArticleListItem(row) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    coverImageUrl: row.cover_image_url,
    author: {
      id: row.author_id,
      username: row.author_username,
      nickname: row.author_nickname
    },
    category: row.category_id
      ? {
          id: row.category_id,
          name: row.category_name,
          slug: row.category_slug
        }
      : null,
    contentType: row.content_type,
    status: row.status,
    isTop: row.is_top === 1,
    allowComment: row.allow_comment === 1,
    viewCount: row.view_count,
    commentCount: row.comment_count,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapArticleDetail(row, tags = []) {
  return {
    ...mapArticleListItem(row),
    contentJson: parseJson(row.content_json),
    contentHtml: row.content_html,
    contentText: row.content_text,
    deletedAt: row.deleted_at,
    tags
  };
}

function parseJson(value) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return value;
  }
}

module.exports = {
  mapArticleListItem,
  mapArticleDetail
};
