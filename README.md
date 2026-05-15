# UI 设计师个人官网 - Supabase CMS 版

这是一个不自建后台页面的 CMS 架构：

- 前端：Vite + 原生 TypeScript
- 后端/CMS：Supabase 控制台
- 部署：Cloudflare Pages
- 内容来源：`homepage`、`projects`、`social_links`

## 1. 本地运行

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

打开：

- 首页：http://localhost:8787/
- 案例页：http://localhost:8787/case.html?case=coop
- 灵感库：http://localhost:8787/inspiration.html

> 如果你还没有配置 Supabase，页面会先用本地示例数据预览。

## 2. Supabase 初始化

1. 登录 Supabase，创建一个新项目。
2. 打开 SQL Editor。
3. 把 [supabase.sql](./supabase.sql) 全部粘贴进去运行。
4. 打开 Storage，确认有一个公开桶 `site-assets`。
5. 上传图片到 `site-assets`，然后把图片路径写进 `projects.cover_image_path` 和 `projects.detail_image_path`。
6. 在 `homepage.content` 里修改首页文字、导航、灵感库、页脚等内容。
7. 在 `social_links` 里改联系方式、社交链接。

## 3. 表结构

- `homepage`
  - `slug`
  - `content`（jsonb）
  - `is_active`
- `projects`
  - `slug`
  - `title`
  - `category`
  - `summary`
  - `layout_variant`
  - `cover_image_path`
  - `detail_image_path`
  - `detail_paragraphs`
  - `sort_order`
  - `published`
- `social_links`
  - `label`
  - `url`
  - `platform`
  - `icon`
  - `sort_order`
  - `is_active`

> 另外加了 `lead_submissions`，用于收集电话。

`homepage.content.inspiration.items` 的每一条灵感建议都包含：

- `slug`
- `title`
- `description`
- `body`（字符串数组）
- `ctaLabel`（按钮文案，可选）
- `ctaHref`（外链地址，可选）

`homepage.content.inspiration.detailButtonLabel` 是内容页按钮的默认文案，默认是 `立即前往`。

## 4. 内容怎么改

- 首页文案、导航、灵感库文案、页脚文案：改 `homepage.content`
- 灵感库列表页：访问 `/inspiration.html`
- 灵感库内容页：访问 `/inspiration.html?slug=xxx`
- 作品列表和详情：改 `projects`
  - 新增作品：在 `projects` 表新增一行
  - 删除作品：删除这一行，或把 `published` 设为 `false`
  - 调整顺序：改 `sort_order`
- 联系方式和外链：改 `social_links`
- 图片：先上传到 `site-assets`，再把路径写进对应项目

## 5. 部署到 Cloudflare Pages

1. 把这个仓库推到 GitHub。
2. 打开 Cloudflare Pages，选择 `Connect to Git`.
3. 选择这个仓库。
4. 构建命令填：

```bash
npm run build
```

5. 输出目录填：

```bash
dist
```

6. 添加环境变量：

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_STORAGE_BUCKET=site-assets`

7. 部署完成后，访问 Cloudflare Pages 给你的域名。

## 6. 这版的重点

- 没有 `/admin` 页面
- 首页、案例页、灵感库页都从 Supabase 读取
- 灵感库是独立列表页，不是下拉展开，列表页为上下结构，标题点击后进入内容页
- 作品和案例详情都能单独打开
- 你后面只需要改 Supabase，不用改前端代码
