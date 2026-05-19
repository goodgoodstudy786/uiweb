create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.homepage (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique default 'main',
  content jsonb not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category text not null,
  summary text not null,
  layout_variant text not null default 'image',
  cover_image_path text,
  cover_image_alt text,
  detail_image_path text,
  detail_image_alt text,
  detail_paragraphs jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.social_links (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  url text not null,
  platform text not null unique,
  icon text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.lead_submissions (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  source text not null,
  page_url text not null,
  created_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists trg_homepage_updated_at on public.homepage;
create trigger trg_homepage_updated_at
before update on public.homepage
for each row execute function public.set_updated_at();

drop trigger if exists trg_projects_updated_at on public.projects;
create trigger trg_projects_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

drop trigger if exists trg_social_links_updated_at on public.social_links;
create trigger trg_social_links_updated_at
before update on public.social_links
for each row execute function public.set_updated_at();

alter table public.homepage enable row level security;
alter table public.projects enable row level security;
alter table public.social_links enable row level security;
alter table public.lead_submissions enable row level security;

drop policy if exists "Public can read homepage" on public.homepage;
create policy "Public can read homepage"
  on public.homepage
  for select
  to anon, authenticated
  using (is_active);

drop policy if exists "Public can read projects" on public.projects;
create policy "Public can read projects"
  on public.projects
  for select
  to anon, authenticated
  using (published);

drop policy if exists "Public can read social links" on public.social_links;
create policy "Public can read social links"
  on public.social_links
  for select
  to anon, authenticated
  using (is_active);

drop policy if exists "Anyone can submit leads" on public.lead_submissions;
create policy "Anyone can submit leads"
  on public.lead_submissions
  for insert
  to anon, authenticated
  with check (true);

insert into public.homepage (slug, content, is_active)
values (
  'main',
  $json$
  {
    "meta": {
      "title": "京鹏JPENG 界面设计师",
      "description": "京鹏JPENG，界面设计师个人官网。展示产品界面设计、设计系统、作品案例、关于我与灵感收藏。"
    },
    "brand": {
      "line1": "京鹏JPENG",
      "line2": "界面设计师",
      "loaderLabel": "京鹏JPENG"
    },
    "navigationTitle": "导航",
    "worksSection": {
      "title": "作品",
      "badge": "精选项目",
      "pageHref": "/#works"
    },
    "navigation": [
      { "label": "首页", "href": "/" },
      { "label": "作品", "href": "/#works" },
      { "label": "关于我", "href": "/#about" },
      { "label": "灵感库", "href": "/inspiration.html" },
      { "label": "联系", "href": "/#contact" }
    ],
    "hero": {
      "titleLine1": "设计并交付。",
      "titleLine2": "周级，不等月。",
      "copy": "以产品思维、界面秩序和设计系统，把想法从模糊需求推进到可上线的高保真体验。",
      "ctaLabel": "查看作品",
      "ctaHref": "/#works"
    },
    "ticker": [
      "产品界面设计",
      "设计系统",
      "移动端体验",
      "企业端工作台",
      "原型交互",
      "高保真交付"
    ],
    "redBand": {
      "title": "我适合那些不仅需要执行，还需要一起定方向的团队。",
      "subtitle": "梳理问题，搭建界面，持续迭代。"
    },
    "capabilities": [
      "体验策略",
      "界面视觉",
      "原型交互",
      "组件规范",
      "数据看板",
      "移动应用",
      "品牌官网",
      "设计审查",
      "交付协作",
      "动效节奏",
      "信息层级",
      "上线走查"
    ],
    "about": {
      "eyebrow": "关于我",
      "titleBefore": "我不只是做漂亮界面的设计师。我的工作是把复杂需求整理成",
      "titleAccent": "清晰、可执行、可持续迭代",
      "titleAfter": "的产品体验。",
      "stats": [
        {
          "value": "8+",
          "title": "年经验",
          "description": "长期服务软件产品、智能工具、企业协作与消费应用项目。"
        },
        {
          "value": "32",
          "title": "上线项目",
          "description": "从需求梳理到高保真交付，覆盖完整产品设计流程。"
        },
        {
          "value": "6 套",
          "title": "设计系统",
          "description": "建立组件规范、视觉变量和团队协作的统一语言。"
        }
      ]
    },
    "services": {
      "eyebrow": "服务",
      "title": "端到端设计交付。一个人，也能像一间高效工作室。",
      "description": "从产品结构、视觉探索、组件体系到开发标注，把每一步都压缩到清晰节奏里。",
      "items": [
        {
          "step": "01",
          "title": "产品界面",
          "description": "为网页应用、移动端和后台系统建立清晰的信息层级、关键流程和视觉表达。"
        },
        {
          "step": "02",
          "title": "设计系统",
          "description": "定义颜色、字体、间距、组件状态和使用规则，让产品扩展时依然保持一致。"
        },
        {
          "step": "03",
          "title": "品牌官网",
          "description": "把个人、产品或团队的核心价值转换成强记忆点的官网叙事与视觉节奏。"
        },
        {
          "step": "04",
          "title": "交付协作",
          "description": "提供原型、标注、组件说明和走查记录，减少设计到开发之间的损耗。"
        }
      ]
    },
    "process": {
      "eyebrow": "工作方式",
      "title": "快速推进，但不跳过判断。",
      "items": [
        {
          "step": "01",
          "title": "对齐目标",
          "description": "确认产品阶段、用户角色、核心指标和设计边界，先把问题定义准确。"
        },
        {
          "step": "02",
          "title": "冲刺设计",
          "description": "用线框、关键页面和交互原型快速验证方向，在高保真之前排除误差。"
        },
        {
          "step": "03",
          "title": "系统化交付",
          "description": "沉淀组件、状态、规范和页面模板，让后续迭代不必重新开始。"
        },
        {
          "step": "04",
          "title": "上线走查",
          "description": "跟进开发还原、移动端适配、异常状态和细节体验，确保真的落地。"
        }
      ]
    },
    "inspiration": {
      "eyebrow": "收藏灵感库",
      "titleLine1": "持续收藏，",
      "titleLine2": "会被下一次项目用上的设计观察。",
      "description": "不按时间排列，只留下值得反复打开的界面、系统和交互想法。",
      "detailButtonLabel": "立即前往",
      "pageHref": "/inspiration.html",
      "items": [
        {
          "slug": "immersive-workbench",
          "title": "沉浸式工作台布局",
          "description": "用分层的布局把信息、动作和状态放在同一视线带，减少来回找按钮的时间。",
          "body": [
            "把信息、动作和状态放进同一条视线带里，先减少切换，再谈效率。",
            "这种做法适合多步骤的管理后台和高频协作场景，让用户一眼看到下一步该做什么。"
          ],
          "ctaLabel": "立即前往",
          "ctaHref": "https://example.com"
        },
        {
          "slug": "state-naming",
          "title": "组件状态命名",
          "description": "把默认、悬停、选中、禁用这些状态统一成一套命名，能让团队沟通更快一点。",
          "body": [
            "默认、悬停、选中、禁用等状态最好用同一套命名规则来表达，设计、开发和评审时都更容易对齐。",
            "当状态命名稳定后，组件文档也会更清楚，后续补新状态时不容易打乱结构。"
          ],
          "ctaLabel": "立即前往",
          "ctaHref": "https://example.com"
        },
        {
          "slug": "empty-state-emotion",
          "title": "空状态的情绪设计",
          "description": "空状态不只补信息，也要给用户一个明确的下一步，不让页面显得太冷。",
          "body": [
            "空状态不只补信息，也要给用户一个明确的下一步，不让页面显得太冷。",
            "当没有内容时，依然应该保留方向感、鼓励感和可继续行动的入口。"
          ],
          "ctaLabel": "立即前往",
          "ctaHref": "https://example.com"
        },
        {
          "slug": "low-saturation-system",
          "title": "低饱和撞色系统",
          "description": "把高识别颜色放在关键按钮和重点信息上，其余区域保持安静，画面会更稳。",
          "body": [
            "把高识别颜色放在关键按钮和重点信息上，其余区域保持安静，画面会更稳。",
            "这种配色方式适合信息密度较高的界面，让视觉重心更集中，也更利于长期浏览。"
          ],
          "ctaLabel": "立即前往",
          "ctaHref": "https://example.com"
        }
      ]
    },
    "cta": {
      "eyebrow": "你的产品，离清晰体验只差一次对齐。",
      "titleLine1": "停止等待。",
      "titleLine2": "开始设计。",
      "description": "把你的项目背景发给我，我会在 24 小时内回复设计路径、范围和合作方式。",
      "buttonLabel": "开始项目",
      "buttonHref": "/#works"
    },
    "contact": {
      "intro": "留下联系方式，我会把合作回复和作品更新发给你。",
      "placeholder": "你的联系方式",
      "buttonLabel": "联系我",
      "feedback": "已收到，我会尽快联系你。"
    },
    "footer": {
      "brandDescription": "专注产品界面、设计系统、品牌官网和高质量设计交付。",
      "servicesTitle": "服务",
      "servicesLinks": [
        { "label": "产品界面", "href": "/#works" },
        { "label": "关于我", "href": "/#about" },
        { "label": "灵感收藏", "href": "/inspiration.html" }
      ],
      "contactTitle": "联系",
      "copyright": "© 2026 京鹏JPENG。保留所有权利。",
      "email": "hello@ruoan.design"
    },
    "leadModal": {
      "title": "留下电话，我会尽快联系你。",
      "description": "填写手机号后提交到后台，方便我直接回复你的项目需求。",
      "inputPlaceholder": "请输入手机号",
      "submitLabel": "提交"
    }
  }
  $json$::jsonb,
  true
)
on conflict (slug) do update
set content = excluded.content,
    is_active = excluded.is_active,
    updated_at = timezone('utc', now());

insert into public.projects (
  slug,
  title,
  category,
  summary,
  layout_variant,
  cover_image_path,
  cover_image_alt,
  detail_image_path,
  detail_image_alt,
  detail_paragraphs,
  sort_order,
  published
)
values
(
  'coop',
  '协作平台体验重构',
  '协作平台 / 工作台',
  '把任务、权限、交付和版本记录收进一个更容易扫描的工作台。',
  'feature',
  null,
  '协作平台封面',
  null,
  '协作平台详情',
  '["把任务、权限、交付和版本记录收进一个更容易扫描的工作台，减少跳转，让团队协作更顺手。","这个版本的重点是重新整理信息层级，让最常用的动作先出现在视线里，再用更稳定的组件状态承接后续协作。"]'::jsonb,
  1,
  true
),
(
  'growth',
  '增长数据工作台',
  '数据可视化 / 仪表盘',
  '把分散的指标、趋势和异常提示收进更高密度的看板。',
  'dashboard',
  null,
  '增长数据封面',
  null,
  '增长数据详情',
  '["把分散的指标、趋势和异常提示收进更高密度的看板，帮助运营和产品更快做判断。","这个页面重点不是塞满数据，而是把最关键的数字放在第一眼能读到的位置，同时保留继续下钻的路径。"]'::jsonb,
  2,
  true
),
(
  'mobile',
  '生活方式移动应用',
  '移动界面 / 会员体系',
  '把会员中心、内容推荐和日常任务合并成更轻的手机体验。',
  'mobile',
  null,
  '移动应用封面',
  null,
  '移动应用详情',
  '["把会员中心、内容推荐和日常任务合并成更轻的手机体验，让操作更快，也更愿意停留。","尽量缩短每一步的决策成本，让浏览、选择和确认都能在移动端顺畅完成。"]'::jsonb,
  3,
  true
)
on conflict (slug) do update
set title = excluded.title,
    category = excluded.category,
    summary = excluded.summary,
    layout_variant = excluded.layout_variant,
    cover_image_path = excluded.cover_image_path,
    cover_image_alt = excluded.cover_image_alt,
    detail_image_path = excluded.detail_image_path,
    detail_image_alt = excluded.detail_image_alt,
    detail_paragraphs = excluded.detail_paragraphs,
    sort_order = excluded.sort_order,
    published = excluded.published,
    updated_at = timezone('utc', now());

insert into public.social_links (label, url, platform, icon, sort_order, is_active)
values
  ('邮箱', 'mailto:hello@ruoan.design', 'email', null, 1, true),
  ('站酷', '#', 'zcool', null, 2, true),
  ('小红书', '#', 'rednote', null, 3, true),
  ('Behance', '#', 'behance', null, 4, true)
on conflict (platform) do update
set label = excluded.label,
    url = excluded.url,
    icon = excluded.icon,
    sort_order = excluded.sort_order,
    is_active = excluded.is_active,
    updated_at = timezone('utc', now());

insert into storage.buckets (id, name, public)
values ('site-assets', 'site-assets', true)
on conflict (id) do update
set public = true;
