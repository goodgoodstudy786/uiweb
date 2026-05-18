import type { InspirationItem, NavigationLink } from "./types";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.trim() || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || "";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

type SiteData = {
  meta: { title: string; description: string };
  brand: { line1: string; line2: string; loaderLabel: string };
  navigationTitle: string;
  worksSection: { title: string; badge: string };
  navigation: NavigationLink[];
  hero: { titleLine1: string; titleLine2: string; copy: string; ctaLabel: string };
  ticker: string[];
  redBand: { title: string; subtitle: string };
  capabilities: string[];
  works: Array<{
    id: string;
    slug: string;
    title: string;
    meta: string;
    href: string;
    visual: Record<string, unknown>;
  }>;
  about: {
    eyebrow: string;
    titleBefore: string;
    titleAccent: string;
    titleAfter: string;
    stats: Array<{ value: string; title: string; description: string }>;
  };
  services: {
    eyebrow: string;
    title: string;
    description: string;
    items: Array<{ step: string; title: string; description: string }>;
  };
  process: {
    eyebrow: string;
    title: string;
    items: Array<{ step: string; title: string; description: string }>;
  };
  inspiration: {
    eyebrow: string;
    titleLine1: string;
    titleLine2: string;
    description: string;
    detailButtonLabel: string;
    items: InspirationItem[];
  };
  cta: {
    eyebrow: string;
    titleLine1: string;
    titleLine2: string;
    description: string;
    buttonLabel: string;
  };
  contact: {
    intro: string;
    placeholder: string;
    buttonLabel: string;
    feedback: string;
  };
  footer: {
    brandDescription: string;
    servicesTitle: string;
    servicesLinks: NavigationLink[];
    contactTitle: string;
    contactLinks: NavigationLink[];
    copyright: string;
    email: string;
  };
  leadModal: {
    title: string;
    description: string;
    inputPlaceholder: string;
    submitLabel: string;
  };
  cases: Array<{
    id: string;
    slug: string;
    type: string;
    title: string;
    summary: string[];
    visual: Record<string, unknown>;
  }>;
};

let siteData: SiteData | null = null;
let currentSection = "dashboard";

const STORAGE_KEY = "site_data";
const DATA_URL = "/data/site.json";
const AUTH_KEY = "admin_auth";
const ADMIN_PASSWORD = "admin123";

function checkAuth() {
  const isAuth = localStorage.getItem(AUTH_KEY);
  if (!isAuth) {
    showLogin();
    return false;
  }
  return true;
}

function showLogin() {
  document.getElementById("admin-app")!.innerHTML = `
    <div class="admin-login-container">
      <div class="admin-login-card">
        <h1 class="admin-login-title">管理后台登录</h1>
        <form class="admin-login-form" id="login-form">
          <div class="admin-form-group">
            <label class="admin-form-label">密码</label>
            <input type="password" class="admin-form-input" id="admin-password" placeholder="请输入管理密码" />
          </div>
          <button type="submit" class="admin-btn admin-btn-primary admin-btn-block">登录</button>
        </form>
        <p class="admin-login-hint">默认密码：admin123</p>
      </div>
    </div>
  `;

  document.getElementById("login-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const password = (document.getElementById("admin-password") as HTMLInputElement).value;
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem(AUTH_KEY, "true");
      init();
    } else {
      showToast("密码错误", "error");
    }
  });
}

function logout() {
  localStorage.removeItem(AUTH_KEY);
  showLogin();
}

async function loadSiteData() {
  // 优先从 Supabase 加载
  try {
    const { data, error } = await supabase
      .from("homepage")
      .select("content")
      .eq("slug", "main")
      .single();
    
    if (data && !error) {
      siteData = data.content as SiteData;
      return;
    }
  } catch (e) {
    console.error("Failed to load from Supabase:", e);
  }
  
  // 如果 Supabase 失败，从本地文件加载
  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error("Failed to load site data");
    siteData = await response.json();
  } catch (error) {
    console.error("Load site data failed:", error);
    showToast("加载数据失败", "error");
  }
}

async function saveToSupabase() {
  if (!siteData) return;
  
  try {
    const { error } = await supabase
      .from("homepage")
      .upsert({ slug: "main", content: siteData, is_active: true }, { onConflict: "slug" });
    
    if (error) throw error;
    showToast("保存成功，已同步到云端", "success");
  } catch (error) {
    console.error("Save to Supabase failed:", error);
    showToast("保存失败", "error");
  }
}

function saveSiteData() {
  collectFormData();
  saveToSupabase();
}

function showToast(message: string, type: "success" | "error" = "success") {
  const existing = document.querySelector(".admin-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = `admin-toast admin-toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function renderSidebar() {
  return `
    <aside class="admin-sidebar">
      <div class="admin-sidebar-brand">
        <div class="brand-icon">L</div>
        <div>
          <div class="brand-text">林若安设计</div>
          <div class="brand-sub">管理后台</div>
        </div>
      </div>
      <nav class="admin-sidebar-nav">
        <div class="admin-nav-group">
          <div class="admin-nav-group-title">概览</div>
          <button class="admin-nav-item ${currentSection === "dashboard" ? "active" : ""}" data-section="dashboard">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            仪表盘
          </button>
        </div>
        <div class="admin-nav-group">
          <div class="admin-nav-group-title">内容管理</div>
          <button class="admin-nav-item ${currentSection === "site" ? "active" : ""}" data-section="site">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6m-9-9H3m6 0H3m18 0h-6m6 0h-6m1.5-9l-4.5 4.5m0-4.5L12 6"/></svg>
            站点设置
          </button>
          <button class="admin-nav-item ${currentSection === "navigation" ? "active" : ""}" data-section="navigation">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            导航管理
          </button>
          <button class="admin-nav-item ${currentSection === "works" ? "active" : ""}" data-section="works">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
            作品管理
          </button>
          <button class="admin-nav-item ${currentSection === "inspiration" ? "active" : ""}" data-section="inspiration">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            灵感库管理
          </button>
        </div>
        <div class="admin-nav-group">
          <div class="admin-nav-group-title">首页内容</div>
          <button class="admin-nav-item ${currentSection === "hero" ? "active" : ""}" data-section="hero">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            首屏区域
          </button>
          <button class="admin-nav-item ${currentSection === "about" ? "active" : ""}" data-section="about">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            关于我
          </button>
          <button class="admin-nav-item ${currentSection === "services" ? "active" : ""}" data-section="services">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
            服务与流程
          </button>
          <button class="admin-nav-item ${currentSection === "contact" ? "active" : ""}" data-section="contact">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            联系与底部
          </button>
        </div>
      </nav>
      <div class="admin-sidebar-footer">
        <div class="user-avatar">A</div>
        <div class="user-info">
          <div class="user-name">管理员</div>
          <div class="user-role">超级管理员</div>
        </div>
      </div>
    </aside>
  `;
}

function renderHeader() {
  const titles: Record<string, string> = {
    dashboard: "仪表盘",
    site: "站点设置",
    navigation: "导航管理",
    works: "作品管理",
    inspiration: "灵感库管理",
    hero: "首屏区域",
    about: "关于我",
    services: "服务与流程",
    contact: "联系与底部",
  };
  return `
    <header class="admin-header">
      <h1 class="admin-header-title">${titles[currentSection] || "管理后台"}</h1>
      <div class="admin-header-actions">
        <button class="admin-btn admin-btn-secondary" id="btn-view-site">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          查看网站
        </button>
        <button class="admin-btn admin-btn-primary" id="btn-save-data">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          保存更改
        </button>
      </div>
    </header>
  `;
}

function renderDashboard() {
  if (!siteData) return "";
  const worksCount = siteData.works.length;
  const inspirationCount = siteData.inspiration.items.length;
  const navCount = siteData.navigation.length;
  const casesCount = siteData.cases.length;

  return `
    <div class="admin-content">
      <div class="admin-stats-grid">
        <div class="admin-stat-card">
          <div class="admin-stat-icon blue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/></svg>
          </div>
          <div>
            <div class="admin-stat-value">${worksCount}</div>
            <div class="admin-stat-label">作品数量</div>
          </div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-icon green">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </div>
          <div>
            <div class="admin-stat-value">${inspirationCount}</div>
            <div class="admin-stat-label">灵感收藏</div>
          </div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-icon orange">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/></svg>
          </div>
          <div>
            <div class="admin-stat-value">${navCount}</div>
            <div class="admin-stat-label">导航链接</div>
          </div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-icon purple">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
          </div>
          <div>
            <div class="admin-stat-value">${casesCount}</div>
            <div class="admin-stat-label">案例详情</div>
          </div>
        </div>
      </div>
      <div class="admin-card">
        <div class="admin-card-title">快速操作</div>
        <div class="admin-btn-group">
          <button class="admin-btn admin-btn-primary" data-goto="works">管理作品</button>
          <button class="admin-btn admin-btn-secondary" data-goto="inspiration">管理灵感库</button>
          <button class="admin-btn admin-btn-secondary" data-goto="site">站点设置</button>
          <button class="admin-btn admin-btn-secondary" data-goto="hero">编辑首屏</button>
        </div>
      </div>
      <div class="admin-card">
        <div class="admin-card-title">网站信息</div>
        <table class="admin-table">
          <tr><th>网站标题</th><td>${siteData.meta.title}</td></tr>
          <tr><th>网站描述</th><td>${siteData.meta.description}</td></tr>
          <tr><th>品牌名称</th><td>${siteData.brand.line1}</td></tr>
          <tr><th>品牌定位</th><td>${siteData.brand.line2}</td></tr>
          <tr><th>联系邮箱</th><td>${siteData.footer.email}</td></tr>
          <tr><th>版权信息</th><td>${siteData.footer.copyright}</td></tr>
        </table>
      </div>
    </div>
  `;
}

function renderSiteSettings() {
  if (!siteData) return "";
  return `
    <div class="admin-content">
      <div class="admin-card">
        <div class="admin-card-title">SEO 设置</div>
        <div class="admin-form-group">
          <label class="admin-form-label">网站标题</label>
          <input type="text" class="admin-form-input" id="site-meta-title" value="${siteData.meta.title}">
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label">网站描述</label>
          <textarea class="admin-form-textarea" id="site-meta-desc">${siteData.meta.description}</textarea>
        </div>
      </div>
      <div class="admin-card">
        <div class="admin-card-title">品牌信息</div>
        <div class="admin-form-row">
          <div class="admin-form-group">
            <label class="admin-form-label">品牌名称</label>
            <input type="text" class="admin-form-input" id="site-brand-line1" value="${siteData.brand.line1}">
          </div>
          <div class="admin-form-group">
            <label class="admin-form-label">品牌定位</label>
            <input type="text" class="admin-form-input" id="site-brand-line2" value="${siteData.brand.line2}">
          </div>
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label">加载提示文字</label>
          <input type="text" class="admin-form-input" id="site-brand-loader" value="${siteData.brand.loaderLabel}">
        </div>
      </div>
      <div class="admin-card">
        <div class="admin-card-title">导航标题</div>
        <div class="admin-form-group">
          <label class="admin-form-label">导航菜单标题</label>
          <input type="text" class="admin-form-input" id="site-nav-title" value="${siteData.navigationTitle}">
        </div>
      </div>
    </div>
  `;
}

function renderNavigation() {
  if (!siteData) return "";
  const navItems = siteData.navigation.map((item, index) => `
    <div class="admin-list-item">
      <div class="admin-list-item-content">
        <div class="admin-list-item-title">${item.label}</div>
        <div class="admin-list-item-desc">${item.href}</div>
      </div>
      <div class="admin-list-item-actions">
        <button class="admin-btn admin-btn-secondary admin-btn-sm" data-edit-nav="${index}">编辑</button>
        <button class="admin-btn admin-btn-danger admin-btn-sm" data-delete-nav="${index}">删除</button>
      </div>
    </div>
  `).join("");

  return `
    <div class="admin-content">
      <div class="admin-card">
        <div class="admin-card-title">导航链接列表</div>
        <div id="nav-list">${navItems}</div>
        <div class="admin-btn-group">
          <button class="admin-btn admin-btn-primary" id="btn-add-nav">添加导航链接</button>
        </div>
      </div>
    </div>
  `;
}

function renderWorks() {
  if (!siteData) return "";
  const worksItems = siteData.works.map((item, index) => `
    <div class="admin-list-item">
      <div class="admin-list-item-content">
        <div class="admin-list-item-title">${item.title}</div>
        <div class="admin-list-item-desc">${item.meta}</div>
      </div>
      <div class="admin-list-item-actions">
        <button class="admin-btn admin-btn-secondary admin-btn-sm" data-edit-work="${index}">编辑</button>
        <button class="admin-btn admin-btn-danger admin-btn-sm" data-delete-work="${index}">删除</button>
      </div>
    </div>
  `).join("");

  return `
    <div class="admin-content">
      <div class="admin-card">
        <div class="admin-card-title">作品列表</div>
        <div id="works-list">${worksItems}</div>
        <div class="admin-btn-group">
          <button class="admin-btn admin-btn-primary" id="btn-add-work">添加作品</button>
        </div>
      </div>
    </div>
  `;
}

function renderInspiration() {
  if (!siteData) return "";
  const items = siteData.inspiration.items.map((item, index) => `
    <div class="admin-list-item">
      <div class="admin-list-item-content">
        <div class="admin-list-item-title">${item.title}</div>
        <div class="admin-list-item-desc">${item.description}</div>
      </div>
      <div class="admin-list-item-actions">
        <button class="admin-btn admin-btn-secondary admin-btn-sm" data-edit-inspiration="${index}">编辑</button>
        <button class="admin-btn admin-btn-danger admin-btn-sm" data-delete-inspiration="${index}">删除</button>
      </div>
    </div>
  `).join("");

  return `
    <div class="admin-content">
      <div class="admin-card">
        <div class="admin-card-title">灵感库设置</div>
        <div class="admin-form-group">
          <label class="admin-form-label">区域标签</label>
          <input type="text" class="admin-form-input" id="insp-eyebrow" value="${siteData.inspiration.eyebrow}">
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label">区域标题 - 上行</label>
          <input type="text" class="admin-form-input" id="insp-title1" value="${siteData.inspiration.titleLine1}">
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label">区域标题 - 下行</label>
          <input type="text" class="admin-form-input" id="insp-title2" value="${siteData.inspiration.titleLine2}">
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label">区域描述</label>
          <textarea class="admin-form-textarea" id="insp-desc">${siteData.inspiration.description}</textarea>
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label">按钮文字</label>
          <input type="text" class="admin-form-input" id="insp-btn" value="${siteData.inspiration.detailButtonLabel}">
        </div>
      </div>
      <div class="admin-card">
        <div class="admin-card-title">灵感条目列表</div>
        <div id="insp-list">${items}</div>
        <div class="admin-btn-group">
          <button class="admin-btn admin-btn-primary" id="btn-add-inspiration">添加灵感条目</button>
        </div>
      </div>
    </div>
  `;
}

function renderHero() {
  if (!siteData) return "";
  return `
    <div class="admin-content">
      <div class="admin-card">
        <div class="admin-card-title">首屏 Hero 区域</div>
        <div class="admin-form-row">
          <div class="admin-form-group">
            <label class="admin-form-label">主标题 - 上行</label>
            <input type="text" class="admin-form-input" id="hero-title1" value="${siteData.hero.titleLine1}">
          </div>
          <div class="admin-form-group">
            <label class="admin-form-label">主标题 - 下行</label>
            <input type="text" class="admin-form-input" id="hero-title2" value="${siteData.hero.titleLine2}">
          </div>
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label">副标题描述</label>
          <textarea class="admin-form-textarea" id="hero-copy">${siteData.hero.copy}</textarea>
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label">按钮文字</label>
          <input type="text" class="admin-form-input" id="hero-cta" value="${siteData.hero.ctaLabel}">
        </div>
      </div>
      <div class="admin-card">
        <div class="admin-card-title">滚动文字 (Ticker)</div>
        <div class="admin-form-group">
          <label class="admin-form-label">滚动文字列表 (每行一个)</label>
          <textarea class="admin-form-textarea" id="hero-ticker">${siteData.ticker.join("\n")}</textarea>
        </div>
      </div>
      <div class="admin-card">
        <div class="admin-card-title">红色横幅区域</div>
        <div class="admin-form-group">
          <label class="admin-form-label">横幅标题</label>
          <textarea class="admin-form-textarea" id="redband-title">${siteData.redBand.title}</textarea>
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label">横幅副标题</label>
          <input type="text" class="admin-form-input" id="redband-subtitle" value="${siteData.redBand.subtitle}">
        </div>
      </div>
      <div class="admin-card">
        <div class="admin-card-title">能力标签 (Capabilities)</div>
        <div class="admin-form-group">
          <label class="admin-form-label">能力标签列表 (每行一个)</label>
          <textarea class="admin-form-textarea" id="capabilities">${siteData.capabilities.join("\n")}</textarea>
        </div>
      </div>
      <div class="admin-card">
        <div class="admin-card-title">作品区域设置</div>
        <div class="admin-form-row">
          <div class="admin-form-group">
            <label class="admin-form-label">区域标题</label>
            <input type="text" class="admin-form-input" id="works-section-title" value="${siteData.worksSection.title}">
          </div>
          <div class="admin-form-group">
            <label class="admin-form-label">徽章文字</label>
            <input type="text" class="admin-form-input" id="works-section-badge" value="${siteData.worksSection.badge}">
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderAbout() {
  if (!siteData) return "";
  const stats = siteData.about.stats.map((stat, index) => `
    <div class="admin-card">
      <div class="admin-card-title">统计数据 ${index + 1}</div>
      <div class="admin-form-row">
        <div class="admin-form-group">
          <label class="admin-form-label">数值</label>
          <input type="text" class="admin-form-input" id="about-stat-value-${index}" value="${stat.value}">
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label">标题</label>
          <input type="text" class="admin-form-input" id="about-stat-title-${index}" value="${stat.title}">
        </div>
      </div>
      <div class="admin-form-group">
        <label class="admin-form-label">描述</label>
        <textarea class="admin-form-textarea" id="about-stat-desc-${index}">${stat.description}</textarea>
      </div>
    </div>
  `).join("");

  return `
    <div class="admin-content">
      <div class="admin-card">
        <div class="admin-card-title">关于我 - 标题</div>
        <div class="admin-form-group">
          <label class="admin-form-label">区域标签</label>
          <input type="text" class="admin-form-input" id="about-eyebrow" value="${siteData.about.eyebrow}">
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label">标题 - 前段</label>
          <input type="text" class="admin-form-input" id="about-title-before" value="${siteData.about.titleBefore}">
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label">标题 - 强调部分</label>
          <input type="text" class="admin-form-input" id="about-title-accent" value="${siteData.about.titleAccent}">
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label">标题 - 后段</label>
          <input type="text" class="admin-form-input" id="about-title-after" value="${siteData.about.titleAfter}">
        </div>
      </div>
      <div class="admin-card">
        <div class="admin-card-title">关于我 - 统计数据</div>
        ${stats}
      </div>
    </div>
  `;
}

function renderServices() {
  if (!siteData) return "";
  const servicesItems = siteData.services.items.map((item, index) => `
    <div class="admin-card">
      <div class="admin-card-title">服务项目 ${item.step}</div>
      <div class="admin-form-group">
        <label class="admin-form-label">标题</label>
        <input type="text" class="admin-form-input" id="service-title-${index}" value="${item.title}">
      </div>
      <div class="admin-form-group">
        <label class="admin-form-label">描述</label>
        <textarea class="admin-form-textarea" id="service-desc-${index}">${item.description}</textarea>
      </div>
    </div>
  `).join("");

  const processItems = siteData.process.items.map((item, index) => `
    <div class="admin-card">
      <div class="admin-card-title">流程步骤 ${item.step}</div>
      <div class="admin-form-group">
        <label class="admin-form-label">标题</label>
        <input type="text" class="admin-form-input" id="process-title-${index}" value="${item.title}">
      </div>
      <div class="admin-form-group">
        <label class="admin-form-label">描述</label>
        <textarea class="admin-form-textarea" id="process-desc-${index}">${item.description}</textarea>
      </div>
    </div>
  `).join("");

  return `
    <div class="admin-content">
      <div class="admin-card">
        <div class="admin-card-title">服务区域设置</div>
        <div class="admin-form-group">
          <label class="admin-form-label">区域标签</label>
          <input type="text" class="admin-form-input" id="services-eyebrow" value="${siteData.services.eyebrow}">
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label">区域标题</label>
          <textarea class="admin-form-textarea" id="services-title">${siteData.services.title}</textarea>
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label">区域描述</label>
          <textarea class="admin-form-textarea" id="services-desc">${siteData.services.description}</textarea>
        </div>
      </div>
      <div class="admin-card">
        <div class="admin-card-title">服务项目列表</div>
        ${servicesItems}
      </div>
      <div class="admin-card">
        <div class="admin-card-title">流程区域设置</div>
        <div class="admin-form-row">
          <div class="admin-form-group">
            <label class="admin-form-label">区域标签</label>
            <input type="text" class="admin-form-input" id="process-eyebrow" value="${siteData.process.eyebrow}">
          </div>
          <div class="admin-form-group">
            <label class="admin-form-label">区域标题</label>
            <input type="text" class="admin-form-input" id="process-title" value="${siteData.process.title}">
          </div>
        </div>
      </div>
      <div class="admin-card">
        <div class="admin-card-title">流程步骤列表</div>
        ${processItems}
      </div>
    </div>
  `;
}

function renderContact() {
  if (!siteData) return "";
  const footerServices = siteData.footer.servicesLinks.map((link, index) => `
    <div class="admin-form-row">
      <div class="admin-form-group">
        <label class="admin-form-label">链接文字</label>
        <input type="text" class="admin-form-input" id="footer-service-label-${index}" value="${link.label}">
      </div>
      <div class="admin-form-group">
        <label class="admin-form-label">链接地址</label>
        <input type="text" class="admin-form-input" id="footer-service-href-${index}" value="${link.href}">
      </div>
    </div>
  `).join("");

  const footerContacts = siteData.footer.contactLinks.map((link, index) => `
    <div class="admin-form-row">
      <div class="admin-form-group">
        <label class="admin-form-label">链接文字</label>
        <input type="text" class="admin-form-input" id="footer-contact-label-${index}" value="${link.label}">
      </div>
      <div class="admin-form-group">
        <label class="admin-form-label">链接地址</label>
        <input type="text" class="admin-form-input" id="footer-contact-href-${index}" value="${link.href}">
      </div>
    </div>
  `).join("");

  return `
    <div class="admin-content">
      <div class="admin-card">
        <div class="admin-card-title">CTA 行动号召区域</div>
        <div class="admin-form-group">
          <label class="admin-form-label">区域标签</label>
          <input type="text" class="admin-form-input" id="cta-eyebrow" value="${siteData.cta.eyebrow}">
        </div>
        <div class="admin-form-row">
          <div class="admin-form-group">
            <label class="admin-form-label">主标题 - 上行</label>
            <input type="text" class="admin-form-input" id="cta-title1" value="${siteData.cta.titleLine1}">
          </div>
          <div class="admin-form-group">
            <label class="admin-form-label">主标题 - 下行</label>
            <input type="text" class="admin-form-input" id="cta-title2" value="${siteData.cta.titleLine2}">
          </div>
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label">描述</label>
          <textarea class="admin-form-textarea" id="cta-desc">${siteData.cta.description}</textarea>
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label">按钮文字</label>
          <input type="text" class="admin-form-input" id="cta-btn" value="${siteData.cta.buttonLabel}">
        </div>
      </div>
      <div class="admin-card">
        <div class="admin-card-title">联系表单</div>
        <div class="admin-form-group">
          <label class="admin-form-label">引导文字</label>
          <input type="text" class="admin-form-input" id="contact-intro" value="${siteData.contact.intro}">
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label">输入框占位符</label>
          <input type="text" class="admin-form-input" id="contact-placeholder" value="${siteData.contact.placeholder}">
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label">按钮文字</label>
          <input type="text" class="admin-form-input" id="contact-btn" value="${siteData.contact.buttonLabel}">
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label">提交成功提示</label>
          <input type="text" class="admin-form-input" id="contact-feedback" value="${siteData.contact.feedback}">
        </div>
      </div>
      <div class="admin-card">
        <div class="admin-card-title">底部信息</div>
        <div class="admin-form-group">
          <label class="admin-form-label">品牌描述</label>
          <textarea class="admin-form-textarea" id="footer-desc">${siteData.footer.brandDescription}</textarea>
        </div>
        <div class="admin-form-row">
          <div class="admin-form-group">
            <label class="admin-form-label">服务区域标题</label>
            <input type="text" class="admin-form-input" id="footer-services-title" value="${siteData.footer.servicesTitle}">
          </div>
          <div class="admin-form-group">
            <label class="admin-form-label">联系区域标题</label>
            <input type="text" class="admin-form-input" id="footer-contact-title" value="${siteData.footer.contactTitle}">
          </div>
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label">联系邮箱</label>
          <input type="text" class="admin-form-input" id="footer-email" value="${siteData.footer.email}">
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label">版权信息</label>
          <input type="text" class="admin-form-input" id="footer-copyright" value="${siteData.footer.copyright}">
        </div>
      </div>
      <div class="admin-card">
        <div class="admin-card-title">底部 - 服务链接</div>
        ${footerServices}
      </div>
      <div class="admin-card">
        <div class="admin-card-title">底部 - 联系链接</div>
        ${footerContacts}
      </div>
      <div class="admin-card">
        <div class="admin-card-title">引导弹窗设置</div>
        <div class="admin-form-group">
          <label class="admin-form-label">弹窗标题</label>
          <input type="text" class="admin-form-input" id="lead-modal-title" value="${siteData.leadModal.title}">
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label">弹窗描述</label>
          <textarea class="admin-form-textarea" id="lead-modal-desc">${siteData.leadModal.description}</textarea>
        </div>
        <div class="admin-form-row">
          <div class="admin-form-group">
            <label class="admin-form-label">输入框占位符</label>
            <input type="text" class="admin-form-input" id="lead-modal-placeholder" value="${siteData.leadModal.inputPlaceholder}">
          </div>
          <div class="admin-form-group">
            <label class="admin-form-label">提交按钮文字</label>
            <input type="text" class="admin-form-input" id="lead-modal-submit" value="${siteData.leadModal.submitLabel}">
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderContent() {
  switch (currentSection) {
    case "dashboard": return renderDashboard();
    case "site": return renderSiteSettings();
    case "navigation": return renderNavigation();
    case "works": return renderWorks();
    case "inspiration": return renderInspiration();
    case "hero": return renderHero();
    case "about": return renderAbout();
    case "services": return renderServices();
    case "contact": return renderContact();
    default: return renderDashboard();
  }
}

function render() {
  const app = document.getElementById("admin-app");
  if (!app) return;
  app.innerHTML = `
    <div class="admin-layout">
      ${renderSidebar()}
      <div class="admin-main">
        ${renderHeader()}
        ${renderContent()}
      </div>
    </div>
  `;
  bindEvents();
}

function bindEvents() {
  document.querySelectorAll(".admin-nav-item[data-section]").forEach(btn => {
    btn.addEventListener("click", () => {
      currentSection = (btn as HTMLElement).dataset.section!;
      render();
    });
  });

  document.querySelectorAll("[data-goto]").forEach(btn => {
    btn.addEventListener("click", () => {
      currentSection = (btn as HTMLElement).dataset.goto!;
      render();
    });
  });

  const btnSave = document.getElementById("btn-save-data");
  if (btnSave) {
    btnSave.addEventListener("click", () => {
      saveSiteData();
    });
  }

  const btnViewSite = document.getElementById("btn-view-site");
  if (btnViewSite) {
    btnViewSite.addEventListener("click", () => {
      window.open("/", "_blank");
    });
  }

  bindNavigationEvents();
  bindWorksEvents();
  bindInspirationEvents();
}

function bindNavigationEvents() {
  document.querySelectorAll("[data-edit-nav]").forEach(btn => {
    btn.addEventListener("click", () => {
      const index = parseInt((btn as HTMLElement).dataset.editNav!);
      showNavModal(index);
    });
  });

  document.querySelectorAll("[data-delete-nav]").forEach(btn => {
    btn.addEventListener("click", () => {
      const index = parseInt((btn as HTMLElement).dataset.deleteNav!);
      if (siteData && confirm("确定要删除这个导航链接吗？")) {
        siteData.navigation.splice(index, 1);
        saveToSupabase();
        render();
      }
    });
  });

  const btnAddNav = document.getElementById("btn-add-nav");
  if (btnAddNav) {
    btnAddNav.addEventListener("click", () => showNavModal(-1));
  }
}

function bindWorksEvents() {
  document.querySelectorAll("[data-edit-work]").forEach(btn => {
    btn.addEventListener("click", () => {
      const index = parseInt((btn as HTMLElement).dataset.editWork!);
      showWorkModal(index);
    });
  });

  document.querySelectorAll("[data-delete-work]").forEach(btn => {
    btn.addEventListener("click", () => {
      const index = parseInt((btn as HTMLElement).dataset.deleteWork!);
      if (siteData && confirm("确定要删除这个作品吗？")) {
        siteData.works.splice(index, 1);
        saveToSupabase();
        render();
      }
    });
  });

  const btnAddWork = document.getElementById("btn-add-work");
  if (btnAddWork) {
    btnAddWork.addEventListener("click", () => showWorkModal(-1));
  }
}

function bindInspirationEvents() {
  document.querySelectorAll("[data-edit-inspiration]").forEach(btn => {
    btn.addEventListener("click", () => {
      const index = parseInt((btn as HTMLElement).dataset.editInspiration!);
      showInspirationModal(index);
    });
  });

  document.querySelectorAll("[data-delete-inspiration]").forEach(btn => {
    btn.addEventListener("click", () => {
      const index = parseInt((btn as HTMLElement).dataset.deleteInspiration!);
      if (siteData && confirm("确定要删除这个灵感条目吗？")) {
        siteData.inspiration.items.splice(index, 1);
        saveToSupabase();
        render();
      }
    });
  });

  const btnAddInsp = document.getElementById("btn-add-inspiration");
  if (btnAddInsp) {
    btnAddInsp.addEventListener("click", () => showInspirationModal(-1));
  }
}

function showNavModal(index: number) {
  const isEdit = index >= 0;
  const item = isEdit && siteData ? siteData.navigation[index] : { label: "", href: "" };

  const modal = document.createElement("div");
  modal.className = "admin-modal-overlay";
  modal.innerHTML = `
    <div class="admin-modal">
      <div class="admin-modal-header">
        <div class="admin-modal-title">${isEdit ? "编辑导航" : "添加导航"}</div>
        <button class="admin-modal-close">&times;</button>
      </div>
      <div class="admin-modal-body">
        <div class="admin-form-group">
          <label class="admin-form-label">链接文字</label>
          <input type="text" class="admin-form-input" id="modal-nav-label" value="${item.label}">
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label">链接地址</label>
          <input type="text" class="admin-form-input" id="modal-nav-href" value="${item.href}">
        </div>
      </div>
      <div class="admin-modal-footer">
        <button class="admin-btn admin-btn-secondary" id="modal-nav-cancel">取消</button>
        <button class="admin-btn admin-btn-primary" id="modal-nav-save">保存</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector(".admin-modal-close")!.addEventListener("click", () => modal.remove());
  modal.querySelector("#modal-nav-cancel")!.addEventListener("click", () => modal.remove());
  modal.querySelector("#modal-nav-save")!.addEventListener("click", () => {
    const label = (modal.querySelector("#modal-nav-label") as HTMLInputElement).value;
    const href = (modal.querySelector("#modal-nav-href") as HTMLInputElement).value;
    if (siteData) {
      if (isEdit) {
        siteData.navigation[index] = { label, href };
      } else {
        siteData.navigation.push({ label, href });
      }
      saveToSupabase();
      render();
    }
    modal.remove();
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.remove();
  });
}

function showWorkModal(index: number) {
  const isEdit = index >= 0;
  const item = isEdit && siteData ? siteData.works[index] : { id: "", slug: "", title: "", meta: "", href: "", visual: {} };

  const modal = document.createElement("div");
  modal.className = "admin-modal-overlay";
  modal.innerHTML = `
    <div class="admin-modal">
      <div class="admin-modal-header">
        <div class="admin-modal-title">${isEdit ? "编辑作品" : "添加作品"}</div>
        <button class="admin-modal-close">&times;</button>
      </div>
      <div class="admin-modal-body">
        <div class="admin-form-row">
          <div class="admin-form-group">
            <label class="admin-form-label">作品 ID</label>
            <input type="text" class="admin-form-input" id="modal-work-id" value="${item.id}">
          </div>
          <div class="admin-form-group">
            <label class="admin-form-label">Slug</label>
            <input type="text" class="admin-form-input" id="modal-work-slug" value="${item.slug}">
          </div>
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label">作品标题</label>
          <input type="text" class="admin-form-input" id="modal-work-title" value="${item.title}">
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label">作品描述 (meta)</label>
          <input type="text" class="admin-form-input" id="modal-work-meta" value="${item.meta}">
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label">链接地址</label>
          <input type="text" class="admin-form-input" id="modal-work-href" value="${item.href}">
        </div>
      </div>
      <div class="admin-modal-footer">
        <button class="admin-btn admin-btn-secondary" id="modal-work-cancel">取消</button>
        <button class="admin-btn admin-btn-primary" id="modal-work-save">保存</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector(".admin-modal-close")!.addEventListener("click", () => modal.remove());
  modal.querySelector("#modal-work-cancel")!.addEventListener("click", () => modal.remove());
  modal.querySelector("#modal-work-save")!.addEventListener("click", () => {
    const id = (modal.querySelector("#modal-work-id") as HTMLInputElement).value;
    const slug = (modal.querySelector("#modal-work-slug") as HTMLInputElement).value;
    const title = (modal.querySelector("#modal-work-title") as HTMLInputElement).value;
    const meta = (modal.querySelector("#modal-work-meta") as HTMLInputElement).value;
    const href = (modal.querySelector("#modal-work-href") as HTMLInputElement).value;
    if (siteData) {
      const workData = { id, slug, title, meta, href, visual: item.visual };
      if (isEdit) {
        siteData.works[index] = workData;
      } else {
        siteData.works.push(workData);
      }
      saveToSupabase();
      render();
    }
    modal.remove();
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.remove();
  });
}

function showInspirationModal(index: number) {
  const isEdit = index >= 0;
  const item = isEdit && siteData ? siteData.inspiration.items[index] : { slug: "", title: "", description: "", body: [], ctaLabel: "立即前往", ctaHref: "https://example.com" };

  const modal = document.createElement("div");
  modal.className = "admin-modal-overlay";
  modal.innerHTML = `
    <div class="admin-modal">
      <div class="admin-modal-header">
        <div class="admin-modal-title">${isEdit ? "编辑灵感条目" : "添加灵感条目"}</div>
        <button class="admin-modal-close">&times;</button>
      </div>
      <div class="admin-modal-body">
        <div class="admin-form-row">
          <div class="admin-form-group">
            <label class="admin-form-label">Slug</label>
            <input type="text" class="admin-form-input" id="modal-insp-slug" value="${item.slug}">
          </div>
          <div class="admin-form-group">
            <label class="admin-form-label">标题</label>
            <input type="text" class="admin-form-input" id="modal-insp-title" value="${item.title}">
          </div>
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label">描述</label>
          <textarea class="admin-form-textarea" id="modal-insp-desc">${item.description}</textarea>
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label">正文内容 (每段一行)</label>
          <textarea class="admin-form-textarea" id="modal-insp-body">${Array.isArray(item.body) ? item.body.join("\n") : ""}</textarea>
        </div>
        <div class="admin-form-row">
          <div class="admin-form-group">
            <label class="admin-form-label">按钮文字</label>
            <input type="text" class="admin-form-input" id="modal-insp-cta-label" value="${item.ctaLabel || ""}">
          </div>
          <div class="admin-form-group">
            <label class="admin-form-label">按钮链接</label>
            <input type="text" class="admin-form-input" id="modal-insp-cta-href" value="${item.ctaHref || ""}">
          </div>
        </div>
      </div>
      <div class="admin-modal-footer">
        <button class="admin-btn admin-btn-secondary" id="modal-insp-cancel">取消</button>
        <button class="admin-btn admin-btn-primary" id="modal-insp-save">保存</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector(".admin-modal-close")!.addEventListener("click", () => modal.remove());
  modal.querySelector("#modal-insp-cancel")!.addEventListener("click", () => modal.remove());
  modal.querySelector("#modal-insp-save")!.addEventListener("click", () => {
    const slug = (modal.querySelector("#modal-insp-slug") as HTMLInputElement).value;
    const title = (modal.querySelector("#modal-insp-title") as HTMLInputElement).value;
    const description = (modal.querySelector("#modal-insp-desc") as HTMLTextAreaElement).value;
    const body = (modal.querySelector("#modal-insp-body") as HTMLTextAreaElement).value.split("\n").filter(line => line.trim());
    const ctaLabel = (modal.querySelector("#modal-insp-cta-label") as HTMLInputElement).value;
    const ctaHref = (modal.querySelector("#modal-insp-cta-href") as HTMLInputElement).value;
    if (siteData) {
      const inspItem = { slug, title, description, body, ctaLabel, ctaHref };
      if (isEdit) {
        siteData.inspiration.items[index] = inspItem;
      } else {
        siteData.inspiration.items.push(inspItem);
      }
      saveToSupabase();
      render();
    }
    modal.remove();
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.remove();
  });
}

function collectFormData() {
  if (!siteData) return;

  const getVal = (id: string) => (document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | null)?.value || "";

  siteData.meta.title = getVal("site-meta-title");
  siteData.meta.description = getVal("site-meta-desc");
  siteData.brand.line1 = getVal("site-brand-line1");
  siteData.brand.line2 = getVal("site-brand-line2");
  siteData.brand.loaderLabel = getVal("site-brand-loader");
  siteData.navigationTitle = getVal("site-nav-title");

  siteData.hero.titleLine1 = getVal("hero-title1");
  siteData.hero.titleLine2 = getVal("hero-title2");
  siteData.hero.copy = getVal("hero-copy");
  siteData.hero.ctaLabel = getVal("hero-cta");
  siteData.ticker = getVal("hero-ticker").split("\n").filter(line => line.trim());
  siteData.redBand.title = getVal("redband-title");
  siteData.redBand.subtitle = getVal("redband-subtitle");
  siteData.capabilities = getVal("capabilities").split("\n").filter(line => line.trim());
  siteData.worksSection.title = getVal("works-section-title");
  siteData.worksSection.badge = getVal("works-section-badge");

  siteData.about.eyebrow = getVal("about-eyebrow");
  siteData.about.titleBefore = getVal("about-title-before");
  siteData.about.titleAccent = getVal("about-title-accent");
  siteData.about.titleAfter = getVal("about-title-after");
  siteData.about.stats.forEach((stat, index) => {
    stat.value = getVal(`about-stat-value-${index}`);
    stat.title = getVal(`about-stat-title-${index}`);
    stat.description = getVal(`about-stat-desc-${index}`);
  });

  siteData.services.eyebrow = getVal("services-eyebrow");
  siteData.services.title = getVal("services-title");
  siteData.services.description = getVal("services-desc");
  siteData.services.items.forEach((item, index) => {
    item.title = getVal(`service-title-${index}`);
    item.description = getVal(`service-desc-${index}`);
  });

  siteData.process.eyebrow = getVal("process-eyebrow");
  siteData.process.title = getVal("process-title");
  siteData.process.items.forEach((item, index) => {
    item.title = getVal(`process-title-${index}`);
    item.description = getVal(`process-desc-${index}`);
  });

  siteData.inspiration.eyebrow = getVal("insp-eyebrow");
  siteData.inspiration.titleLine1 = getVal("insp-title1");
  siteData.inspiration.titleLine2 = getVal("insp-title2");
  siteData.inspiration.description = getVal("insp-desc");
  siteData.inspiration.detailButtonLabel = getVal("insp-btn");

  siteData.cta.eyebrow = getVal("cta-eyebrow");
  siteData.cta.titleLine1 = getVal("cta-title1");
  siteData.cta.titleLine2 = getVal("cta-title2");
  siteData.cta.description = getVal("cta-desc");
  siteData.cta.buttonLabel = getVal("cta-btn");

  siteData.contact.intro = getVal("contact-intro");
  siteData.contact.placeholder = getVal("contact-placeholder");
  siteData.contact.buttonLabel = getVal("contact-btn");
  siteData.contact.feedback = getVal("contact-feedback");

  siteData.footer.brandDescription = getVal("footer-desc");
  siteData.footer.servicesTitle = getVal("footer-services-title");
  siteData.footer.contactTitle = getVal("footer-contact-title");
  siteData.footer.email = getVal("footer-email");
  siteData.footer.copyright = getVal("footer-copyright");
  siteData.footer.servicesLinks.forEach((link, index) => {
    link.label = getVal(`footer-service-label-${index}`);
    link.href = getVal(`footer-service-href-${index}`);
  });
  siteData.footer.contactLinks.forEach((link, index) => {
    link.label = getVal(`footer-contact-label-${index}`);
    link.href = getVal(`footer-contact-href-${index}`);
  });

  siteData.leadModal.title = getVal("lead-modal-title");
  siteData.leadModal.description = getVal("lead-modal-desc");
  siteData.leadModal.inputPlaceholder = getVal("lead-modal-placeholder");
  siteData.leadModal.submitLabel = getVal("lead-modal-submit");
}

async function initSupabaseData() {
  // 检查 Supabase 是否已有数据
  const { data, error } = await supabase
    .from("homepage")
    .select("slug")
    .eq("slug", "main")
    .single();
  
  if (data && !error) {
    console.log("Supabase 已有数据，跳过初始化");
    return;
  }
  
  // 从本地文件加载初始数据并写入 Supabase
  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error("Failed to load initial data");
    const initialData = await response.json();
    
    const { error: insertError } = await supabase
      .from("homepage")
      .insert({ slug: "main", content: initialData, is_active: true });
    
    if (insertError) throw insertError;
    console.log("初始数据已写入 Supabase");
  } catch (error) {
    console.error("初始化 Supabase 数据失败:", error);
  }
}

async function init() {
  if (!checkAuth()) return;
  await initSupabaseData();
  await loadSiteData();
  render();
}

init();