import type { InspirationItem, NavigationLink } from "./types";
import { createClient } from "@supabase/supabase-js";
import { createEditor, getEditorData, destroyEditor, type EditorOutput } from "./editor";
import { slugify } from "./api";

function escapeHtml(value: unknown) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

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
const DATA_URL = "data/site.json";
const AUTH_KEY = "admin_auth";
const AUTH_TIMESTAMP_KEY = "admin_auth_timestamp";
const ADMIN_PASSWORD = "jiutian1995";
const AUTH_TIMEOUT = 30 * 60 * 1000; // 30分钟

function checkAuth() {
  const isAuth = localStorage.getItem(AUTH_KEY);
  const authTimestamp = localStorage.getItem(AUTH_TIMESTAMP_KEY);
  
  if (!isAuth || !authTimestamp) {
    showLogin();
    return false;
  }

  // 检查是否超过30分钟
  const now = Date.now();
  const lastActive = parseInt(authTimestamp, 10);
  
  if (now - lastActive > AUTH_TIMEOUT) {
    // 超时，清除认证状态
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(AUTH_TIMESTAMP_KEY);
    showLogin();
    return false;
  }

  // 更新最后活动时间
  localStorage.setItem(AUTH_TIMESTAMP_KEY, now.toString());
  return true;
}

function showLogin() {
  document.getElementById("admin-app")!.innerHTML = `
    <div class="admin-login-container">
      <div class="admin-login-card">
        <div class="admin-login-header">
          <div class="admin-login-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h1 class="admin-login-title">后台管理系统</h1>
          <p class="admin-login-subtitle">请输入管理员密码以继续</p>
        </div>
        <form class="admin-login-form" id="login-form">
          <div class="admin-form-group">
            <div class="admin-password-wrapper">
              <input type="password" class="admin-form-input admin-password-input" id="admin-password" placeholder="请输入密码" autocomplete="current-password" />
              <button type="button" class="admin-toggle-password" id="toggle-password">
                <svg class="eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            </div>
          </div>
          <button type="submit" class="admin-btn admin-btn-primary admin-btn-block">
            <span>登 录</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </form>
      </div>
      <div class="admin-login-footer">
        <p>Protected Area</p>
      </div>
    </div>
  `;

  document.getElementById("login-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("admin-password") as HTMLInputElement;
    const password = input.value;
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem(AUTH_KEY, "true");
      localStorage.setItem(AUTH_TIMESTAMP_KEY, Date.now().toString());
      init();
    } else {
      showToast("密码错误，请重试", "error");
      input.value = "";
      input.focus();
    }
  });

  document.getElementById("toggle-password")?.addEventListener("click", () => {
    const input = document.getElementById("admin-password") as HTMLInputElement;
    const btn = document.getElementById("toggle-password");
    if (input.type === "password") {
      input.type = "text";
      btn?.classList.add("active");
    } else {
      input.type = "password";
      btn?.classList.remove("active");
    }
  });
}

function logout() {
  localStorage.removeItem(AUTH_KEY);
  showLogin();
}

async function loadSiteData() {
  // 优先从 localStorage 加载（后台修改的数据）
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // 验证数据有效性
      if (parsed && parsed.brand && parsed.hero) {
        siteData = parsed;
        console.log("从 localStorage 加载成功");
        return;
      } else {
        console.warn("localStorage 数据无效，重新加载");
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  } catch (e) {
    console.warn("localStorage 加载失败:", e);
    localStorage.removeItem(STORAGE_KEY);
  }

  // 从 Supabase 加载
  try {
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data, error } = await client
      .from("homepage")
      .select("content")
      .eq("slug", "main")
      .single();
    
    if (data && !error && data.content && data.content.brand) {
      siteData = data.content as SiteData;
      console.log("从 Supabase 加载成功");
      // 同步到 localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(siteData));
      return;
    }
  } catch (e) {
    console.warn("Supabase 加载失败:", e);
  }
  
  // 从本地文件加载
  try {
    const baseUrl = window.location.pathname.includes("/uiweb/") ? "/uiweb/" : "/";
    const response = await fetch(`${baseUrl}data/site.json`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    siteData = await response.json();
    console.log("从本地文件加载成功");
    // 同步到 localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(siteData));
    return;
  } catch (error) {
    console.error("从本地文件加载失败:", error);
  }
  
  // 最后尝试相对路径
  try {
    const response = await fetch("data/site.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    siteData = await response.json();
    console.log("从相对路径加载成功");
    localStorage.setItem(STORAGE_KEY, JSON.stringify(siteData));
    return;
  } catch (error) {
    console.error("所有数据源加载失败，使用默认数据:", error);
    showToast("加载数据失败，使用默认数据", "error");
  }
}

async function saveSiteData() {
  if (!siteData) return;
  
  collectFormData();
  
  // 保存到 localStorage（主要存储方式）
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(siteData));
    console.log("已保存到 localStorage");
    showToast("保存成功！", "success");
  } catch (e) {
    console.error("localStorage 保存失败:", e);
    showToast("保存失败", "error");
    return;
  }
  
  // 后台尝试同步到 Supabase（不影响用户体验）
  try {
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // 同步 homepage 数据
    const { error: homepageError } = await client
      .from("homepage")
      .upsert({ slug: "main", content: siteData, is_active: true }, { onConflict: "slug" });
    
    if (homepageError) {
      console.warn("Supabase homepage 同步失败:", homepageError.message);
    } else {
      console.log("已同步 homepage 到 Supabase");
    }
    
    // 同步 works 数据到 projects 表
    if (siteData.works && siteData.works.length > 0) {
      console.log("开始同步 works 到 projects，共", siteData.works.length, "个作品");
      
      // 先删除旧的 projects 数据
      const { error: deleteError } = await client.from("projects").delete().neq("id", 0);
      if (deleteError) {
        console.warn("删除旧 projects 失败:", deleteError.message);
      }
      
      // 将 works 转换为 projects 格式
      const projectsData = siteData.works.map((work, index) => {
        const visual = work.visual as Record<string, unknown> || {};
        const coverUrl = String(visual.coverUrl || "");
        const coverAlt = String(visual.coverAlt || work.title || "");
        
        console.log(`作品 ${index + 1}:`, {
          slug: work.slug,
          title: work.title,
          coverUrl,
          coverAlt,
          visualKeys: Object.keys(visual),
        });
        
        return {
          slug: work.slug || `work-${index + 1}`,
          title: work.title || "未命名作品",
          category: "作品案例",
          summary: work.meta || "",
          layout_variant: String(visual.variant || "image"),
          cover_image_path: null,
          cover_image_url: coverUrl,
          cover_image_alt: coverAlt,
          detail_image_path: null,
          detail_image_url: null,
          detail_image_alt: null,
          detail_paragraphs: [],
          sort_order: index,
          published: true,
        };
      });
      
      console.log("准备插入 projects 数据:", JSON.stringify(projectsData, null, 2));
      
      // 批量插入 projects
      const { error: projectsError, data: insertedData } = await client
        .from("projects")
        .insert(projectsData)
        .select();
      
      if (projectsError) {
        console.error("Supabase projects 同步失败:", projectsError.message, projectsError.details);
      } else {
        console.log("已同步 works 到 Supabase projects，插入", insertedData?.length || 0, "条记录");
      }
    } else {
      console.log("没有 works 数据，跳过 projects 同步");
    }
  } catch (error) {
    console.warn("Supabase 同步失败:", error);
  }
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
        <div class="brand-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        <div>
          <div class="brand-text">后台管理系统</div>
          <div class="brand-sub">Content Management</div>
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
          <div class="admin-nav-group-title">客户线索</div>
          <button class="admin-nav-item ${currentSection === "leads" ? "active" : ""}" data-section="leads">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            客户信息
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
    leads: "客户信息",
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
        ${currentSection !== "leads" ? `
        <button class="admin-btn admin-btn-primary" id="btn-save-data">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          保存更改
        </button>
        ` : ""}
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

function renderLeads(leads: Array<{ id: string; phone: string; source: string; page_url: string; created_at: string }> = []) {
  const leadsList = leads.length > 0 
    ? leads.map((lead) => `
      <div class="admin-list-item">
        <div class="admin-list-item-content">
          <div class="admin-list-item-title">${escapeHtml(lead.phone)}</div>
          <div class="admin-list-item-desc">来源：${escapeHtml(lead.source)} | ${new Date(lead.created_at).toLocaleString("zh-CN")}</div>
        </div>
        <div class="admin-list-item-actions">
          <button class="admin-btn admin-btn-danger admin-btn-sm" data-delete-lead="${lead.id}">删除</button>
        </div>
      </div>
    `).join("")
    : `<div class="admin-empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        <p>暂无客户信息</p>
        <p class="admin-empty-state-desc">当访客在前台提交联系方式后，会显示在这里</p>
      </div>`;

  return `
    <div class="admin-content">
      <div class="admin-card">
        <div class="admin-card-title">
          客户提交信息
          <span class="admin-card-badge">${leads.length}</span>
        </div>
        <div id="leads-list">${leadsList}</div>
      </div>
    </div>
  `;
}

async function loadLeadsData() {
  console.log("开始加载客户信息...");
  console.log("SUPABASE_URL:", SUPABASE_URL);
  console.log("SUPABASE_ANON_KEY:", SUPABASE_ANON_KEY ? "已配置" : "未配置");
  
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("Supabase 配置缺失，无法加载客户信息");
    return [];
  }
  
  try {
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data, error } = await client
      .from("lead_submissions")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("从 Supabase 读取客户信息失败:", error);
      return [];
    }
    
    console.log("成功加载客户信息:", data?.length || 0, "条");
    return data || [];
  } catch (e) {
    console.error("读取客户信息异常:", e);
    return [];
  }
}

async function renderContent() {
  switch (currentSection) {
    case "dashboard": return renderDashboard();
    case "site": return renderSiteSettings();
    case "navigation": return renderNavigation();
    case "works": return renderWorks();
    case "inspiration": return renderInspiration();
    case "leads": {
      const leads = await loadLeadsData();
      return renderLeads(leads);
    }
    case "hero": return renderHero();
    case "about": return renderAbout();
    case "services": return renderServices();
    case "contact": return renderContact();
    default: return renderDashboard();
  }
}

async function render() {
  const app = document.getElementById("admin-app");
  if (!app) return;
  const content = await renderContent();
  app.innerHTML = `
    <div class="admin-layout">
      ${renderSidebar()}
      <div class="admin-main">
        ${renderHeader()}
        ${content}
      </div>
    </div>
  `;
  bindEvents();
  
  if (currentSection === "leads") {
    document.querySelectorAll("[data-delete-lead]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const leadId = (btn as HTMLElement).dataset.deleteLead!;
        if (confirm("确定要删除这条客户信息吗？")) {
          try {
            const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            const { error } = await client
              .from("lead_submissions")
              .delete()
              .eq("id", leadId);
            
            if (error) {
              console.warn("删除客户信息失败:", error.message);
              showToast("删除失败", "error");
            } else {
              showToast("已删除", "success");
              await render();
            }
          } catch (e) {
            console.warn("删除客户信息异常:", e);
            showToast("删除失败", "error");
          }
        }
      });
    });
  }
}

function updateAuthTimestamp() {
  localStorage.setItem(AUTH_TIMESTAMP_KEY, Date.now().toString());
}

function bindEvents() {
  document.querySelectorAll(".admin-nav-item[data-section]").forEach(btn => {
    btn.addEventListener("click", async () => {
      currentSection = (btn as HTMLElement).dataset.section!;
      updateAuthTimestamp();
      await render();
    });
  });

  document.querySelectorAll("[data-goto]").forEach(btn => {
    btn.addEventListener("click", async () => {
      currentSection = (btn as HTMLElement).dataset.goto!;
      updateAuthTimestamp();
      await render();
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
      const baseUrl = window.location.pathname.includes("/uiweb/") ? "/uiweb/" : "/";
      window.open(baseUrl, "_blank");
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
    btn.addEventListener("click", async () => {
      const index = parseInt((btn as HTMLElement).dataset.deleteNav!);
      if (siteData && confirm("确定要删除这个导航链接吗？")) {
        siteData.navigation.splice(index, 1);
        saveSiteData();
        await render();
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
    btn.addEventListener("click", async () => {
      const index = parseInt((btn as HTMLElement).dataset.deleteWork!);
      if (siteData && confirm("确定要删除这个作品吗？")) {
        siteData.works.splice(index, 1);
        saveSiteData();
        await render();
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
    btn.addEventListener("click", async () => {
      const index = parseInt((btn as HTMLElement).dataset.deleteInspiration!);
      if (siteData && confirm("确定要删除这个灵感条目吗？")) {
        siteData.inspiration.items.splice(index, 1);
        saveSiteData();
        await render();
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
  modal.querySelector("#modal-nav-save")!.addEventListener("click", async () => {
    const label = (modal.querySelector("#modal-nav-label") as HTMLInputElement).value;
    const href = (modal.querySelector("#modal-nav-href") as HTMLInputElement).value;
    if (siteData) {
      if (isEdit) {
        siteData.navigation[index] = { label, href };
      } else {
        siteData.navigation.push({ label, href });
      }
      saveSiteData();
      await render();
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
  const visual = item.visual as Record<string, unknown> || {};
  const coverUrl = String(visual.coverUrl || "");
  const coverAlt = String(visual.coverAlt || "");
  const detailContent = (visual.detailContent as EditorOutput) || null;

  const modal = document.createElement("div");
  modal.className = "admin-modal-overlay";
  modal.innerHTML = `
    <div class="admin-modal admin-modal-large admin-modal-xl">
      <div class="admin-modal-header">
        <div class="admin-modal-title">${isEdit ? "编辑作品" : "添加作品"}</div>
        <button class="admin-modal-close">&times;</button>
      </div>
      <div class="admin-modal-body">
        <div class="admin-section-title">基本信息</div>
        <div class="admin-form-row">
          <div class="admin-form-group">
            <label class="admin-form-label">作品 ID</label>
            <input type="text" class="admin-form-input" id="modal-work-id" value="${escapeHtml(item.id)}">
          </div>
          <div class="admin-form-group">
            <label class="admin-form-label">Slug</label>
            <input type="text" class="admin-form-input" id="modal-work-slug" value="${escapeHtml(item.slug)}">
          </div>
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label">作品标题</label>
          <input type="text" class="admin-form-input" id="modal-work-title" value="${escapeHtml(item.title)}">
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label">作品描述 (meta)</label>
          <input type="text" class="admin-form-input" id="modal-work-meta" value="${escapeHtml(item.meta)}">
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label">链接地址</label>
          <input type="text" class="admin-form-input" id="modal-work-href" value="${escapeHtml(item.href)}">
        </div>

        <div class="admin-section-title">封面图片（列表页显示）</div>
        <div class="admin-form-group">
          <label class="admin-form-label">封面图片</label>
          <div style="display:flex;gap:8px;align-items:center;">
            <input type="file" id="modal-work-cover-file" accept="image/*" style="flex:1;">
            <button type="button" class="admin-btn admin-btn-secondary admin-btn-sm" id="btn-upload-cover">上传</button>
          </div>
          <input type="text" class="admin-form-input" id="modal-work-cover" value="${escapeHtml(coverUrl)}" placeholder="或输入图片URL" style="margin-top:8px;">
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label">封面图片描述 (alt)</label>
          <input type="text" class="admin-form-input" id="modal-work-cover-alt" value="${escapeHtml(coverAlt)}">
        </div>

        <div class="admin-section-title">详情页内容（富文本编辑器）</div>
        <div class="admin-form-group">
          <label class="admin-form-label">使用编辑器添加文字、图片、标题等（支持图文混排）</label>
          <div id="editor-container" style="border:1px solid var(--admin-border);border-radius:8px;min-height:300px;background:#fff;"></div>
        </div>
      </div>
      <div class="admin-modal-footer">
        <button class="admin-btn admin-btn-secondary" id="modal-work-cancel">取消</button>
        <button class="admin-btn admin-btn-primary" id="modal-work-save">保存</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // 封面图片上传功能
  const btnUploadCover = modal.querySelector("#btn-upload-cover") as HTMLButtonElement;
  const fileInputCover = modal.querySelector("#modal-work-cover-file") as HTMLInputElement;
  const coverInput = modal.querySelector("#modal-work-cover") as HTMLInputElement;
  
  if (btnUploadCover && fileInputCover && coverInput) {
    btnUploadCover.addEventListener("click", async () => {
      const file = fileInputCover.files?.[0];
      if (!file) {
        showToast("请先选择图片文件", "error");
        return;
      }
      
      btnUploadCover.textContent = "上传中...";
      btnUploadCover.disabled = true;
      
      try {
        const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        const fileName = `works/${Date.now()}_${file.name}`;
        
        const { error: uploadError } = await client.storage
          .from("site-assets")
          .upload(fileName, file);
        
        if (uploadError) throw uploadError;
        
        const { data } = client.storage
          .from("site-assets")
          .getPublicUrl(fileName);
        
        coverInput.value = data.publicUrl;
        showToast("封面图片上传成功！", "success");
      } catch (e: any) {
        console.error("封面图片上传失败:", e);
        showToast("封面图片上传失败: " + (e.message || "未知错误"), "error");
      } finally {
        btnUploadCover.textContent = "上传";
        btnUploadCover.disabled = false;
      }
    });
  }

  // 初始化 Editor.js
  const uploadImageToSupabase = async (file: File): Promise<string> => {
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const ext = file.name.split(".").pop() || "png";
    const random = Math.random().toString(36).substring(2, 8);
    const fileName = `works/${Date.now()}_${random}.${ext}`;
    
    const { error: uploadError } = await client.storage
      .from("site-assets")
      .upload(fileName, file);
    
    if (uploadError) throw uploadError;
    
    const { data } = client.storage
      .from("site-assets")
      .getPublicUrl(fileName);
    
    return data.publicUrl;
  };

  createEditor("editor-container", detailContent || undefined, uploadImageToSupabase).catch(err => {
    console.error("编辑器初始化失败:", err);
  });

  modal.querySelector(".admin-modal-close")!.addEventListener("click", async () => {
    await destroyEditor();
    modal.remove();
  });
  modal.querySelector("#modal-work-cancel")!.addEventListener("click", async () => {
    await destroyEditor();
    modal.remove();
  });
  modal.querySelector("#modal-work-save")!.addEventListener("click", async () => {
    const id = (modal.querySelector("#modal-work-id") as HTMLInputElement).value;
    const slug = (modal.querySelector("#modal-work-slug") as HTMLInputElement).value;
    const title = (modal.querySelector("#modal-work-title") as HTMLInputElement).value;
    const meta = (modal.querySelector("#modal-work-meta") as HTMLInputElement).value;
    const href = (modal.querySelector("#modal-work-href") as HTMLInputElement).value;
    const coverUrl = (modal.querySelector("#modal-work-cover") as HTMLInputElement).value;
    const coverAlt = (modal.querySelector("#modal-work-cover-alt") as HTMLInputElement).value;
    
    const editorData = await getEditorData();
    
    if (siteData) {
      const workData = {
        id,
        slug,
        title,
        meta,
        href,
        visual: { 
          coverUrl, 
          coverAlt,
          detailContent: editorData,
        },
      };
      if (isEdit) {
        siteData.works[index] = workData;
      } else {
        siteData.works.push(workData);
      }
      await destroyEditor();
      saveSiteData();
      await render();
    }
    modal.remove();
  });

  modal.addEventListener("click", async (e) => {
    if (e.target === modal) {
      await destroyEditor();
      modal.remove();
    }
  });
}

function showInspirationModal(index: number) {
  const isEdit = index >= 0;
  const item = isEdit && siteData ? siteData.inspiration.items[index] : { slug: "", title: "", description: "", body: [], detailContent: null, ctaLabel: "立即前往", ctaHref: "https://example.com" };
  const detailContent = (item as { detailContent?: EditorOutput | null }).detailContent || null;

  const modal = document.createElement("div");
  modal.className = "admin-modal-overlay";
  modal.innerHTML = `
    <div class="admin-modal admin-modal-large admin-modal-xl">
      <div class="admin-modal-header">
        <div class="admin-modal-title">${isEdit ? "编辑灵感条目" : "添加灵感条目"}</div>
        <button class="admin-modal-close">&times;</button>
      </div>
      <div class="admin-modal-body">
        <div class="admin-section-title">基本信息</div>
        <div class="admin-form-row">
          <div class="admin-form-group">
            <label class="admin-form-label">标题</label>
            <input type="text" class="admin-form-input" id="modal-insp-title" value="${escapeHtml(item.title)}">
          </div>
          <div class="admin-form-group">
            <label class="admin-form-label">Slug（自动生成，可手动修改）</label>
            <input type="text" class="admin-form-input" id="modal-insp-slug" value="${escapeHtml(item.slug)}" placeholder="输入标题后自动生成">
          </div>
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label">描述（自动取正文第一段，也可手动修改）</label>
          <textarea class="admin-form-textarea" id="modal-insp-desc">${escapeHtml(item.description)}</textarea>
        </div>

        <div class="admin-section-title">详情内容（富文本编辑器）</div>
        <div class="admin-form-group">
          <label class="admin-form-label">使用编辑器添加文字、图片、标题等（支持图文混排）</label>
          <div id="editor-container" style="border:1px solid var(--admin-border);border-radius:8px;min-height:300px;background:#fff;"></div>
        </div>

        <div class="admin-section-title">跳转按钮</div>
        <div class="admin-form-row">
          <div class="admin-form-group">
            <label class="admin-form-label">按钮文字</label>
            <input type="text" class="admin-form-input" id="modal-insp-cta-label" value="${escapeHtml(item.ctaLabel || "")}">
          </div>
          <div class="admin-form-group">
            <label class="admin-form-label">按钮链接</label>
            <input type="text" class="admin-form-input" id="modal-insp-cta-href" value="${escapeHtml(item.ctaHref || "")}">
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

  const titleInput = modal.querySelector("#modal-insp-title") as HTMLInputElement;
  const slugInput = modal.querySelector("#modal-insp-slug") as HTMLInputElement;
  const descTextarea = modal.querySelector("#modal-insp-desc") as HTMLTextAreaElement;

  titleInput.addEventListener("input", () => {
    const title = titleInput.value.trim();
    if (title && (!isEdit || slugInput.value === "")) {
      slugInput.value = slugify(title, "inspiration");
    }
  });

  const uploadImageToSupabase = async (file: File): Promise<string> => {
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const ext = file.name.split(".").pop() || "png";
    const random = Math.random().toString(36).substring(2, 8);
    const fileName = `works/${Date.now()}_${random}.${ext}`;

    const { error: uploadError } = await client.storage
      .from("site-assets")
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = client.storage
      .from("site-assets")
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  createEditor("editor-container", detailContent || undefined, uploadImageToSupabase).catch(err => {
    console.error("编辑器初始化失败:", err);
  });

  modal.querySelector(".admin-modal-close")!.addEventListener("click", async () => {
    await destroyEditor();
    modal.remove();
  });
  modal.querySelector("#modal-insp-cancel")!.addEventListener("click", async () => {
    await destroyEditor();
    modal.remove();
  });
  modal.querySelector("#modal-insp-save")!.addEventListener("click", async () => {
    const title = (modal.querySelector("#modal-insp-title") as HTMLInputElement).value;
    const slug = (modal.querySelector("#modal-insp-slug") as HTMLInputElement).value;
    const description = (modal.querySelector("#modal-insp-desc") as HTMLTextAreaElement).value;
    const ctaLabel = (modal.querySelector("#modal-insp-cta-label") as HTMLInputElement).value;
    const ctaHref = (modal.querySelector("#modal-insp-cta-href") as HTMLInputElement).value;

    const editorData = await getEditorData();
    const bodyTexts: string[] = [];
    if (editorData && editorData.blocks) {
      editorData.blocks.forEach((block) => {
        if (block.type === "paragraph" && block.data && block.data.text) {
          bodyTexts.push(String(block.data.text));
        }
      });
    }
    const finalDescription = description || (bodyTexts.length > 0 ? bodyTexts[0] : title);

    if (siteData) {
      const inspItem = { slug, title, description: finalDescription, body: bodyTexts, detailContent: editorData, ctaLabel, ctaHref };
      if (isEdit) {
        siteData.inspiration.items[index] = inspItem;
      } else {
        siteData.inspiration.items.push(inspItem);
      }
      await destroyEditor();
      saveSiteData();
      await render();
    }
    modal.remove();
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      destroyEditor().then(() => modal.remove());
    }
  });
}

function collectFormData() {
  if (!siteData) return;

  const getVal = (id: string) => {
    const el = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | null;
    return el?.value?.trim() || "";
  };

  // 只更新非空值，保留已有数据
  const setVal = (obj: any, key: string, value: string) => {
    if (value !== "") {
      obj[key] = value;
    }
  };

  setVal(siteData.meta, "title", getVal("site-meta-title"));
  setVal(siteData.meta, "description", getVal("site-meta-desc"));
  setVal(siteData.brand, "line1", getVal("site-brand-line1"));
  setVal(siteData.brand, "line2", getVal("site-brand-line2"));
  setVal(siteData.brand, "loaderLabel", getVal("site-brand-loader"));
  siteData.navigationTitle = getVal("site-nav-title") || siteData.navigationTitle;

  setVal(siteData.hero, "titleLine1", getVal("hero-title1"));
  setVal(siteData.hero, "titleLine2", getVal("hero-title2"));
  setVal(siteData.hero, "copy", getVal("hero-copy"));
  setVal(siteData.hero, "ctaLabel", getVal("hero-cta"));
  
  const tickerVal = getVal("hero-ticker");
  if (tickerVal) {
    siteData.ticker = tickerVal.split("\n").filter(line => line.trim());
  }
  
  setVal(siteData.redBand, "title", getVal("redband-title"));
  setVal(siteData.redBand, "subtitle", getVal("redband-subtitle"));
  
  const capabilitiesVal = getVal("capabilities");
  if (capabilitiesVal) {
    siteData.capabilities = capabilitiesVal.split("\n").filter(line => line.trim());
  }
  
  setVal(siteData.worksSection, "title", getVal("works-section-title"));
  setVal(siteData.worksSection, "badge", getVal("works-section-badge"));

  setVal(siteData.about, "eyebrow", getVal("about-eyebrow"));
  setVal(siteData.about, "titleBefore", getVal("about-title-before"));
  setVal(siteData.about, "titleAccent", getVal("about-title-accent"));
  setVal(siteData.about, "titleAfter", getVal("about-title-after"));
  siteData.about.stats.forEach((stat, index) => {
    const value = getVal(`about-stat-value-${index}`);
    const title = getVal(`about-stat-title-${index}`);
    const desc = getVal(`about-stat-desc-${index}`);
    if (value) stat.value = value;
    if (title) stat.title = title;
    if (desc) stat.description = desc;
  });

  setVal(siteData.services, "eyebrow", getVal("services-eyebrow"));
  setVal(siteData.services, "title", getVal("services-title"));
  setVal(siteData.services, "description", getVal("services-desc"));
  siteData.services.items.forEach((item, index) => {
    const title = getVal(`service-title-${index}`);
    const desc = getVal(`service-desc-${index}`);
    if (title) item.title = title;
    if (desc) item.description = desc;
  });

  setVal(siteData.process, "eyebrow", getVal("process-eyebrow"));
  setVal(siteData.process, "title", getVal("process-title"));
  siteData.process.items.forEach((item, index) => {
    const title = getVal(`process-title-${index}`);
    const desc = getVal(`process-desc-${index}`);
    if (title) item.title = title;
    if (desc) item.description = desc;
  });

  setVal(siteData.inspiration, "eyebrow", getVal("insp-eyebrow"));
  setVal(siteData.inspiration, "titleLine1", getVal("insp-title1"));
  setVal(siteData.inspiration, "titleLine2", getVal("insp-title2"));
  setVal(siteData.inspiration, "description", getVal("insp-desc"));
  setVal(siteData.inspiration, "detailButtonLabel", getVal("insp-btn"));

  setVal(siteData.cta, "eyebrow", getVal("cta-eyebrow"));
  setVal(siteData.cta, "titleLine1", getVal("cta-title1"));
  setVal(siteData.cta, "titleLine2", getVal("cta-title2"));
  setVal(siteData.cta, "description", getVal("cta-desc"));
  setVal(siteData.cta, "buttonLabel", getVal("cta-btn"));

  setVal(siteData.contact, "intro", getVal("contact-intro"));
  setVal(siteData.contact, "placeholder", getVal("contact-placeholder"));
  setVal(siteData.contact, "buttonLabel", getVal("contact-btn"));
  setVal(siteData.contact, "feedback", getVal("contact-feedback"));

  setVal(siteData.footer, "brandDescription", getVal("footer-desc"));
  setVal(siteData.footer, "servicesTitle", getVal("footer-services-title"));
  setVal(siteData.footer, "contactTitle", getVal("footer-contact-title"));
  setVal(siteData.footer, "email", getVal("footer-email"));
  setVal(siteData.footer, "copyright", getVal("footer-copyright"));
  siteData.footer.servicesLinks.forEach((link, index) => {
    const label = getVal(`footer-service-label-${index}`);
    const href = getVal(`footer-service-href-${index}`);
    if (label) link.label = label;
    if (href) link.href = href;
  });
  siteData.footer.contactLinks.forEach((link, index) => {
    const label = getVal(`footer-contact-label-${index}`);
    const href = getVal(`footer-contact-href-${index}`);
    if (label) link.label = label;
    if (href) link.href = href;
  });

  setVal(siteData.leadModal, "title", getVal("lead-modal-title"));
  setVal(siteData.leadModal, "description", getVal("lead-modal-desc"));
  setVal(siteData.leadModal, "inputPlaceholder", getVal("lead-modal-placeholder"));
  setVal(siteData.leadModal, "submitLabel", getVal("lead-modal-submit"));
}

async function initSupabaseData() {
  // 检查 Supabase 是否已有数据
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error } = await client
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
    
    const { error: insertError } = await client
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
  await render();
}

init();