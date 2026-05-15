# 从这里开始

你现在看到 Supabase 是空的，这是正常的。我们按最少步骤来：

## 第 1 步：建表

打开 [supabase-schema-only.sql](./supabase-schema-only.sql)

然后在 Supabase 里：
1. 点 `SQL Editor`
2. 点 `New query`
3. 把文件内容全部复制进去
4. 点 `Run`

跑完后，左边应该能看到这些表：
- `homepage`
- `projects`
- `social_links`
- `lead_submissions`

## 第 2 步：填作品

打开 [supabase-projects.sql](./supabase-projects.sql)

然后再做一次：
1. `SQL Editor`
2. `New query`
3. 复制进去
4. `Run`

这样作品列表就已经能在后台增删改了。

## 第 3 步：先别急着做别的

这时候网站已经可以先跑起来。作品会从 Supabase 读取，首页和灵感库还会先用本地默认内容兜底。

## 第 4 步：下一轮再连 GitHub 和 Cloudflare

等你告诉我“第 2 步完成”，我再带你把项目推到 GitHub，然后接 Cloudflare Pages 上线。
