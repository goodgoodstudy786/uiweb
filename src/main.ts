import { getSiteData, submitLead } from "./api";
import { renderAppLoading, renderPage } from "./render";
import type { HomeSiteData } from "./types";
import "../styles.css";

const root = document.getElementById("app");
const pageHint = (document.body.dataset.page || "home") as "home" | "case" | "inspiration" | "works" | string;

let siteData: HomeSiteData | null = null;
let hoveredInteractive: Element | null = null;

function detectPage(): "home" | "case" | "inspiration" | "works" {
  if (pageHint === "case") {
    return "case";
  }

  if (pageHint === "inspiration") {
    return "inspiration";
  }

  if (pageHint === "works") {
    return "works";
  }

  const { pathname } = window.location;
  if (pathname.includes("case.html")) {
    return "case";
  }

  if (pathname.includes("inspiration.html")) {
    return "inspiration";
  }

  if (pathname.includes("works.html")) {
    return "works";
  }

  return "home";
}

function getRequestedSlug() {
  const params = new URLSearchParams(window.location.search);
  return params.get("slug") || params.get("case") || "";
}

function getHeaderOffset() {
  const header = document.querySelector(".site-header");
  const headerHeight = header ? header.getBoundingClientRect().height : 0;
  return Math.max(84, headerHeight + 20);
}

function setMenu(open: boolean) {
  const menuButton = document.querySelector(".menu-button");
  const menuPanel = document.querySelector(".menu-panel");

  if (!(menuButton instanceof HTMLButtonElement) || !(menuPanel instanceof HTMLElement)) {
    return;
  }

  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.setAttribute("aria-label", open ? "关闭菜单" : "打开菜单");
  menuPanel.classList.toggle("is-open", open);
  document.body.classList.toggle("menu-open", open);
}

function setLeadModalOpen(open: boolean) {
  const leadModal = document.querySelector(".lead-modal");
  const leadInput = document.querySelector<HTMLInputElement>("#lead-phone");

  if (!(leadModal instanceof HTMLElement)) {
    return;
  }

  leadModal.hidden = !open;
  leadModal.classList.toggle("is-open", open);
  document.body.classList.toggle("lead-modal-open", open);

  if (open) {
    window.setTimeout(() => {
      leadInput?.focus();
    }, 0);
    return;
  }
}

function showLeadStatus(message: string, type: "info" | "success" | "error" = "info") {
  const leadFeedback = document.querySelector(".lead-feedback");
  if (leadFeedback instanceof HTMLElement) {
    leadFeedback.textContent = message;
    leadFeedback.dataset.status = type;
  }
}

function showContactStatus(message: string, type: "info" | "success" | "error" = "info") {
  const contactFeedback = document.querySelector(".contact-feedback");
  if (contactFeedback instanceof HTMLElement) {
    contactFeedback.textContent = message;
    contactFeedback.dataset.status = type;
  }
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
    ".inspiration-detail",
    ".inspiration-detail-head",
    ".inspiration-detail-copy",
    ".inspiration-detail-actions",
    ".inspiration-detail-nav",
    ".inspiration-detail-nav-link",
    ".inspiration-item",
    ".works-page-hero",
    ".works-page-list",
    ".works-page-cta",
    ".final-cta",
    ".footer-top",
    ".footer-main > div",
    ".footer-bottom",
  ];

  const targets = Array.from(
    new Set(revealSelectors.flatMap((selector) => Array.from(document.querySelectorAll(selector)))),
  );

  if (!targets.length) {
    return;
  }

  document.documentElement.classList.add("js-ready");

  targets.forEach((element, index) => {
    element.classList.add("reveal");
    (element as HTMLElement).style.setProperty("--reveal-delay", `${(index % 6) * 90}ms`);
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

function setHoveredInteractive(element: Element | null) {
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

function setupHoverTracking() {
  const hoverSelectors = [
    ".work-link",
    ".work-card",
    ".case-card",
    ".service-rail article",
    ".process-list article",
    ".stats article",
    ".inspiration-item",
    ".inspiration-detail-nav-link",
    ".footer-main > div",
    ".text-link",
    ".pill-link",
  ];

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
}

function setupMenu() {
  const menuButton = document.querySelector(".menu-button");
  const menuPanel = document.querySelector(".menu-panel");

  if (menuButton instanceof HTMLButtonElement) {
    menuButton.addEventListener("click", () => {
      const isOpen = menuButton.getAttribute("aria-expanded") === "true";
      setMenu(!isOpen);
    });
  }

  if (menuPanel instanceof HTMLElement) {
    menuPanel.addEventListener("click", (event) => {
      if (event.target === menuPanel) {
        setMenu(false);
        return;
      }
      const link = (event.target as Element).closest(".menu-panel a");
      if (link) {
        setMenu(false);
      }
    });
  }
}

function setupLeadModal() {
  const openButtons = document.querySelectorAll<HTMLButtonElement>(".js-start-project");
  const leadModal = document.querySelector(".lead-modal");
  const closeButtons = document.querySelectorAll("[data-lead-close]");
  const leadForm = document.querySelector<HTMLFormElement>("[data-lead-form]");
  const leadInput = document.querySelector<HTMLInputElement>("#lead-phone");

  openButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      showLeadStatus("", "info");
      setLeadModalOpen(true);
    });
  });

  closeButtons.forEach((button) => {
    button.addEventListener("click", () => setLeadModalOpen(false));
  });

  if (leadModal instanceof HTMLElement) {
    leadModal.addEventListener("click", (event) => {
      if (event.target === leadModal) {
        setLeadModalOpen(false);
      }
    });
  }

  if (leadForm) {
    leadForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const submitButton = leadForm.querySelector<HTMLButtonElement>('button[type="submit"]');
      const originalText = submitButton?.textContent || "提交";
      const phone = leadInput?.value.trim() || "";

      if (!phone) {
        showLeadStatus("请先填写电话。", "error");
        leadInput?.focus();
        return;
      }

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "提交中…";
      }

      showLeadStatus("正在提交到后台…", "info");

      try {
        const result = await submitLead({
          phone,
          source: "开始项目弹窗",
          pageUrl: window.location.href,
        });

        leadForm.reset();
        showLeadStatus(
          "已提交，我会尽快联系你。",
          "success",
        );

        window.setTimeout(() => {
          setLeadModalOpen(false);
        }, 1500);
      } catch (error) {
        showLeadStatus("提交失败，请稍后重试。", "error");
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalText;
        }
      }
    });
  }
}

function setupBackToTop() {
  const backToTopButton = document.getElementById("back-to-top");
  if (!backToTopButton) {
    return;
  }

  const scrollThreshold = 300;

  const toggleBackToTop = () => {
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    if (scrollY > scrollThreshold) {
      backToTopButton.classList.add("is-visible");
    } else {
      backToTopButton.classList.remove("is-visible");
    }
  };

  window.addEventListener("scroll", toggleBackToTop, { passive: true });
  toggleBackToTop();

  backToTopButton.addEventListener("click", (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

function setupContactForm() {
  const form = document.querySelector<HTMLFormElement>("[data-contact-form]");
  if (!form) {
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    const input = form.querySelector<HTMLInputElement>("#contact-info");
    const originalText = submitButton?.textContent || "联系我";
    const value = input?.value.trim() || "";

    if (!value) {
      showContactStatus("请先填写联系方式。", "error");
      input?.focus();
      return;
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "发送中…";
    }

    showContactStatus("正在发送到后台…", "info");

    try {
      const result = await submitLead({
        phone: value,
        source: "页脚联系方式",
        pageUrl: window.location.href,
      });

      form.reset();
      showContactStatus(
        result.mode === "supabase"
          ? "已收到联系方式，我会尽快联系你。"
          : "已暂存到本地预览，配置 Supabase 后即可正式入库。",
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

function scrollToHashIfNeeded() {
  const { hash } = window.location;
  if (!hash) {
    return;
  }

  const target = document.querySelector(hash);
  if (!target) {
    return;
  }

  window.setTimeout(() => {
    const top = Math.max(0, target.getBoundingClientRect().top + window.pageYOffset - getHeaderOffset());
    window.scrollTo({ top, behavior: "auto" });
  }, 0);
}

function updateMeta(page: "home" | "case" | "inspiration", projectSlug = "") {
  if (!siteData) {
    return;
  }

  const homepage = siteData.homepage;
  const inspirationItem = page === "inspiration" && projectSlug
    ? siteData.homepage.inspiration.items.find((item) => item.slug === projectSlug)
    : undefined;
  const caseProject = page === "case" && projectSlug
    ? siteData.projects.find((item) => item.slug === projectSlug)
    : undefined;
  const title =
    caseProject
      ? `${caseProject.title} / ${homepage.meta.title}`
      : inspirationItem
        ? `${inspirationItem.title} / 灵感库 / ${homepage.meta.title}`
        : page === "inspiration"
          ? `灵感库 / ${homepage.meta.title}`
          : homepage.meta.title;

  document.title = title;

  const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (description) {
    const metaDescription =
      caseProject?.detail_paragraphs[0] ||
      caseProject?.summary ||
      inspirationItem?.description ||
      inspirationItem?.body[0] ||
      homepage.meta.description;

    description.setAttribute("content", metaDescription);
  }
}

async function bootstrap() {
  if (!root) {
    return;
  }

  root.innerHTML = renderAppLoading({
    homepage: {
      meta: { title: "加载中", description: "加载中" },
      brand: { line1: "加载中", line2: "请稍候", loaderLabel: "加载中…" },
      navigationTitle: "导航",
      worksSection: { title: "作品", badge: "精选项目", pageHref: "/" },
      navigation: [],
      hero: { titleLine1: "加载中", titleLine2: "请稍候", copy: "", ctaLabel: "查看作品", ctaHref: "/" },
      ticker: [],
      redBand: { title: "", subtitle: "" },
      capabilities: [],
      about: { eyebrow: "", titleBefore: "", titleAccent: "", titleAfter: "", stats: [] },
      services: { eyebrow: "", title: "", description: "", items: [] },
      process: { eyebrow: "", title: "", items: [] },
      inspiration: { eyebrow: "", titleLine1: "", titleLine2: "", description: "", pageHref: "", items: [] },
      cta: { eyebrow: "", titleLine1: "", titleLine2: "", description: "", buttonLabel: "开始设计", buttonHref: "/" },
      contact: { intro: "", placeholder: "", buttonLabel: "联系我", feedback: "" },
      footer: { brandDescription: "", servicesTitle: "服务", servicesLinks: [], contactTitle: "联系", copyright: "", email: "hello@example.com" },
      leadModal: { title: "", description: "", inputPlaceholder: "", submitLabel: "提交" },
    },
    projects: [],
    socialLinks: [],
  });

  siteData = await getSiteData();
  const page = detectPage();
  const slug = getRequestedSlug();

  root.innerHTML = renderPage(siteData, page, slug);
  updateMeta(page, slug);
  setupRevealTargets();
  setupMenu();
  setupLeadModal();
  setupContactForm();
  setupHoverTracking();
  scrollToHashIfNeeded();
  window.addEventListener("hashchange", scrollToHashIfNeeded);
  setupBackToTop();

  window.addEventListener("keyup", (event) => {
    if (event.key === "Escape") {
      setMenu(false);
      setLeadModalOpen(false);
    }
  });
}

bootstrap().catch((error) => {
  console.error(error);
  if (root) {
    root.innerHTML = `
      <main class="section">
        <h1>页面加载失败</h1>
        <p>请检查 Supabase 环境变量是否已经配置。</p>
      </main>
    `;
  }
});
