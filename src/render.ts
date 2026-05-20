import type { HomeSiteData, HomepageContent, InspirationItem, ProjectRow, SocialLinkRow } from "./types";
import { normalizeHref } from "./api";
import { renderEditorContent } from "./editor-renderer";

function escapeHtml(value: unknown) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttr(value: unknown) {
  return escapeHtml(value).replaceAll("`", "&#96;");
}

function chunk<T>(items: T[], size: number) {
  const groups: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    groups.push(items.slice(index, index + size));
  }
  return groups;
}

function renderLogo(brand: HomepageContent["brand"], href = "./") {
  return `
    <a class="brand" href="${href}" aria-label="返回首页">
      <span class="logo-mark">
        <span></span><span></span><span></span><span></span>
      </span>
      <span class="brand-name">
        <span class="brand-line1">${escapeHtml(brand.line1)}</span>
        <span class="brand-line2">${escapeHtml(brand.line2)}</span>
      </span>
    </a>
  `;
}

function renderMenu(site: HomeSiteData, currentPage: "home" | "case" | "inspiration" | "works") {
  const navLinks = site.homepage.navigation.map((link) => {
    let href = normalizeHref(link.href);
    if (currentPage !== "home" && href.startsWith("#")) {
      href = `index.html${href}`;
    }
    return `<a href="${escapeAttr(href)}">${escapeHtml(link.label)}</a>`;
  }).join("");

  return `
    <nav class="menu-panel" aria-label="主导航">
      <div class="menu-panel-inner">
        <p class="tiny-label">${escapeHtml(site.homepage.navigationTitle || "导航")}</p>
        ${navLinks}
        <div class="menu-panel-contact">
          <svg class="menu-panel-contact-icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
            <path d="M8.5 13.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm7 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2ZM12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2Zm0 18c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8Z"/>
          </svg>
          <span class="menu-panel-contact-text">微信号：Warm_light786</span>
        </div>
      </div>
    </nav>
  `;
}

function renderHeader(site: HomeSiteData, currentPage: "home" | "case" | "inspiration" | "works") {
  return `
    <header class="site-header">
      ${renderLogo(site.homepage.brand)}
      <button class="menu-button" type="button" aria-label="打开菜单" aria-expanded="false">
        <span></span>
        <span></span>
        <span></span>
      </button>
    </header>
    ${renderMenu(site, currentPage)}
  `;
}

function renderLoader(site: HomeSiteData) {
  return `
    <div class="loader" aria-hidden="true">
      <div class="logo-mark loader-mark">
        <span></span><span></span><span></span><span></span>
      </div>
      <p>${escapeHtml(site.homepage.brand.loaderLabel)}</p>
    </div>
  `;
}

function renderTicker(items: string[]) {
  if (!items.length) {
    return "";
  }

  const repeated = [...items, ...items];
  return `
    <div class="ticker" aria-label="服务标签">
      <div class="ticker-track">
        ${repeated.map((item, index) => `${index > 0 ? "<i></i>" : ""}<span>${escapeHtml(item)}</span>`).join("")}
      </div>
    </div>
  `;
}

function renderCapabilityGrid(items: string[]) {
  if (!items.length) {
    return "";
  }

  return `
    <section class="client-grid" aria-label="能力矩阵">
      ${items.map((item) => `<div>${escapeHtml(item)}</div>`).join("")}
    </section>
  `;
}

function renderFeatureVisual(project: ProjectRow) {
  const detail = project.detail_paragraphs[0] || project.summary || project.title;

  return `
    <div class="work-shot feature-shot" role="img" aria-label="${escapeAttr(project.title)}">
      <div class="browser-bar">
        <span></span><span></span><span></span><em>${escapeHtml(project.category)} / 工作台</em>
      </div>
      <div class="feature-layout">
        <aside>
          <strong>${escapeHtml(project.title)}</strong>
          <span>${escapeHtml(project.category)}</span>
          <span>${escapeHtml(project.summary)}</span>
          <span>设计交付</span>
          <span>版本记录</span>
        </aside>
        <div class="feature-main">
          <div class="mock-row">
            <p>本周重点</p>
            <b>${escapeHtml(detail.slice(0, 16))}</b>
          </div>
          <div class="mock-grid">
            <section><span>进行中</span><strong>24</strong></section>
            <section><span>待确认</span><strong>08</strong></section>
            <section><span>已交付</span><strong>116</strong></section>
          </div>
          <div class="timeline"><i></i><i></i><i></i><i></i><i></i></div>
        </div>
      </div>
    </div>
  `;
}

function renderDashboardVisual(project: ProjectRow) {
  return `
    <div class="work-shot dashboard-shot" role="img" aria-label="${escapeAttr(project.title)}">
      <div class="browser-bar">
        <span></span><span></span><span></span><em>${escapeHtml(project.category)} / 仪表盘</em>
      </div>
      <div class="chart-panel">
        <strong>${escapeHtml(project.title)}</strong>
        <div class="bars"><i></i><i></i><i></i><i></i><i></i><i></i></div>
      </div>
      <div class="metric-strip">
        <span>${escapeHtml(project.category)}</span>
        <span>${escapeHtml(project.summary)}</span>
        <span>${escapeHtml(project.layout_variant)}</span>
      </div>
    </div>
  `;
}

function renderMobileVisual(project: ProjectRow) {
  return `
    <div class="work-shot mobile-shot" role="img" aria-label="${escapeAttr(project.title)}">
      <div class="phone">
        <span>${escapeHtml(project.category)}</span>
        <strong>${escapeHtml(project.title)}</strong>
        <div class="phone-card">${escapeHtml(project.summary)}</div>
        <div class="phone-list"><i></i><i></i><i></i></div>
      </div>
    </div>
  `;
}

function renderImageVisual(project: ProjectRow, imageUrl: string, alt: string, detail = false) {
  const className = detail ? "image-shot case-cover-art--image" : "work-shot image-shot";
  return `
    <div class="${className}" role="img" aria-label="${escapeAttr(alt)}">
      <img src="${escapeAttr(imageUrl)}" alt="${escapeAttr(alt)}" />
    </div>
  `;
}

function renderProjectArtwork(project: ProjectRow, options: { detail?: boolean; cover?: boolean } = {}) {
  const imageUrl = options.detail ? project.detail_image_url || project.cover_image_url : project.cover_image_url || project.detail_image_url;
  const alt = options.detail
    ? project.detail_image_alt || project.title
    : project.cover_image_alt || project.title;

  if (imageUrl) {
    return renderImageVisual(project, imageUrl, alt, Boolean(options.detail));
  }

  const variant = (project.layout_variant || "image").toLowerCase();

  if (variant === "feature") {
    return renderFeatureVisual(project);
  }

  if (variant === "dashboard") {
    return renderDashboardVisual(project);
  }

  if (variant === "mobile") {
    return renderMobileVisual(project);
  }

  return `
    <div class="work-shot image-shot">
      <div class="image-shot-placeholder">${escapeHtml(project.title)}</div>
    </div>
  `;
}

function renderProjectCover(project: ProjectRow) {
  const imageUrl = project.cover_image_url || project.detail_image_url;
  const alt = project.cover_image_alt || project.title;

  if (imageUrl) {
    return renderImageVisual(project, imageUrl, alt, true);
  }

  const variant = (project.layout_variant || "image").toLowerCase();

  if (variant === "feature") {
    return `
      <div class="case-cover-art case-cover-art--coop" role="img" aria-label="${escapeAttr(project.title)}">
        <div class="case-cover-browser"><span></span><span></span><span></span><em>${escapeHtml(project.category)} / 封面</em></div>
        <div class="case-cover-layout">
          <strong>${escapeHtml(project.title)}</strong>
          <div class="case-cover-row"><i></i><i></i><i></i></div>
          <div class="case-cover-chip">${escapeHtml(project.summary.slice(0, 18))}</div>
        </div>
      </div>
    `;
  }

  if (variant === "dashboard") {
    return `
      <div class="case-cover-art case-cover-art--growth" role="img" aria-label="${escapeAttr(project.title)}">
        <div class="case-cover-browser"><span></span><span></span><span></span><em>${escapeHtml(project.category)} / 封面</em></div>
        <div class="case-cover-chart"><i></i><i></i><i></i><i></i><i></i><i></i></div>
        <div class="case-cover-strip">
          <span>${escapeHtml(project.category)}</span>
          <span>${escapeHtml(project.summary.slice(0, 10))}</span>
          <span>${escapeHtml(project.layout_variant)}</span>
        </div>
      </div>
    `;
  }

  if (variant === "mobile") {
    return `
      <div class="case-cover-art case-cover-art--mobile" role="img" aria-label="${escapeAttr(project.title)}">
        <div class="case-cover-browser"><span></span><span></span><span></span><em>${escapeHtml(project.category)} / 封面</em></div>
        <div class="case-cover-phone">
          <span>${escapeHtml(project.category)}</span>
          <strong>${escapeHtml(project.title)}</strong>
          <div class="case-cover-phone-card">${escapeHtml(project.summary.slice(0, 20))}</div>
        </div>
      </div>
    `;
  }

  return `
    <div class="case-cover-art case-cover-art--image" role="img" aria-label="${escapeAttr(project.title)}">
      <div class="image-shot-placeholder">${escapeHtml(project.title)}</div>
    </div>
  `;
}

function renderProjectFeatureCard(project: ProjectRow) {
  return `
    <a class="work-link reveal" href="${escapeAttr(normalizeHref(`case.html?case=${encodeURIComponent(project.slug)}`))}" aria-label="打开${escapeAttr(project.title)}">
      <figure class="work-media">
        ${renderProjectArtwork(project)}
        <figcaption>${escapeHtml(project.title)}</figcaption>
      </figure>
    </a>
    <p class="work-meta">${escapeHtml(project.category)}，${escapeHtml(project.summary)}</p>
  `;
}

function renderProjectCompactCard(project: ProjectRow) {
  return `
    <a class="work-card reveal" href="${escapeAttr(normalizeHref(`case.html?case=${encodeURIComponent(project.slug)}`))}" aria-label="打开${escapeAttr(project.title)}">
      ${renderProjectArtwork(project)}
      <div class="work-caption">
        <h3>${escapeHtml(project.title)}</h3>
        <p>${escapeHtml(project.category)}，${escapeHtml(project.summary)}</p>
      </div>
    </a>
  `;
}

function renderWorksSection(site: HomeSiteData) {
  const projects = site.projects.filter((project) => project.published);
  const featured = projects[0];
  const remaining = projects.slice(1);

  return `
    <section class="section works" id="works" aria-labelledby="works-title">
      <div class="section-head">
        <h2 id="works-title">${escapeHtml(site.homepage.worksSection.title)}</h2>
        <p><span></span>${escapeHtml(site.homepage.worksSection.badge)}</p>
      </div>

      ${
        featured
          ? `
        <div class="work-feature">
          ${renderProjectFeatureCard(featured)}
        </div>
      `
          : `<p class="inspiration-empty">暂无作品，请先在 Supabase 的 projects 表中添加内容。</p>`
      }

      ${
        remaining.length
          ? chunk(remaining, 2)
              .map(
                (group) => `
                  <div class="work-pair">
                    ${group.map((project) => renderProjectCompactCard(project)).join("")}
                  </div>
                `,
              )
              .join("")
          : ""
      }

      <button class="center-link text-link js-start-project" type="button" aria-haspopup="dialog" aria-controls="lead-modal">
        预约项目沟通
      </button>
    </section>
  `;
}

function renderWorksPage(site: HomeSiteData) {
  const projects = site.projects.filter((project) => project.published);

  return `
    <main id="top">
      <section class="section works-page-hero reveal" aria-labelledby="works-page-title">
        <div class="works-page-hero-head">
          <div>
            <p class="tiny-label">${escapeHtml(site.homepage.worksSection.badge)}</p>
            <h1 id="works-page-title">${escapeHtml(site.homepage.worksSection.title)}</h1>
          </div>
          <a class="text-link" href="./">返回首页</a>
        </div>
      </section>

      <section class="section works-page-list reveal" aria-labelledby="works-page-list-title">
        ${
          projects.length
            ? `
              <div class="works-page-grid">
                ${projects.map((project) => renderProjectCompactCard(project)).join("")}
              </div>
            `
            : `<p class="inspiration-empty">暂无作品，请先在 Supabase 的 projects 表中添加内容。</p>`
        }
      </section>

      <section class="section works-page-cta reveal" aria-labelledby="works-page-cta-title">
        <div class="section-head">
          <h2 id="works-page-cta-title">有项目想法？</h2>
        </div>
        <button class="center-link text-link js-start-project" type="button" aria-haspopup="dialog" aria-controls="lead-modal">
          预约项目沟通
        </button>
      </section>
    </main>
  `;
}

function renderStats(stats: HomepageContent["about"]["stats"]) {
  return `
    <div class="stats">
      ${stats
        .map(
          (item) => `
            <article>
              <strong>${escapeHtml(item.value)}</strong>
              <h3>${escapeHtml(item.title)}</h3>
              <p>${escapeHtml(item.description)}</p>
            </article>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderBlocks(items: HomepageContent["services"]["items"] | HomepageContent["process"]["items"]) {
  return items
    .map(
      (item) => `
        <article>
          <span>${escapeHtml(item.step)}</span>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.description)}</p>
        </article>
      `,
    )
    .join("");
}

function getInspirationHref(item: InspirationItem) {
  return `inspiration.html?slug=${encodeURIComponent(item.slug)}`;
}

function getAdjacentInspirationItems(items: InspirationItem[], slug: string) {
  const index = items.findIndex((item) => item.slug === slug);
  if (index < 0) {
    return { previous: undefined, next: undefined };
  }

  return {
    previous: index > 0 ? items[index - 1] : undefined,
    next: index < items.length - 1 ? items[index + 1] : undefined,
  };
}

function renderInspirationList(items: InspirationItem[], compact = false) {
  if (!items.length) {
    return `<p class="inspiration-empty">暂无灵感条目，请在 Supabase 的 homepage.content.inspiration.items 中补充。</p>`;
  }

  return `
    <div class="inspiration-list">
      ${items
        .map((item) => {
          const classes = ["inspiration-item", compact ? "inspiration-item--compact" : "", "inspiration-item--link"]
            .filter(Boolean)
            .join(" ");
          return `
            <a class="${classes}" href="${escapeAttr(getInspirationHref(item))}" aria-label="打开${escapeAttr(item.title)}">
              <span class="inspiration-icon" aria-hidden="true"></span>
              <div class="inspiration-body">
                <strong>${escapeHtml(item.title)}</strong>
                <p>${escapeHtml(item.description)}</p>
              </div>
            </a>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderInspirationSection(site: HomeSiteData) {
  const items = site.homepage.inspiration.items.slice(0, 4);

  return `
    <section class="section inspiration" id="inspiration" aria-labelledby="inspiration-title">
      <div class="inspiration-copy">
        <p class="tiny-label">${escapeHtml(site.homepage.inspiration.eyebrow)}</p>
        <h2 id="inspiration-title">${escapeHtml(site.homepage.inspiration.titleLine1)}<br />${escapeHtml(site.homepage.inspiration.titleLine2)}</h2>
        <p>${escapeHtml(site.homepage.inspiration.description)}</p>
        <a class="text-link" href="${escapeAttr(normalizeHref(site.homepage.inspiration.pageHref || "inspiration.html"))}">查看灵感库</a>
      </div>
      <div>
        ${renderInspirationList(items, true)}
      </div>
    </section>
  `;
}

function renderHomePage(site: HomeSiteData) {
  const hero = site.homepage.hero;

  return `
    <main id="top">
      <section class="hero" aria-labelledby="hero-title">
        <div class="hero-glow"></div>
        <div class="hero-inner">
          <div class="hero-title-wrap">
            <h1 id="hero-title">
              ${escapeHtml(hero.titleLine1)}<br />
              <span>${escapeHtml(hero.titleLine2)}</span>
            </h1>
          </div>
          <div class="hero-copy">
            <p>${escapeHtml(hero.copy)}</p>
            <a class="text-link" href="${escapeAttr(normalizeHref(hero.ctaHref || "#works"))}">${escapeHtml(hero.ctaLabel)}</a>
          </div>
        </div>
      </section>

      ${renderTicker(site.homepage.ticker)}

      <section class="red-band" aria-label="合作宣言">
        <div>
          <h2>${escapeHtml(site.homepage.redBand.title)}</h2>
          <p>${escapeHtml(site.homepage.redBand.subtitle)}</p>
        </div>
        <div class="band-mark" aria-hidden="true">
          <span></span><span></span><span></span><span></span><span></span>
        </div>
      </section>

      ${renderCapabilityGrid(site.homepage.capabilities)}

      ${renderWorksSection(site)}

      <section class="section about" id="about" aria-labelledby="about-title">
        <p class="tiny-label">${escapeHtml(site.homepage.about.eyebrow)}</p>
        <h2 id="about-title">
          ${escapeHtml(site.homepage.about.titleBefore)}
          <span>${escapeHtml(site.homepage.about.titleAccent)}</span>
          ${escapeHtml(site.homepage.about.titleAfter)}
        </h2>

        ${renderStats(site.homepage.about.stats)}
      </section>

      <section class="section services" aria-labelledby="services-title">
        <div class="service-intro">
          <p class="tiny-label">${escapeHtml(site.homepage.services.eyebrow)}</p>
          <h2 id="services-title">${escapeHtml(site.homepage.services.title)}</h2>
          <p>${escapeHtml(site.homepage.services.description)}</p>
        </div>

        <div class="service-rail">
          ${renderBlocks(site.homepage.services.items)}
        </div>
      </section>

      <section class="section process" aria-labelledby="process-title">
        <p class="tiny-label">${escapeHtml(site.homepage.process.eyebrow)}</p>
        <h2 id="process-title">${escapeHtml(site.homepage.process.title)}</h2>
        <div class="process-list">
          ${renderBlocks(site.homepage.process.items)}
        </div>
      </section>

      ${renderInspirationSection(site)}

      <section class="final-cta" aria-labelledby="cta-title">
        <p class="tiny-label">${escapeHtml(site.homepage.cta.eyebrow)}</p>
        <h2 id="cta-title">
          ${escapeHtml(site.homepage.cta.titleLine1)}<span>${escapeHtml(site.homepage.cta.titleLine2)}</span>
        </h2>
        <div>
          <p>${escapeHtml(site.homepage.cta.description)}</p>
          <button class="pill-link js-start-project" type="button" aria-haspopup="dialog" aria-controls="lead-modal">
            ${escapeHtml(site.homepage.cta.buttonLabel)}
          </button>
        </div>
      </section>
    </main>
  `;
}

function renderProjectCard(project: ProjectRow) {
  return `
    <a class="case-card reveal" href="${escapeAttr(normalizeHref(`case.html?case=${encodeURIComponent(project.slug)}`))}" aria-label="打开${escapeAttr(project.title)}">
      <figure class="case-card-cover">
        ${renderProjectCover(project)}
      </figure>
      <div class="case-card-body">
        <h3>${escapeHtml(project.title)}</h3>
      </div>
    </a>
  `;
}

function renderCasePage(site: HomeSiteData, project: ProjectRow) {
  const related = site.projects.filter((item) => item.slug !== project.slug && item.published);
  const editorContent = project.detail_content ? renderEditorContent(project.detail_content) : "";
  const fallbackContent = project.detail_paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
  const bodyContent = editorContent || fallbackContent || `<p>${escapeHtml(project.summary)}</p>`;

  return `
    <main id="top">
      <section class="section case-hero reveal" aria-labelledby="case-title">
        <p class="tiny-label">案例类型 · ${escapeHtml(project.category)}</p>
        <div class="case-hero-head">
          <h1 id="case-title">${escapeHtml(project.title)}</h1>
          <a class="text-link" href="${escapeAttr(normalizeHref("works.html"))}">返回作品</a>
        </div>
      </section>

      <section class="section case-body reveal" aria-labelledby="case-body-title">
        <div class="case-body-copy">
          <p class="tiny-label" id="case-body-title">项目说明</p>
          ${bodyContent}
        </div>
      </section>

      ${
        related.length
          ? `
        <section class="section case-more reveal" aria-labelledby="case-more-title">
          <div class="section-head">
            <h2 id="case-more-title">其他案例</h2>
            <p><span></span>继续浏览</p>
          </div>
          <div class="case-more-grid">
            ${related.slice(0, 3).map((item) => renderProjectCard(item)).join("")}
          </div>
        </section>
      `
          : ""
      }
    </main>
  `;
}

function renderInspirationDetailPage(site: HomeSiteData, item: InspirationItem) {
  const body = item.body.length ? item.body : [item.description];
  const buttonHref = item.ctaHref || site.homepage.inspiration.pageHref || "/inspiration.html";
  const buttonLabel = item.ctaLabel || site.homepage.inspiration.detailButtonLabel || "立即前往";

  return `
    <main id="top">
      <section class="section inspiration-detail reveal" aria-labelledby="inspiration-detail-title">
        <p class="tiny-label">${escapeHtml(site.homepage.inspiration.eyebrow)}</p>
        <div class="inspiration-detail-head">
          <h1 id="inspiration-detail-title">${escapeHtml(item.title)}</h1>
          <p class="inspiration-detail-intro">${escapeHtml(item.description)}</p>
        </div>

        <article class="inspiration-detail-copy">
          ${body.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
        </article>

        <div class="inspiration-detail-actions">
          <a class="pill-link inspiration-detail-button" href="${escapeAttr(buttonHref)}" ${
            /^https?:\/\//i.test(buttonHref) ? 'target="_blank" rel="noreferrer"' : ""
          }>${escapeHtml(buttonLabel)}</a>
        </div>
      </section>
    </main>
  `;
}

function renderInspirationPage(site: HomeSiteData) {
  return `
    <main id="top">
      <section class="section inspiration-page-hero reveal" aria-labelledby="inspiration-page-title">
        <div class="inspiration-page-copy">
          <p class="tiny-label">${escapeHtml(site.homepage.inspiration.eyebrow)}</p>
          <h1 id="inspiration-page-title">
            ${escapeHtml(site.homepage.inspiration.titleLine1)}
            <span>${escapeHtml(site.homepage.inspiration.titleLine2)}</span>
          </h1>
          <p>${escapeHtml(site.homepage.inspiration.description)}</p>
        </div>
      </section>

      <section class="section inspiration-list-section reveal">
        ${renderInspirationList(site.homepage.inspiration.items, false)}
      </section>
    </main>
  `;
}

function renderFooter(site: HomeSiteData, socialLinks: SocialLinkRow[], currentPage: "home" | "case" | "inspiration" | "works") {
  const activeSocialLinks = socialLinks.filter((link) => link.is_active);

  return `
    <footer class="site-footer" id="contact">
      <div class="footer-top">
        <div>
          <p class="tiny-label">${escapeHtml(site.homepage.footer.contactTitle)}</p>
          <p>${escapeHtml(site.homepage.contact.intro)}</p>
        </div>
        <form class="contact-form" data-contact-form>
          <label for="contact-info">联系方式</label>
          <input id="contact-info" name="contact" type="text" placeholder="${escapeAttr(site.homepage.contact.placeholder)}" />
          <button type="submit">${escapeHtml(site.homepage.contact.buttonLabel)}</button>
        </form>
        <p class="contact-feedback" aria-live="polite"></p>
      </div>
      <div class="footer-main">
        <div>
          ${renderLogo(site.homepage.brand, "./")}
          <p>${escapeHtml(site.homepage.footer.brandDescription)}</p>
        </div>
        <div>
          <p class="tiny-label">${escapeHtml(site.homepage.footer.servicesTitle)}</p>
          ${site.homepage.footer.servicesLinks
            .map((link) => {
              let href = normalizeHref(link.href);
              if (currentPage !== "home" && href.startsWith("#")) {
                href = `index.html${href}`;
              }
              return `<a href="${escapeAttr(href)}">${escapeHtml(link.label)}</a>`;
            })
            .join("")}
        </div>
        <div>
          <p class="tiny-label">联系</p>
          ${activeSocialLinks.length
            ? activeSocialLinks
                .map((link) =>
                  link.url && link.url !== "#"
                    ? `<a href="${escapeAttr(link.url)}" target="_blank" rel="noreferrer">${escapeHtml(link.label)}</a>`
                    : `<span>${escapeHtml(link.label)}</span>`,
                )
                .join("")
            : `<a href="mailto:${escapeAttr(site.homepage.footer.email)}">${escapeHtml(site.homepage.footer.email)}</a>`}
        </div>
      </div>
      <div class="footer-bottom">
        <p>${escapeHtml(site.homepage.footer.copyright)}</p>
        <a href="mailto:${escapeAttr(site.homepage.footer.email)}">${escapeHtml(site.homepage.footer.email)}</a>
      </div>
    </footer>
  `;
}

function renderLeadModal(site: HomeSiteData) {
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
        <p class="tiny-label">${escapeHtml(site.homepage.cta.buttonLabel)}</p>
        <h3 id="lead-modal-title">${escapeHtml(site.homepage.leadModal.title)}</h3>
        <p id="lead-modal-desc">${escapeHtml(site.homepage.leadModal.description)}</p>
        <form class="lead-form" data-lead-form>
          <label for="lead-phone">电话</label>
          <input
            id="lead-phone"
            name="phone"
            type="tel"
            inputmode="tel"
            autocomplete="tel"
            placeholder="${escapeAttr(site.homepage.leadModal.inputPlaceholder)}"
            required
          />
          <button type="submit">${escapeHtml(site.homepage.leadModal.submitLabel)}</button>
        </form>
        <p class="lead-feedback" aria-live="polite"></p>
      </div>
    </div>
  `;
}

export function renderPage(site: HomeSiteData, page: "home" | "case" | "inspiration" | "works", slug?: string) {
  const project = slug ? site.projects.find((item) => item.slug === slug) : undefined;
  const inspirationItem = page === "inspiration" && slug ? site.homepage.inspiration.items.find((item) => item.slug === slug) : undefined;
  const currentProject = project || site.projects[0];
  const bodyClass =
    page === "case"
      ? "case-page"
      : page === "inspiration"
        ? inspirationItem
          ? "inspiration-page inspiration-detail-page"
          : "inspiration-page"
        : page === "works"
          ? "works-page"
          : "home-page";

  const content =
    page === "case"
      ? currentProject
        ? renderCasePage(site, currentProject)
        : renderHomePage(site)
      : page === "inspiration"
        ? inspirationItem
          ? renderInspirationDetailPage(site, inspirationItem)
          : renderInspirationPage(site)
        : page === "works"
          ? renderWorksPage(site)
          : renderHomePage(site);

  return `
    <div class="app-shell ${bodyClass}">
      ${renderLoader(site)}
      ${renderHeader(site, page)}
      ${content}
      ${renderFooter(site, site.socialLinks, page)}
      ${renderLeadModal(site)}
    </div>
  `;
}

export function renderAppLoading(site: HomeSiteData) {
  return `
    <div class="app-shell">
      ${renderLoader(site)}
    </div>
  `;
}
