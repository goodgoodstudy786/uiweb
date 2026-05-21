const menuButton = document.querySelector(".menu-button");
const menuPanel = document.querySelector(".menu-panel");
const menuLinks = document.querySelectorAll(".menu-panel a");
const footerContactForm = document.querySelector(".contact-form");
const contactFeedback = document.querySelector(".contact-feedback");
const startProjectButtons = document.querySelectorAll(".js-start-project");
const leadModal = document.querySelector(".lead-modal");
const leadModalPanel = document.querySelector(".lead-modal-panel");
const leadModalCloseButtons = document.querySelectorAll("[data-lead-close]");
const leadForm = document.querySelector(".lead-form");
const leadInput = document.querySelector("#lead-phone");
const leadFeedback = document.querySelector(".lead-feedback");
const header = document.querySelector(".site-header");
const worksSection = document.querySelector("#works");
const caseRoot = document.querySelector("#case-root");
const leadSubmitUrl =
  window.__CONTACT_SUBMIT_URL__ || (window.location.protocol === "file:" ? "" : "/api/lead");
const SITE_DATA = window.__SITE_DATA__ || null;

const hoverSelectors = [
  ".work-link",
  ".work-card",
  ".case-card",
  ".service-rail article",
  ".process-list article",
  ".stats article",
  ".inspiration-item",
  ".case-aside article",
  ".case-switch",
  ".footer-main > div",
];

const CASE_DATA = {
  coop: {
    id: "coop",
    type: "协作平台 / 工作台",
    title: "协作平台体验重构",
    body: [
      "把任务、权限、交付和版本记录收进一个更容易扫描的工作台，减少团队在多个页面之间来回跳转。",
      "这个版本的重点是重新整理信息层级，让最常用的动作先出现在视线里，再用更稳定的组件状态承接后续协作。",
    ],
    visual: `
      <div class="work-shot feature-shot" role="img" aria-label="协作平台案例详情预览">
        <div class="browser-bar"><span></span><span></span><span></span><em>协作平台 / 详情页</em></div>
        <div class="feature-layout">
          <aside>
            <strong>项目中心</strong>
            <span>任务总览</span>
            <span>团队权限</span>
            <span>设计交付</span>
            <span>版本记录</span>
          </aside>
          <div class="feature-main">
            <div class="mock-row">
              <p>本周重点</p>
              <b>上线前走查</b>
            </div>
            <div class="mock-grid">
              <section><span>进行中</span><strong>24</strong></section>
              <section><span>待确认</span><strong>08</strong></section>
              <section><span>已交付</span><strong>116</strong></section>
            </div>
            <div class="timeline">
              <i></i><i></i><i></i><i></i><i></i>
            </div>
          </div>
        </div>
      </div>
    `,
    cover: `
      <div class="case-cover-art case-cover-art--coop" role="img" aria-label="协作平台封面">
        <div class="case-cover-browser"><span></span><span></span><span></span><em>协作平台 / 工作台</em></div>
        <div class="case-cover-layout">
          <strong>项目中心</strong>
          <div class="case-cover-row"><i></i><i></i><i></i></div>
          <div class="case-cover-chip">上线前走查</div>
        </div>
      </div>
    `,
  },
  growth: {
    id: "growth",
    type: "数据可视化 / 仪表盘",
    title: "增长数据工作台",
    body: [
      "把分散的指标、趋势和异常提示放进一个更高密度的看板，帮助运营和产品更快做决定。",
      "这个页面重点不是装满数据，而是把最关键的数字摆在第一眼能读到的位置，同时保留继续下钻的路径。",
    ],
    visual: `
      <div class="work-shot dashboard-shot" role="img" aria-label="增长数据案例详情预览">
        <div class="browser-bar"><span></span><span></span><span></span><em>增长数据 / 看板详情</em></div>
        <div class="chart-panel">
          <strong>转化趋势</strong>
          <div class="bars"><i></i><i></i><i></i><i></i><i></i><i></i></div>
        </div>
        <div class="metric-strip">
          <span>访问 48.6万</span>
          <span>转化 12.8%</span>
          <span>留存 71%</span>
        </div>
      </div>
    `,
    cover: `
      <div class="case-cover-art case-cover-art--growth" role="img" aria-label="增长数据封面">
        <div class="case-cover-browser"><span></span><span></span><span></span><em>增长数据 / 仪表盘</em></div>
        <div class="case-cover-chart">
          <i></i><i></i><i></i><i></i><i></i><i></i>
        </div>
        <div class="case-cover-strip">
          <span>48.6万</span>
          <span>12.8%</span>
          <span>71%</span>
        </div>
      </div>
    `,
  },
  mobile: {
    id: "mobile",
    type: "移动界面 / 会员体系",
    title: "生活方式移动应用",
    body: [
      "把会员中心、内容推荐和日常任务合并成更轻的手机体验，让用户操作更快，也更愿意停留。",
      "这套方案尽量缩短每一步的决策成本，让浏览、选择和确认都能在移动端顺畅完成。",
    ],
    visual: `
      <div class="work-shot mobile-shot" role="img" aria-label="生活方式移动应用案例详情预览">
        <div class="phone">
          <span>会员中心</span>
          <strong>今日灵感</strong>
          <div class="phone-card">已完成 3 个任务</div>
          <div class="phone-list"><i></i><i></i><i></i></div>
        </div>
      </div>
    `,
    cover: `
      <div class="case-cover-art case-cover-art--mobile" role="img" aria-label="生活方式移动应用封面">
        <div class="case-cover-browser"><span></span><span></span><span></span><em>生活方式 / 移动端</em></div>
        <div class="case-cover-phone">
          <span>会员中心</span>
          <strong>今日灵感</strong>
          <div class="case-cover-phone-card">已完成 3 个任务</div>
        </div>
      </div>
    `,
  },
};

function getCaseCatalog() {
  if (SITE_DATA?.cases?.length) {
    return Object.fromEntries(
      SITE_DATA.cases.map((item) => {
        const key = item.id || item.slug;
        return [key, item];
      }),
    );
  }

  return CASE_DATA;
}

function getHeaderOffset() {
  const headerHeight = header ? header.getBoundingClientRect().height : 0;
  return Math.max(84, headerHeight + 20);
}

function setMenu(open) {
  if (!menuButton || !menuPanel) {
    return;
  }

  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.setAttribute("aria-label", open ? "关闭菜单" : "打开菜单");
  menuPanel.classList.toggle("is-open", open);
  document.body.classList.toggle("menu-open", open);
}

function scrollToTarget(hash, options = {}) {
  const target = hash ? document.querySelector(hash) : null;
  if (!target) {
    return false;
  }

  const offset = getHeaderOffset();
  const top = Math.max(
    0,
    target.getBoundingClientRect().top + window.pageYOffset - offset,
  );

  window.scrollTo({
    top,
    behavior: options.behavior ?? "smooth",
  });

  if (options.focus !== false) {
    if (!target.hasAttribute("tabindex")) {
      target.setAttribute("tabindex", "-1");
    }
    target.focus({ preventScroll: true });
  }

  if (options.updateHash !== false) {
    history.pushState(null, "", hash);
  }

  return true;
}

function renderCasePage(item) {
  const switcher = Object.values(getCaseCatalog())
    .filter((candidate) => candidate.id !== item.id)
    .map((candidate, index) => {
      return `
        <a class="case-card reveal" href="./case.html?case=${candidate.id}" aria-label="打开${candidate.title}">
          <figure class="case-card-cover">${candidate.cover}</figure>
          <div class="case-card-body">
            <h3>${candidate.title}</h3>
          </div>
        </a>
      `;
    })
    .join("");

  return `
    <section class="section case-hero reveal" aria-labelledby="${item.id}-title">
      <p class="tiny-label">案例类型 · ${item.type}</p>
      <div class="case-hero-head">
        <h1 id="${item.id}-title">${item.title}</h1>
        <a class="text-link" href="./index.html#works">返回作品</a>
      </div>
    </section>
    <section class="section case-body reveal" aria-labelledby="${item.id}-story-title">
      <div class="case-body-copy">
        <p class="tiny-label" id="${item.id}-story-title">项目说明</p>
        ${item.body
          .map((paragraph) => `<p>${paragraph}</p>`)
          .join("")}
      </div>
      <figure class="case-body-visual">
        ${item.visual}
      </figure>
    </section>
    <section class="section case-more reveal" aria-labelledby="${item.id}-more-title">
      <div class="section-head">
        <h2 id="${item.id}-more-title">其他案例</h2>
        <p><span></span>继续浏览</p>
      </div>
      <div class="case-more-grid">${switcher}</div>
    </section>
  `;
}

function setupRevealTargets() {
  const revealSelectors = [
    ".hero-title-wrap",
    ".hero-copy",
    ".red-band",
    ".client-grid",
    ".section-head",
    ".work-feature",
    ".work-card",
    ".work-link",
    ".case-hero",
    ".case-body",
    ".case-body-visual",
    ".case-more",
    ".case-card",
    ".stats article",
    ".service-rail article",
    ".process-list article",
    ".inspiration",
    ".inspiration-page-hero",
    ".inspiration-list-section",
    ".inspiration-item",
    ".final-cta",
    ".footer-top",
    ".footer-main > div",
    ".footer-bottom",
  ];

  const targets = Array.from(
    new Set(
      revealSelectors.flatMap((selector) =>
        Array.from(document.querySelectorAll(selector)),
      ),
    ),
  );

  if (!targets.length) {
    return;
  }

  document.documentElement.classList.add("js-ready");

  targets.forEach((element, index) => {
    element.classList.add("reveal");
    element.style.setProperty("--reveal-delay", `${(index % 6) * 90}ms`);
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -8% 0px",
    },
  );

  targets.forEach((element) => observer.observe(element));

  requestAnimationFrame(() => {
    targets.forEach((element) => {
      const rect = element.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < window.innerHeight * 0.92) {
        element.classList.add("is-visible");
      }
    });
  });
}

function setHoveredInteractive(element) {
  if (hoveredInteractive === element) {
    return;
  }

  if (hoveredInteractive) {
    hoveredInteractive.classList.remove("is-hovered");
  }

  hoveredInteractive = element;

  if (hoveredInteractive) {
    hoveredInteractive.classList.add("is-hovered");
  }
}

function syncMenuFromHash() {
  if (!menuPanel || !menuButton) {
    return;
  }

  if (menuPanel.classList.contains("is-open")) {
    setMenu(false);
  }
}

function getCaseIdFromLocation() {
  const params = new URLSearchParams(window.location.search);
  const requested = params.get("case");
  const catalog = getCaseCatalog();
  return catalog[requested] ? requested : Object.keys(catalog)[0] || "coop";
}

function setLeadModalOpen(open) {
  if (!leadModal) {
    return;
  }

  leadModal.hidden = !open;
  leadModal.classList.toggle("is-open", open);
  document.body.classList.toggle("lead-modal-open", open);

  if (open) {
    window.setTimeout(() => {
      leadInput?.focus();
    }, 0);
  } else {
    startProjectButtons[0]?.focus();
  }
}

function showLeadStatus(message, type = "info") {
  if (leadFeedback) {
    leadFeedback.textContent = message;
    leadFeedback.dataset.status = type;
  }
}

function showContactStatus(message, type = "info") {
  if (contactFeedback) {
    contactFeedback.textContent = message;
    contactFeedback.dataset.status = type;
  }
}

function storeLeadDraft(payload) {
  try {
    const existing = JSON.parse(localStorage.getItem("ruoan.design:lead-drafts") || "[]");
    existing.push(payload);
    localStorage.setItem("ruoan.design:lead-drafts", JSON.stringify(existing.slice(-10)));
  } catch (error) {
    console.warn("无法暂存联系方式", error);
  }
}

async function submitLead(phone, source) {
  const payload = {
    phone,
    source,
    page: window.location.href,
    submittedAt: new Date().toISOString(),
  };

  if (leadSubmitUrl) {
    const response = await fetch(leadSubmitUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`提交失败：${response.status}`);
    }

    return { mode: "network" };
  }

  storeLeadDraft(payload);
  return { mode: "local" };
}

let hoveredInteractive = null;

if (caseRoot) {
  const catalog = getCaseCatalog();
  const caseId = getCaseIdFromLocation();
  const caseItem = catalog[caseId] || Object.values(catalog)[0];
  document.body.classList.add("case-page");
  document.title = `${caseItem.title} / 京鹏JPENG 界面设计师`;
  if (!SITE_DATA?.cases?.length) {
    caseRoot.innerHTML = renderCasePage(caseItem);
  }
}

setupRevealTargets();

if (menuButton && menuPanel) {
  menuButton.addEventListener("click", () => {
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    setMenu(!isOpen);
  });

  menuPanel.addEventListener("click", (event) => {
    if (event.target === menuPanel) {
      setMenu(false);
    }
  });
}

menuLinks.forEach((link) => {
  link.addEventListener("click", () => setMenu(false));
});

if (startProjectButtons.length && leadModal) {
  startProjectButtons.forEach((button) => {
    button.addEventListener("click", () => {
      showLeadStatus("", "info");
      setLeadModalOpen(true);
    });
  });
}

leadModalCloseButtons.forEach((button) => {
  button.addEventListener("click", () => setLeadModalOpen(false));
});

if (leadModal) {
  leadModal.addEventListener("click", (event) => {
    if (event.target === leadModal) {
      setLeadModalOpen(false);
    }
  });
}

if (leadForm) {
  leadForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = leadForm.querySelector('button[type="submit"]');
    const originalText = submitButton?.textContent || "提交";
    const phone = leadInput?.value.trim() || "";

    if (!phone) {
      showLeadStatus("请先填写手机号。", "error");
      leadInput?.focus();
      return;
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "提交中…";
    }

    showLeadStatus("正在提交到后台…", "info");

    try {
      const result = await submitLead(phone, "首页开始项目弹窗");
      leadForm.reset();
      showLeadStatus(
        result.mode === "network"
          ? "已提交，我会尽快联系你。"
          : "已暂存到本地预览，后台接口接通后即可提交。",
        "success",
      );

      window.setTimeout(() => {
        setLeadModalOpen(false);
      }, 900);
    } catch (error) {
      showLeadStatus("提交失败，请稍后重试或直接联系邮箱。", "error");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      }
    }
  });
}

if (footerContactForm) {
  footerContactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = footerContactForm.querySelector('button[type="submit"]');
    const originalText = submitButton?.textContent || "联系我";
    const contactInput = footerContactForm.querySelector("input");
    const contactValue = contactInput?.value.trim() || "";

    if (!contactValue) {
      showContactStatus("请先填写联系方式。", "error");
      contactInput?.focus();
      return;
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "发送中…";
    }

    showContactStatus("正在发送到后台…", "info");

    try {
      const result = await submitLead(contactValue, "页脚联系方式");
      footerContactForm.reset();
      showContactStatus(
        result.mode === "network"
          ? "已收到联系方式，我会尽快联系你。"
          : "已暂存到本地预览，后台接口接通后即可提交。",
        "success",
      );
    } catch (error) {
      showContactStatus("发送失败，请稍后重试。", "error");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      }
    }
  });
}

document.addEventListener("click", (event) => {
  const link = event.target instanceof Element ? event.target.closest("a[href^='#']") : null;
  if (!link) {
    return;
  }

  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return;
  }

  const href = link.getAttribute("href");
  if (!href || href === "#") {
    return;
  }

  const target = document.querySelector(href);
  if (!target) {
    return;
  }

  event.preventDefault();
  setMenu(false);
  scrollToTarget(href);
});

document.addEventListener("mousemove", (event) => {
  if (!(event.target instanceof Element)) {
    setHoveredInteractive(null);
    return;
  }

  const candidate = event.target.closest(hoverSelectors.join(", "));
  setHoveredInteractive(candidate);
});

document.addEventListener(
  "mouseleave",
  () => {
    setHoveredInteractive(null);
  },
  true,
);

window.addEventListener("hashchange", () => {
  const { hash } = window.location;
  if (!hash) {
    return;
  }

  scrollToTarget(hash, { updateHash: false, focus: false, behavior: "auto" });
  syncMenuFromHash();
});

window.addEventListener("keyup", (event) => {
  if (event.key === "Escape") {
    setMenu(false);
    setLeadModalOpen(false);
  }
});

const backToTopButton = document.getElementById("back-to-top");
if (backToTopButton) {
  const scrollThreshold = 400;

  const toggleBackToTop = () => {
    if (window.scrollY > scrollThreshold) {
      backToTopButton.removeAttribute("hidden");
    } else {
      backToTopButton.setAttribute("hidden", "");
    }
  };

  window.addEventListener("scroll", toggleBackToTop, { passive: true });
  toggleBackToTop();

  backToTopButton.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}
