const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const { randomUUID } = require("node:crypto");

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const UPLOAD_DIR = path.join(ROOT, "uploads");
const SITE_FILE = path.join(DATA_DIR, "site.json");
const LEADS_FILE = path.join(DATA_DIR, "leads.json");
const PORT = Number(process.env.PORT || 8787);

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("`", "&#96;");
}

function escapeScriptJson(value) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

function chunk(list, size) {
  const output = [];
  for (let index = 0; index < list.length; index += size) {
    output.push(list.slice(index, index + size));
  }
  return output;
}

function ensureArray(value, fallback = []) {
  return Array.isArray(value) ? value : fallback;
}

async function ensureDirectories() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

async function loadJson(filePath, fallback) {
  try {
    const text = await fs.readFile(filePath, "utf8");
    return JSON.parse(text);
  } catch (error) {
    return fallback;
  }
}

async function saveJson(filePath, value) {
  const text = `${JSON.stringify(value, null, 2)}\n`;
  await fs.writeFile(filePath, text, "utf8");
}

async function loadSiteData() {
  return loadJson(SITE_FILE, {
    meta: {
      title: "京鹏JPENG 界面设计师",
      description: "京鹏JPENG，界面设计师个人官网。",
    },
    brand: {
      line1: "京鹏JPENG",
      line2: "界面设计师",
      loaderLabel: "京鹏JPENG",
    },
    navigationTitle: "导航",
    worksSection: {
      title: "作品",
      badge: "精选项目",
    },
    navigation: [],
    hero: {
      titleLine1: "设计并交付。",
      titleLine2: "周级，不等月。",
      copy: "以产品思维、界面秩序和设计系统，把想法从模糊需求推进到可上线的高保真体验。",
      ctaLabel: "查看作品",
    },
    ticker: [],
    redBand: {
      title: "我适合那些不只需要执行，还需要一起定义方向的团队。",
      subtitle: "梳理问题，搭建界面，持续迭代。",
    },
    capabilities: [],
    works: [],
    about: {
      eyebrow: "关于我",
      titleBefore: "我不是只做漂亮界面的设计师。我的工作是把复杂需求整理成",
      titleAccent: "清晰、可执行、可持续迭代",
      titleAfter: "的产品体验。",
      stats: [],
    },
    services: {
      eyebrow: "服务",
      title: "端到端设计交付。一个人，也能像一间高效工作室。",
      description: "从产品结构、视觉探索、组件体系到开发标注，把每一步都压缩到清晰节奏里。",
      items: [],
    },
    process: {
      eyebrow: "工作方式",
      title: "快速推进，但不跳过判断。",
      items: [],
    },
    inspiration: {
      eyebrow: "收藏灵感库",
      titleLine1: "持续收藏，",
      titleLine2: "会被下一次项目用上的设计观察。",
      description: "不按时间排列，只留下值得反复打开的界面、系统和交互想法。",
      items: [],
    },
    cta: {
      eyebrow: "你的产品，离清晰体验只差一次对齐。",
      titleLine1: "停止等待。",
      titleLine2: "开始设计。",
      description: "把你的项目背景发给我，我会在 24 小时内回复设计路径、范围和合作方式。",
      buttonLabel: "开始项目",
    },
    contact: {
      intro: "留下你的联系方式，我会把合作回复和作品更新发给你。",
      placeholder: "你的联系方式",
      buttonLabel: "联系我",
      feedback: "已收到，我会尽快联系你。",
    },
    footer: {
      brandDescription: "专注产品界面、设计系统、品牌官网和高质量设计交付。",
      servicesTitle: "服务",
      servicesLinks: [],
      contactTitle: "联系",
      contactLinks: [],
      copyright: "© 2026 京鹏JPENG。保留所有权利。",
      email: "hello@ruoan.design",
    },
    leadModal: {
      title: "留下电话，我会尽快联系你。",
      description: "填写手机号后提交到后台，方便我直接回复你的项目需求。",
      inputPlaceholder: "请输入手机号",
      submitLabel: "提交",
    },
    cases: [],
  });
}

async function loadLeads() {
  return loadJson(LEADS_FILE, []);
}

function renderBrowserBar(label) {
  return `
    <div class="browser-bar">
      <span></span><span></span><span></span><em>${escapeHtml(label || "")}</em>
    </div>
  `;
}

function renderFeatureVisual(visual, compact = false) {
  const sideItems = ensureArray(visual.sidebarItems);
  const stats = ensureArray(visual.stats);
  const dots = compact ? 3 : 5;
  const title = visual.sidebarTitle || "项目中心";
  const highlightLabel = visual.highlightLabel || "本周重点";
  const highlightValue = visual.highlightValue || "上线前走查";
  const shellClass = compact
    ? "case-cover-art case-cover-art--coop"
    : "work-shot feature-shot";

  return `
    <div class="${shellClass}" role="img" aria-label="${escapeAttr(visual.browserLabel || title)}">
      ${renderBrowserBar(visual.browserLabel || "协作平台 / 工作台")}
      ${
        compact
          ? `
        <div class="case-cover-layout">
          <strong>${escapeHtml(title)}</strong>
          <div class="case-cover-row">
            ${(sideItems.slice(0, 3).length ? sideItems.slice(0, 3) : ["任务", "权限", "交付"])
              .map(() => "<i></i>")
              .join("")}
          </div>
          <div class="case-cover-chip">${escapeHtml(highlightValue)}</div>
        </div>
      `
          : `
        <div class="feature-layout">
          <aside>
            <strong>${escapeHtml(title)}</strong>
            ${sideItems.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
          </aside>
          <div class="feature-main">
            <div class="mock-row">
              <p>${escapeHtml(highlightLabel)}</p>
              <b>${escapeHtml(highlightValue)}</b>
            </div>
            <div class="mock-grid">
              ${stats
                .map(
                  (stat) => `
                <section>
                  <span>${escapeHtml(stat.label)}</span>
                  <strong>${escapeHtml(stat.value)}</strong>
                </section>
              `,
                )
                .join("")}
            </div>
            <div class="timeline">${Array.from({ length: dots })
              .map(() => "<i></i>")
              .join("")}</div>
          </div>
        </div>
      `
      }
    </div>
  `;
}

function renderDashboardVisual(visual, compact = false) {
  const bars = ensureArray(visual.bars, [34, 58, 44, 86, 49, 61]);
  const metrics = ensureArray(visual.metrics, ["访问 48.6万", "转化 12.8%", "留存 71%"]);
  const shellClass = compact
    ? "case-cover-art case-cover-art--growth"
    : "work-shot dashboard-shot";
  const barsHtml = bars
    .map((bar) => `<i style="height:${bar}%"></i>`)
    .join("");

  return `
    <div class="${shellClass}" role="img" aria-label="${escapeAttr(visual.browserLabel || visual.chartTitle || "数据仪表盘")}">
      ${renderBrowserBar(visual.browserLabel || "增长数据 / 仪表盘")}
      ${
        compact
          ? `
        <div class="case-cover-chart">${barsHtml}</div>
        <div class="case-cover-strip">${metrics.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>
      `
          : `
        <div class="chart-panel">
          <strong>${escapeHtml(visual.chartTitle || "转化趋势")}</strong>
          <div class="bars">${barsHtml}</div>
        </div>
        <div class="metric-strip">${metrics.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>
      `
      }
    </div>
  `;
}

function renderMobileVisual(visual, compact = false) {
  const listCount = Number(visual.listCount || 3);
  const shellClass = compact
    ? "case-cover-art case-cover-art--mobile"
    : "work-shot mobile-shot";
  const listHtml = Array.from({ length: listCount })
    .map(() => "<i></i>")
    .join("");

  return `
    <div class="${shellClass}" role="img" aria-label="${escapeAttr(visual.browserLabel || visual.phoneTitle || "移动应用")}">
      ${renderBrowserBar(visual.browserLabel || "生活方式 / 移动端")}
      ${
        compact
          ? `
        <div class="case-cover-phone">
          <span>${escapeHtml(visual.phoneLabel || "会员中心")}</span>
          <strong>${escapeHtml(visual.phoneTitle || "今日灵感")}</strong>
          <div class="case-cover-phone-card">${escapeHtml(visual.phoneCard || "已完成 3 个任务")}</div>
        </div>
      `
          : `
        <div class="phone">
          <span>${escapeHtml(visual.phoneLabel || "会员中心")}</span>
          <strong>${escapeHtml(visual.phoneTitle || "今日灵感")}</strong>
          <div class="phone-card">${escapeHtml(visual.phoneCard || "已完成 3 个任务")}</div>
          <div class="phone-list">${listHtml}</div>
        </div>
      `
      }
    </div>
  `;
}

function renderImageVisual(visual, compact = false) {
  const imageUrl = visual.imageUrl || "";
  const alt = visual.imageAlt || visual.browserLabel || visual.title || "作品图";
  const shellClass = compact
    ? "case-cover-art case-cover-art--image"
    : "work-shot image-shot";

  return `
    <div class="${shellClass}" role="img" aria-label="${escapeAttr(alt)}">
      ${
        imageUrl
          ? `<img src="${escapeAttr(imageUrl)}" alt="${escapeAttr(alt)}" />`
          : `<div class="image-shot-placeholder">${escapeHtml(alt)}</div>`
      }
    </div>
  `;
}

function renderVisual(visual, compact = false) {
  if (!visual || typeof visual !== "object") {
    return "";
  }

  switch (visual.variant) {
    case "feature":
      return renderFeatureVisual(visual, compact);
    case "dashboard":
      return renderDashboardVisual(visual, compact);
    case "mobile":
      return renderMobileVisual(visual, compact);
    case "image":
      return renderImageVisual(visual, compact);
    default:
      return compact
        ? renderImageVisual({ imageAlt: visual.browserLabel || "作品封面" }, true)
        : renderImageVisual({ imageAlt: visual.browserLabel || "作品视觉" }, false);
  }
}

function renderWorkFeature(work) {
  return `
    <div class="work-feature">
      <a class="work-link" href="${escapeAttr(work.href || "#")}" aria-label="打开${escapeAttr(work.title)}内页">
        <figure class="work-media">
          ${renderVisual(work.visual, false)}
          <figcaption>${escapeHtml(work.title)}</figcaption>
        </figure>
      </a>
      <p class="work-meta">${escapeHtml(work.meta || "")}</p>
    </div>
  `;
}

function renderWorkCard(work) {
  return `
    <a class="work-card" href="${escapeAttr(work.href || "#")}" aria-label="打开${escapeAttr(work.title)}内页">
      ${renderVisual(work.visual, false)}
      <div class="work-caption">
        <h3>${escapeHtml(work.title)}</h3>
        <p>${escapeHtml(work.meta || "")}</p>
      </div>
    </a>
  `;
}

function renderWorksSection(site) {
  const works = ensureArray(site.works);
  const worksTitle = site.worksSection?.title || "作品";
  const worksBadge = site.worksSection?.badge || "精选项目";
  const [featured, ...rest] = works;
  const grouped = chunk(rest, 2);

  return `
    <section class="section works" id="works" aria-labelledby="works-title">
      <div class="section-head">
        <h2 id="works-title">${escapeHtml(worksTitle)}</h2>
        <p><span></span>${escapeHtml(worksBadge)}</p>
      </div>

      ${featured ? renderWorkFeature(featured) : ""}

      ${grouped
        .map((pair) => `<div class="work-pair">${pair.map(renderWorkCard).join("")}</div>`)
        .join("")}

      <button class="center-link text-link js-start-project" type="button" aria-haspopup="dialog" aria-controls="lead-modal">
        预约项目沟通
      </button>
    </section>
  `;
}

function renderStats(stats) {
  return ensureArray(stats)
    .map(
      (item) => `
        <article>
          <strong>${escapeHtml(item.value || "")}</strong>
          <h3>${escapeHtml(item.title || "")}</h3>
          <p>${escapeHtml(item.description || "")}</p>
        </article>
      `,
    )
    .join("");
}

function renderServices(items) {
  return ensureArray(items)
    .map(
      (item) => `
        <article>
          <span>${escapeHtml(item.step || "")}</span>
          <h3>${escapeHtml(item.title || "")}</h3>
          <p>${escapeHtml(item.description || "")}</p>
        </article>
      `,
    )
    .join("");
}

function renderInspirationItems(items, options = {}) {
  const { linked = false, compact = false, pageHref = "/inspiration.html" } = options;
  const list = ensureArray(items);

  if (!list.length) {
    return `<div class="inspiration-empty">还没有灵感条目。</div>`;
  }

  return list
    .map((item, index) => {
      const itemId = `inspiration-item-${index + 1}`;
      const href = linked ? `${pageHref}#${itemId}` : null;
      const tag = linked ? "a" : "article";
      const title = item.title || "";
      const description = item.description || "";
      const classes = [
        "inspiration-item",
        compact ? "inspiration-item--compact" : "",
        linked ? "inspiration-item--link" : "",
      ]
        .filter(Boolean)
        .join(" ");

      return `
        <${tag}
          class="${classes}"
          ${linked ? `href="${escapeAttr(href)}"` : ""}
          ${!linked ? `id="${escapeAttr(itemId)}"` : `id="${escapeAttr(itemId)}"`}
          ${linked ? `aria-label="${escapeAttr(`查看灵感：${title}`)}"` : ""}
        >
          <span class="inspiration-icon" aria-hidden="true"></span>
          <div class="inspiration-body">
            <strong>${escapeHtml(title)}</strong>
            <p>${escapeHtml(description)}</p>
          </div>
        </${tag}>
      `;
    })
    .join("");
}

function renderInspirationSection(site) {
  return `
      <section class="section inspiration reveal" aria-labelledby="inspiration-title">
        <div class="inspiration-copy">
          <p class="tiny-label">${escapeHtml(site.inspiration?.eyebrow || "收藏灵感库")}</p>
          <h2 id="inspiration-title">
            ${escapeHtml(site.inspiration?.titleLine1 || "持续收藏，")}<br />
            ${escapeHtml(site.inspiration?.titleLine2 || "会被下一次项目用上的设计观察。")}
          </h2>
          <p>${escapeHtml(site.inspiration?.description || "")}</p>
          <a class="text-link" href="/inspiration.html">查看灵感库</a>
        </div>
        <div class="inspiration-list">
          ${renderInspirationItems(site.inspiration?.items, {
            linked: true,
            compact: true,
            pageHref: "/inspiration.html",
          })}
        </div>
      </section>
  `;
}

function renderFooterLinks(items) {
  return ensureArray(items)
    .map((item) => `<a href="${escapeAttr(item.href || "#")}">${escapeHtml(item.label || "")}</a>`)
    .join("");
}

function renderMenu(site, homeHref = "#top") {
  const links = ensureArray(site.navigation)
    .map((item) => {
      const href = String(item.href || homeHref || "#top");
      const resolved = href.startsWith("#") && homeHref.startsWith("/") ? `/${href}` : href;
      return `<a href="${escapeAttr(resolved)}">${escapeHtml(item.label || "")}</a>`;
    })
    .join("");

  return `
    <nav class="menu-panel" aria-label="主导航">
      <div class="menu-panel-inner">
        <p class="tiny-label">${escapeHtml(site.navigationTitle || "导航")}</p>
        ${links}
      </div>
    </nav>
  `;
}

function renderHeader(site, homeHref = "#top") {
  return `
    <header class="site-header">
      <a class="brand" href="${escapeAttr(homeHref)}" aria-label="返回首页">
        <span class="logo-mark">
          <span></span><span></span><span></span><span></span>
        </span>
        <span class="brand-name">${escapeHtml(site.brand?.line1 || "京鹏JPENG")}<br />${escapeHtml(site.brand?.line2 || "界面设计师")}</span>
      </a>

      <button class="menu-button" type="button" aria-label="打开菜单" aria-expanded="false">
        <span></span>
        <span></span>
        <span></span>
      </button>
    </header>
  `;
}

function renderLeadModal(site) {
  return `
    <div class="lead-modal" id="lead-modal" hidden>
      <div class="lead-modal-backdrop" data-lead-close></div>
      <div
        class="lead-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-modal-title"
        aria-describedby="lead-modal-desc"
      >
        <button class="lead-modal-close" type="button" aria-label="关闭弹窗" data-lead-close>
          ×
        </button>
        <p class="tiny-label">开始项目</p>
        <h3 id="lead-modal-title">${escapeHtml(site.leadModal?.title || "留下电话，我会尽快联系你。")}</h3>
        <p id="lead-modal-desc">${escapeHtml(site.leadModal?.description || "填写手机号后提交到后台，方便我直接回复你的项目需求。")}</p>
        <form class="lead-form">
          <label for="lead-phone">电话</label>
          <input
            id="lead-phone"
            name="phone"
            type="tel"
            inputmode="tel"
            autocomplete="tel"
            placeholder="${escapeAttr(site.leadModal?.inputPlaceholder || "请输入手机号")}"
            required
          />
          <button type="submit">${escapeHtml(site.leadModal?.submitLabel || "提交")}</button>
        </form>
        <p class="lead-feedback" aria-live="polite"></p>
      </div>
    </div>
  `;
}

function renderHomePage(site) {
  const tickerItems = ensureArray(site.ticker);
  const tickerCycle = tickerItems.map((item) => `<span>${escapeHtml(item)}</span><i></i>`).join("");
  const tickerTrack = `${tickerCycle}${tickerCycle}`;

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="${escapeAttr(site.meta?.description || "")}" />
    <title>${escapeHtml(site.meta?.title || "京鹏JPENG 界面设计师")}</title>
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body>
    <div class="loader" aria-hidden="true">
      <div class="logo-mark loader-mark">
        <span></span><span></span><span></span><span></span>
      </div>
      <p>${escapeHtml(site.brand?.loaderLabel || "京鹏JPENG")}</p>
    </div>

    ${renderHeader(site, "#top")}
    ${renderMenu(site, "#top")}

    <main id="top">
      <section class="hero" aria-labelledby="hero-title">
        <div class="hero-glow"></div>
        <div class="hero-inner">
          <div class="hero-title-wrap">
            <h1 id="hero-title">
              ${escapeHtml(site.hero?.titleLine1 || "设计并交付。")}<br />
              <span>${escapeHtml(site.hero?.titleLine2 || "周级，不等月。")}</span>
            </h1>
          </div>
          <div class="hero-copy">
            <p>${escapeHtml(site.hero?.copy || "")}</p>
            <a class="text-link" href="#works">${escapeHtml(site.hero?.ctaLabel || "查看作品")}</a>
          </div>
        </div>
      </section>

      <div class="ticker" aria-label="服务标签">
        <div class="ticker-track">${tickerTrack}</div>
      </div>

      <section class="red-band" aria-label="合作宣言">
        <div>
          <h2>${escapeHtml(site.redBand?.title || "")}</h2>
          <p>${escapeHtml(site.redBand?.subtitle || "")}</p>
        </div>
        <div class="band-mark" aria-hidden="true">
          <span></span><span></span><span></span><span></span><span></span>
        </div>
      </section>

      <section class="client-grid" aria-label="能力矩阵">
        ${ensureArray(site.capabilities)
          .map((item) => `<div>${escapeHtml(item)}</div>`)
          .join("")}
      </section>

      ${renderWorksSection(site)}

      <section class="section about" id="about" aria-labelledby="about-title">
        <p class="tiny-label">${escapeHtml(site.about?.eyebrow || "关于我")}</p>
        <h2 id="about-title">
          ${escapeHtml(site.about?.titleBefore || "")}
          <span>${escapeHtml(site.about?.titleAccent || "")}</span>
          ${escapeHtml(site.about?.titleAfter || "")}
        </h2>

        <div class="stats">
          ${renderStats(site.about?.stats)}
        </div>
      </section>

      <section class="section services" aria-labelledby="services-title">
        <div class="service-intro">
          <p class="tiny-label">${escapeHtml(site.services?.eyebrow || "服务")}</p>
          <h2 id="services-title">${escapeHtml(site.services?.title || "")}</h2>
          <p>${escapeHtml(site.services?.description || "")}</p>
        </div>

        <div class="service-rail">
          ${renderServices(site.services?.items)}
        </div>
      </section>

      <section class="section process" aria-labelledby="process-title">
        <p class="tiny-label">${escapeHtml(site.process?.eyebrow || "工作方式")}</p>
        <h2 id="process-title">${escapeHtml(site.process?.title || "")}</h2>
        <div class="process-list">
          ${renderServices(site.process?.items)}
        </div>
      </section>

      ${renderInspirationSection(site)}

      <section class="final-cta" aria-labelledby="cta-title">
        <p class="tiny-label">${escapeHtml(site.cta?.eyebrow || "")}</p>
        <h2 id="cta-title">
          ${escapeHtml(site.cta?.titleLine1 || "")}<span>${escapeHtml(site.cta?.titleLine2 || "")}</span>
        </h2>
        <div>
          <p>${escapeHtml(site.cta?.description || "")}</p>
          <button class="pill-link js-start-project" type="button" aria-haspopup="dialog" aria-controls="lead-modal">
            ${escapeHtml(site.cta?.buttonLabel || "开始项目")}
          </button>
        </div>
      </section>
    </main>

    <footer class="site-footer" id="contact">
      <div class="footer-top">
        <div>
          <p class="tiny-label">联系</p>
          <p>${escapeHtml(site.contact?.intro || "")}</p>
        </div>
        <form class="contact-form">
          <label for="contact-info">联系方式</label>
          <input id="contact-info" type="text" placeholder="${escapeAttr(site.contact?.placeholder || "你的联系方式")}" />
          <button type="submit">${escapeHtml(site.contact?.buttonLabel || "联系我")}</button>
        </form>
        <p class="contact-feedback" aria-live="polite"></p>
      </div>
      <div class="footer-main">
        <div>
          <a class="brand footer-brand" href="#top" aria-label="返回首页">
            <span class="logo-mark">
              <span></span><span></span><span></span><span></span>
            </span>
            <span class="brand-name">${escapeHtml(site.brand?.line1 || "京鹏JPENG")}<br />${escapeHtml(site.brand?.line2 || "界面设计师")}</span>
          </a>
          <p>${escapeHtml(site.footer?.brandDescription || "")}</p>
        </div>
        <div>
          <p class="tiny-label">${escapeHtml(site.footer?.servicesTitle || "服务")}</p>
          ${renderFooterLinks(site.footer?.servicesLinks)}
        </div>
        <div>
          <p class="tiny-label">${escapeHtml(site.footer?.contactTitle || "联系")}</p>
          ${renderFooterLinks(site.footer?.contactLinks)}
        </div>
      </div>
      <div class="footer-bottom">
        <p>${escapeHtml(site.footer?.copyright || "")}</p>
        <a href="mailto:${escapeAttr(site.footer?.email || "hello@ruoan.design")}">${escapeHtml(site.footer?.email || "hello@ruoan.design")}</a>
      </div>
    </footer>

    ${renderLeadModal(site)}

    <script>
      window.__SITE_DATA__ = ${escapeScriptJson(site)};
      window.__CONTACT_SUBMIT_URL__ = "/api/lead";
    </script>
    <script src="/script.js"></script>
  </body>
</html>`;
}

function renderCaseCoverVisual(visual) {
  return renderVisual(visual, true);
}

function renderCasePage(site, caseItem) {
  const cases = ensureArray(site.cases);
  const others = cases.filter((item) => item.id !== caseItem.id);
  const related = others
    .map(
      (item) => `
        <a class="case-card reveal" href="/case.html?case=${escapeAttr(item.id)}" aria-label="打开${escapeAttr(item.title)}">
          <figure class="case-card-cover">${renderCaseCoverVisual(item.visual)}</figure>
          <div class="case-card-body">
            <h3>${escapeHtml(item.title)}</h3>
          </div>
        </a>
      `,
    )
    .join("");

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="${escapeAttr(site.meta?.description || "")}" />
    <title>${escapeHtml(caseItem.title)} / ${escapeHtml(site.meta?.title || "京鹏JPENG 界面设计师")}</title>
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body class="case-page">
    <div class="loader" aria-hidden="true">
      <div class="logo-mark loader-mark">
        <span></span><span></span><span></span><span></span>
      </div>
      <p>${escapeHtml(site.brand?.loaderLabel || "京鹏JPENG")}</p>
    </div>

    ${renderHeader(site, "/")}
    ${renderMenu(site, "/")}

    <main id="case-root">
      <section class="section case-hero reveal" aria-labelledby="${escapeAttr(caseItem.id)}-title">
        <p class="tiny-label">案例类型 · ${escapeHtml(caseItem.type || "")}</p>
        <div class="case-hero-head">
          <h1 id="${escapeAttr(caseItem.id)}-title">${escapeHtml(caseItem.title || "")}</h1>
          <a class="text-link" href="/#works">返回作品</a>
        </div>
      </section>

      <section class="section case-body reveal" aria-labelledby="${escapeAttr(caseItem.id)}-story-title">
        <div class="case-body-copy">
          <p class="tiny-label" id="${escapeAttr(caseItem.id)}-story-title">项目说明</p>
          ${ensureArray(caseItem.summary)
            .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
            .join("")}
        </div>
        <figure class="case-body-visual case-visual">
          ${renderVisual(caseItem.visual, false)}
        </figure>
      </section>

      <section class="section case-more reveal" aria-labelledby="${escapeAttr(caseItem.id)}-more-title">
        <div class="section-head">
          <h2 id="${escapeAttr(caseItem.id)}-more-title">其他案例</h2>
          <p><span></span>继续浏览</p>
        </div>
        <div class="case-more-grid">${related}</div>
      </section>
    </main>

    <script>
      window.__SITE_DATA__ = ${escapeScriptJson(site)};
      window.__CONTACT_SUBMIT_URL__ = "/api/lead";
    </script>
    <script src="/script.js"></script>
  </body>
</html>`;
}

function renderInspirationPage(site) {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="${escapeAttr(site.meta?.description || "")}" />
    <title>灵感库 / ${escapeHtml(site.meta?.title || "京鹏JPENG 界面设计师")}</title>
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body class="inspiration-page">
    <div class="loader" aria-hidden="true">
      <div class="logo-mark loader-mark">
        <span></span><span></span><span></span><span></span>
      </div>
      <p>${escapeHtml(site.brand?.loaderLabel || "京鹏JPENG")}</p>
    </div>

    ${renderHeader(site, "/")}
    ${renderMenu(site, "/")}

    <main id="inspiration-root">
      <section class="section inspiration-page-hero reveal" aria-labelledby="inspiration-page-title">
        <p class="tiny-label">${escapeHtml(site.inspiration?.eyebrow || "收藏灵感库")}</p>
        <div class="inspiration-page-head">
          <h1 id="inspiration-page-title">
            ${escapeHtml(site.inspiration?.titleLine1 || "持续收藏，")}<span>${escapeHtml(site.inspiration?.titleLine2 || "会被下一次项目用上的设计观察。")}</span>
          </h1>
          <a class="text-link" href="/#works">返回作品</a>
        </div>
        <p class="inspiration-page-copy">${escapeHtml(site.inspiration?.description || "")}</p>
      </section>

      <section class="section inspiration-list-section reveal" aria-labelledby="inspiration-list-title">
        <div class="section-head">
          <h2 id="inspiration-list-title">灵感列表</h2>
          <p><span></span>无时间排序</p>
        </div>
        <div class="inspiration-list">
          ${renderInspirationItems(site.inspiration?.items)}
        </div>
      </section>
    </main>

    <script>
      window.__SITE_DATA__ = ${escapeScriptJson(site)};
      window.__CONTACT_SUBMIT_URL__ = "/api/lead";
    </script>
    <script src="/script.js"></script>
  </body>
</html>`;
}

function renderAdminPage() {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>后台内容管理 / 京鹏JPENG</title>
    <style>
      :root {
        --bg: #080808;
        --panel: #111111;
        --panel-2: #171717;
        --line: rgba(255,255,255,.1);
        --text: #f7f7f3;
        --muted: rgba(232,236,236,.64);
        --accent: #ff0044;
        --radius: 12px;
      }
      * { box-sizing: border-box; }
      html, body { margin: 0; min-height: 100%; background: var(--bg); color: var(--text); font-family: Inter, "PingFang SC", "Microsoft YaHei", sans-serif; }
      body { padding: 24px; }
      a { color: inherit; text-decoration: none; }
      button, input, textarea { font: inherit; }
      .shell { display: grid; gap: 16px; max-width: 1720px; margin: 0 auto; }
      .topbar, .panel { border: 1px solid var(--line); border-radius: var(--radius); background: var(--panel); }
      .topbar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 14px; padding: 18px 20px; }
      .topbar strong { font-size: 18px; }
      .topbar p { margin: 0; color: var(--muted); font-size: 13px; }
      .top-actions { display: flex; flex-wrap: wrap; gap: 10px; }
      .btn { height: 40px; padding: 0 14px; border: 1px solid var(--line); border-radius: 999px; background: #1b1b1b; color: var(--text); cursor: pointer; }
      .btn.primary { background: var(--accent); border-color: transparent; color: #fff; font-weight: 800; }
      .layout { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(320px, .85fr); gap: 16px; align-items: start; }
      .stack { display: grid; gap: 16px; }
      .panel { padding: 16px; background: linear-gradient(180deg, #101010, #090909); }
      .panel-head { display: flex; align-items: end; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
      .panel-head h2 { margin: 0; font-size: 20px; }
      .panel-head p { margin: 0; color: var(--muted); font-size: 13px; }
      textarea {
        width: 100%;
        min-height: 68vh;
        resize: vertical;
        padding: 16px;
        border: 1px solid var(--line);
        border-radius: 14px;
        background: var(--panel-2);
        color: #eaf1ff;
        line-height: 1.6;
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        font-size: 13px;
      }
      .toolbar { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 12px; }
      .status { min-height: 22px; margin-top: 10px; color: rgba(200,255,249,.92); font-size: 13px; }
      .help-list { display: grid; gap: 10px; padding: 0; margin: 0; list-style: none; }
      .help-list li { padding: 12px; border: 1px solid var(--line); border-radius: 10px; background: rgba(255,255,255,.03); color: var(--muted); font-size: 13px; line-height: 1.65; }
      .preview-tabs { display: flex; gap: 8px; margin-bottom: 12px; }
      .tab { padding: 8px 12px; border-radius: 999px; border: 1px solid var(--line); background: #171717; color: var(--muted); cursor: pointer; }
      .tab.is-active { color: var(--text); border-color: rgba(255,0,68,.45); background: rgba(255,0,68,.18); }
      iframe { width: 100%; height: 76vh; border: 1px solid var(--line); border-radius: 14px; background: #fff; }
      table { width: 100%; border-collapse: collapse; }
      th, td { padding: 10px 8px; border-bottom: 1px solid var(--line); text-align: left; font-size: 13px; }
      th { color: var(--muted); font-weight: 700; }
      .muted { color: var(--muted); }
      .preview-foot { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 10px; color: var(--muted); font-size: 13px; }
      @media (max-width: 1180px) {
        body { padding: 16px; }
        .layout { grid-template-columns: 1fr; }
        iframe, textarea { min-height: 54vh; height: auto; }
      }
    </style>
  </head>
  <body>
    <div class="shell">
      <header class="topbar">
        <div>
          <strong>后台内容管理</strong>
          <p>编辑首页、案例页、导航、图片和链接，保存后立即生效。</p>
        </div>
        <div class="top-actions">
          <button class="btn primary" id="save-btn">保存发布</button>
          <button class="btn" id="format-btn">格式化</button>
          <button class="btn" id="download-btn">下载 JSON</button>
          <button class="btn" id="reload-btn">重新载入</button>
          <button class="btn" id="upload-btn">上传图片</button>
          <input id="upload-input" type="file" accept="image/*" hidden />
        </div>
      </header>

      <main class="layout">
        <section class="panel">
          <div class="panel-head">
            <div>
              <h2>站点数据</h2>
              <p>直接编辑 JSON。works、cases、navigation、services、inspiration 都能增删改。</p>
            </div>
            <p class="muted">图片字段可填外链，或先上传再粘贴返回地址。</p>
          </div>
          <textarea id="site-json" spellcheck="false"></textarea>
          <div class="toolbar">
            <button class="btn primary" id="save-btn-bottom">保存发布</button>
            <button class="btn" id="format-btn-bottom">格式化</button>
            <button class="btn" id="download-btn-bottom">下载 JSON</button>
            <button class="btn" id="reload-btn-bottom">重新载入</button>
          </div>
          <div class="status" id="status" aria-live="polite"></div>
        </section>

        <div class="stack">
          <section class="panel">
            <div class="panel-head">
              <div>
                <h2>预览</h2>
                <p>首页和案例页会读取同一份站点数据。</p>
              </div>
            </div>
            <div class="preview-tabs">
              <button class="tab is-active" data-preview="/">首页</button>
              <button class="tab" data-preview="/inspiration.html">灵感库</button>
              <button class="tab" data-preview="/case.html?case=coop">案例页 01</button>
              <button class="tab" data-preview="/case.html?case=growth">案例页 02</button>
              <button class="tab" data-preview="/case.html?case=mobile">案例页 03</button>
            </div>
            <iframe id="preview-frame" title="站点预览"></iframe>
            <div class="preview-foot">
              <span>刷新预览：保存后自动更新，或手动切换上面的标签。</span>
              <a href="/" target="_blank" rel="noreferrer">打开前台</a>
            </div>
          </section>

          <section class="panel">
            <div class="panel-head">
              <div>
                <h2>最新线索</h2>
                <p>电话提交会写入后台，方便你直接回访。</p>
              </div>
              <button class="btn" id="refresh-leads-btn">刷新</button>
            </div>
            <div id="leads-empty" class="muted">还没有收到提交。</div>
            <div style="overflow:auto;">
              <table id="leads-table" hidden>
                <thead>
                  <tr>
                    <th>时间</th>
                    <th>电话</th>
                    <th>来源</th>
                  </tr>
                </thead>
                <tbody></tbody>
              </table>
            </div>
          </section>

          <section class="panel">
            <div class="panel-head">
              <div>
                <h2>编辑提示</h2>
                <p>这份后台是给日常改站点内容用的，不需要碰代码。</p>
              </div>
            </div>
            <ul class="help-list">
              <li>works 和 cases 是数组。复制一个对象就能新增案例，再改 id、slug、title 和 visual。</li>
              <li>图片可以先点“上传图片”，把返回的 /uploads/... 地址粘到 JSON 里。</li>
              <li>保存后首页、案例页、灵感库页和联系表单会一起更新。开始项目和预约项目沟通都会进电话收集框。</li>
            </ul>
          </section>
        </div>
      </main>
    </div>

    <script src="/admin.js"></script>
  </body>
</html>`;
}

async function readRequestJson(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const body = Buffer.concat(chunks).toString("utf8").trim();
  if (!body) {
    return null;
  }
  return JSON.parse(body);
}

function sendJson(res, statusCode, data) {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function sendText(res, statusCode, text, contentType = "text/plain; charset=utf-8") {
  res.writeHead(statusCode, {
    "Content-Type": contentType,
    "Content-Length": Buffer.byteLength(text),
  });
  res.end(text);
}

function getMimeType(filePath) {
  return MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream";
}

function sanitizeFileName(name) {
  return String(name || "upload")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "upload";
}

function dataUrlToBuffer(dataUrl) {
  const match = String(dataUrl || "").match(/^data:(.+?);base64,(.+)$/);
  if (!match) {
    throw new Error("无效的数据 URL");
  }
  return {
    mimeType: match[1],
    buffer: Buffer.from(match[2], "base64"),
  };
}

async function handleApiSite(req, res) {
  if (req.method === "GET") {
    const site = await loadSiteData();
    sendJson(res, 200, site);
    return;
  }

  if (req.method === "POST" || req.method === "PUT") {
    const next = await readRequestJson(req);
    if (!next || typeof next !== "object" || Array.isArray(next)) {
      sendJson(res, 400, { ok: false, error: "请求体必须是 JSON 对象" });
      return;
    }

    await saveJson(SITE_FILE, next);
    sendJson(res, 200, { ok: true });
    return;
  }

  sendJson(res, 405, { ok: false, error: "Method Not Allowed" });
}

async function handleApiLeads(req, res) {
  if (req.method === "GET") {
    const leads = await loadLeads();
    sendJson(res, 200, leads.slice().reverse());
    return;
  }

  sendJson(res, 405, { ok: false, error: "Method Not Allowed" });
}

async function handleApiLead(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { ok: false, error: "Method Not Allowed" });
    return;
  }

  const payload = await readRequestJson(req);
  if (!payload || typeof payload.phone !== "string" || !payload.phone.trim()) {
    sendJson(res, 400, { ok: false, error: "请提供手机号" });
    return;
  }

  const leads = await loadLeads();
  leads.push({
    phone: payload.phone.trim(),
    source: String(payload.source || ""),
    page: String(payload.page || ""),
    submittedAt: String(payload.submittedAt || new Date().toISOString()),
  });
  await saveJson(LEADS_FILE, leads);

  sendJson(res, 200, { ok: true });
}

async function handleApiUpload(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { ok: false, error: "Method Not Allowed" });
    return;
  }

  const payload = await readRequestJson(req);
  const dataUrl = payload?.dataUrl || payload?.data || "";
  const fileName = sanitizeFileName(payload?.fileName || payload?.name || "image");

  if (!dataUrl) {
    sendJson(res, 400, { ok: false, error: "缺少图片数据" });
    return;
  }

  const { mimeType, buffer } = dataUrlToBuffer(dataUrl);
  if (!mimeType.startsWith("image/")) {
    sendJson(res, 400, { ok: false, error: "只支持图片文件" });
    return;
  }

  const ext = ({
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/svg+xml": ".svg",
  })[mimeType] || ".png";

  const uploadName = `${Date.now()}-${randomUUID().slice(0, 8)}-${fileName}${ext}`;
  const targetPath = path.join(UPLOAD_DIR, uploadName);
  await fs.writeFile(targetPath, buffer);

  sendJson(res, 200, {
    ok: true,
    url: `/uploads/${uploadName}`,
  });
}

async function serveStaticFile(req, res, filePath) {
  try {
    const data = await fs.readFile(filePath);
    res.writeHead(200, {
      "Content-Type": getMimeType(filePath),
      "Content-Length": data.length,
    });
    res.end(data);
  } catch (error) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not Found");
  }
}

async function handleRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = decodeURIComponent(url.pathname);

  if (pathname === "/api/site") {
    await handleApiSite(req, res);
    return;
  }

  if (pathname === "/api/leads") {
    await handleApiLeads(req, res);
    return;
  }

  if (pathname === "/api/lead") {
    await handleApiLead(req, res);
    return;
  }

  if (pathname === "/api/upload") {
    await handleApiUpload(req, res);
    return;
  }

  if (pathname === "/admin") {
    sendText(res, 200, renderAdminPage(), "text/html; charset=utf-8");
    return;
  }

  if (pathname === "/" || pathname === "/index.html") {
    const site = await loadSiteData();
    sendText(res, 200, renderHomePage(site), "text/html; charset=utf-8");
    return;
  }

  if (pathname === "/case" || pathname === "/case.html") {
    const site = await loadSiteData();
    const slug = String(url.searchParams.get("case") || "coop");
    const caseItem = ensureArray(site.cases).find((item) => item.id === slug) || site.cases?.[0];
    if (!caseItem) {
      sendText(res, 404, "未找到案例", "text/plain; charset=utf-8");
      return;
    }
    sendText(res, 200, renderCasePage(site, caseItem), "text/html; charset=utf-8");
    return;
  }

  if (pathname === "/inspiration" || pathname === "/inspiration.html") {
    const site = await loadSiteData();
    sendText(res, 200, renderInspirationPage(site), "text/html; charset=utf-8");
    return;
  }

  if (pathname === "/favicon.ico") {
    res.writeHead(204);
    res.end();
    return;
  }

  const staticPath = path.join(ROOT, pathname.replace(/^\//, ""));
  if (staticPath.startsWith(ROOT)) {
    const exists = await fs
      .stat(staticPath)
      .then(() => true)
      .catch(() => false);
    if (exists) {
      await serveStaticFile(req, res, staticPath);
      return;
    }
  }

  sendText(res, 404, "Not Found", "text/plain; charset=utf-8");
}

async function main() {
  await ensureDirectories();
  const server = http.createServer((req, res) => {
    handleRequest(req, res).catch((error) => {
      console.error(error);
      if (!res.headersSent) {
        sendJson(res, 500, { ok: false, error: "服务器错误" });
        return;
      }
      res.end();
    });
  });

  server.listen(PORT, () => {
    console.log(`Site server running at http://localhost:${PORT}`);
    console.log(`Admin panel at http://localhost:${PORT}/admin`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
