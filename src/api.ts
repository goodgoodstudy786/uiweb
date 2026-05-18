import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import fallbackFixture from "../data/site.json";
import type {
  HomeSiteData,
  HomepageContent,
  LeadSubmissionInput,
  ProjectRow,
  SocialLinkRow,
} from "./types";

type SupabaseHomepageRow = {
  slug: string;
  content: Partial<HomepageContent> | Record<string, unknown>;
  is_active?: boolean;
};

type SupabaseProjectRow = {
  slug: string;
  title: string;
  category: string;
  summary: string;
  layout_variant?: string;
  cover_image_path?: string | null;
  cover_image_url?: string | null;
  cover_image_alt?: string | null;
  detail_image_path?: string | null;
  detail_image_url?: string | null;
  detail_image_alt?: string | null;
  detail_paragraphs?: string[] | null;
  sort_order?: number | null;
  published?: boolean | null;
};

type SupabaseSocialLinkRow = {
  label: string;
  url: string;
  platform: string;
  icon?: string | null;
  sort_order?: number | null;
  is_active?: boolean | null;
};

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.trim() || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || "";
const SUPABASE_BUCKET = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET?.trim() || "site-assets";

const HAS_SUPABASE = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

let supabaseClient: SupabaseClient | null = null;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function mergeDeep<T>(base: T, override: unknown): T {
  if (!isPlainObject(base) || !isPlainObject(override)) {
    if (Array.isArray(override)) {
      return override as T;
    }
    return (override ?? base) as T;
  }

  const output: Record<string, unknown> = { ...base };

  for (const [key, value] of Object.entries(override)) {
    const current = output[key];

    if (Array.isArray(value)) {
      output[key] = value;
      continue;
    }

    if (isPlainObject(current) && isPlainObject(value)) {
      output[key] = mergeDeep(current, value);
      continue;
    }

    output[key] = value ?? current;
  }

  return output as T;
}

function slugify(value: string, fallback: string) {
  const slug = value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || fallback;
}

function toStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }

  return [];
}

function buildFallbackInspirationBody(title: string, description: string) {
  const intro = description || `${title} 可以先作为下一次项目里的观察起点。`;
  const followUp = "把这类观察继续沉淀成页面结构、组件状态或内容节奏时，会更容易落到实际设计里。";

  return intro === followUp ? [intro] : [intro, followUp];
}

function normalizeInspirationItems(items: unknown): InspirationItem[] {
  const source = Array.isArray(items) ? items : [];
  const usedSlugs = new Set<string>();

  return source.map((rawItem, index) => {
    const item = isPlainObject(rawItem) ? rawItem : {};
    const title = String(item.title || `灵感 ${index + 1}`);
    const description = String(item.description || title);
    let slug = String(item.slug || item.id || slugify(title, `inspiration-${index + 1}`));

    if (usedSlugs.has(slug)) {
      slug = `${slug}-${index + 1}`;
    }

    usedSlugs.add(slug);

    const body = toStringArray((item as { body?: unknown }).body);
    const ctaHref = typeof item.ctaHref === "string" && item.ctaHref.trim() ? item.ctaHref.trim() : "";
    const ctaLabel = typeof item.ctaLabel === "string" && item.ctaLabel.trim() ? item.ctaLabel.trim() : "";

    return {
      slug,
      title,
      description,
      body: body.length ? body : buildFallbackInspirationBody(title, description),
      icon: typeof item.icon === "string" && item.icon.trim() ? item.icon.trim() : undefined,
      ctaHref: ctaHref || undefined,
      ctaLabel: ctaLabel || undefined,
    };
  });
}

function normalizeHref(href: string | undefined, fallback = "/") {
  if (!href) {
    return fallback;
  }

  if (href === "#") {
    return href;
  }

  if (href === "#inspiration") {
    return "inspiration.html";
  }

  if (href.startsWith("./")) {
    return href.slice(2);
  }

  if (href.startsWith("#")) {
    if (href === "#top") {
      return "/";
    }

    return href;
  }

  // 移除开头的 / 使其成为相对路径，适配 GitHub Pages
  if (href.startsWith("/")) {
    return href.slice(1);
  }

  return href;
}

function getSupabaseClient() {
  if (!HAS_SUPABASE) {
    return null;
  }

  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  return supabaseClient;
}

function resolveStorageUrl(pathOrUrl: string | null | undefined) {
  if (!pathOrUrl) {
    return null;
  }

  if (/^(https?:)?\/\//.test(pathOrUrl) || pathOrUrl.startsWith("data:") || pathOrUrl.startsWith("blob:")) {
    return pathOrUrl;
  }

  const client = getSupabaseClient();
  if (!client) {
    return null;
  }

  return client.storage.from(SUPABASE_BUCKET).getPublicUrl(pathOrUrl).data.publicUrl;
}

function normalizeHomepageContent(raw: unknown): HomepageContent {
  const fixture = buildFallbackHomepage();
  const merged = mergeDeep(fixture, raw);

  merged.navigation = (merged.navigation || []).map((link) => ({
    ...link,
    href: normalizeHref(link.href, "/"),
  }));

  merged.worksSection.pageHref = normalizeHref(merged.worksSection.pageHref, "/#works");
  merged.hero.ctaHref = normalizeHref(merged.hero.ctaHref, "/#works");
  merged.inspiration.pageHref = normalizeHref(merged.inspiration.pageHref, "/inspiration.html");
  merged.inspiration.detailButtonLabel = String(merged.inspiration.detailButtonLabel || "立即前往");
  merged.inspiration.items = normalizeInspirationItems(merged.inspiration.items);
  merged.cta.buttonHref = normalizeHref(merged.cta.buttonHref, "/#works");
  merged.footer.servicesLinks = (merged.footer.servicesLinks || []).map((link) => ({
    ...link,
    href: normalizeHref(link.href, "/"),
  }));

  return merged;
}

function normalizeProjectRow(row: SupabaseProjectRow): ProjectRow {
  const coverUrl = resolveStorageUrl(row.cover_image_path ?? row.cover_image_url ?? null);
  const detailUrl = resolveStorageUrl(row.detail_image_path ?? row.detail_image_url ?? null);

  return {
    slug: row.slug,
    title: row.title,
    category: row.category,
    summary: row.summary,
    layout_variant: row.layout_variant || "image",
    cover_image_path: row.cover_image_path ?? null,
    cover_image_url: coverUrl,
    cover_image_alt: row.cover_image_alt ?? row.title,
    detail_image_path: row.detail_image_path ?? null,
    detail_image_url: detailUrl,
    detail_image_alt: row.detail_image_alt ?? row.title,
    detail_paragraphs: Array.isArray(row.detail_paragraphs) ? row.detail_paragraphs : [],
    sort_order: Number(row.sort_order ?? 0),
    published: Boolean(row.published ?? true),
  };
}

function normalizeSocialLinkRow(row: SupabaseSocialLinkRow): SocialLinkRow {
  return {
    label: row.label,
    url: row.url,
    platform: row.platform,
    icon: row.icon ?? null,
    sort_order: Number(row.sort_order ?? 0),
    is_active: Boolean(row.is_active ?? true),
  };
}

function buildFallbackHomepage(): HomepageContent {
  const fixture = fallbackFixture as unknown as Record<string, unknown>;

  return {
    meta: fixture.meta as HomepageContent["meta"],
    brand: fixture.brand as HomepageContent["brand"],
    navigationTitle: String(fixture.navigationTitle || "导航"),
    worksSection: {
      ...(fixture.worksSection as HomepageContent["worksSection"]),
      pageHref: "/#works",
    },
    navigation: (fixture.navigation as HomepageContent["navigation"]).map((link) => ({
      ...link,
      href: normalizeHref(link.href, "/"),
    })),
    hero: {
      ...(fixture.hero as HomepageContent["hero"]),
      ctaHref: "/#works",
    },
    ticker: Array.isArray(fixture.ticker) ? (fixture.ticker as string[]) : [],
    redBand: fixture.redBand as HomepageContent["redBand"],
    capabilities: Array.isArray(fixture.capabilities) ? (fixture.capabilities as string[]) : [],
    about: fixture.about as HomepageContent["about"],
    services: fixture.services as HomepageContent["services"],
    process: fixture.process as HomepageContent["process"],
    inspiration: {
      ...(fixture.inspiration as HomepageContent["inspiration"]),
      pageHref: "/inspiration.html",
      detailButtonLabel: "立即前往",
      items: normalizeInspirationItems((fixture.inspiration as HomepageContent["inspiration"]).items),
    },
    cta: {
      ...(fixture.cta as HomepageContent["cta"]),
      buttonHref: "/#works",
    },
    contact: fixture.contact as HomepageContent["contact"],
    footer: {
      ...(fixture.footer as HomepageContent["footer"]),
      servicesLinks: Array.isArray((fixture.footer as HomepageContent["footer"]).servicesLinks)
        ? (fixture.footer as HomepageContent["footer"]).servicesLinks.map((link) => ({
            ...link,
            href: normalizeHref(link.href, "/"),
          }))
        : [],
    },
    leadModal: fixture.leadModal as HomepageContent["leadModal"],
  };
}

function buildFallbackProjects(): ProjectRow[] {
  const cases = Array.isArray((fallbackFixture as { cases?: Array<Record<string, unknown>> }).cases)
    ? ((fallbackFixture as { cases?: Array<Record<string, unknown>> }).cases as Array<Record<string, unknown>>)
    : [];

  return cases.map((item, index) => {
    const detailParagraphs = Array.isArray(item.summary) ? item.summary.map((entry) => String(entry)) : [];

    return {
      slug: String(item.slug || item.id || `project-${index + 1}`),
      title: String(item.title || "未命名项目"),
      category: String(item.type || "项目案例"),
      summary: detailParagraphs[0] || String(item.title || ""),
      layout_variant: String(item.visual?.variant || "image"),
      cover_image_path: null,
      cover_image_url: null,
      cover_image_alt: String(item.title || "项目封面"),
      detail_image_path: null,
      detail_image_url: null,
      detail_image_alt: String(item.title || "项目详情"),
      detail_paragraphs: detailParagraphs,
      sort_order: index,
      published: true,
    };
  });
}

function buildFallbackSocialLinks(): SocialLinkRow[] {
  const footer = fallbackFixture.footer as HomepageContent["footer"];
  const socialLinks = Array.isArray((footer as { contactLinks?: NavigationLink[] }).contactLinks)
    ? ((footer as { contactLinks?: NavigationLink[] }).contactLinks as NavigationLink[])
    : [];

  return socialLinks.map((link, index) => ({
    label: link.label,
    url: normalizeHref(link.href, link.href || "#"),
    platform: link.label.toLowerCase(),
    icon: null,
    sort_order: index,
    is_active: true,
  }));
}

async function loadSupabaseSiteData(): Promise<HomeSiteData> {
  const client = getSupabaseClient();
  if (!client) {
    return loadFallbackSiteData();
  }

  const [homepageResponse, projectsResponse, socialResponse] = await Promise.all([
    client.from("homepage").select("slug, content, is_active").eq("slug", "main").maybeSingle<SupabaseHomepageRow>(),
    client
      .from("projects")
      .select(
        "slug, title, category, summary, layout_variant, cover_image_path, cover_image_url, cover_image_alt, detail_image_path, detail_image_url, detail_image_alt, detail_paragraphs, sort_order, published",
      )
      .eq("published", true)
      .order("sort_order", { ascending: true }),
    client
      .from("social_links")
      .select("label, url, platform, icon, sort_order, is_active")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
  ]);

  const homepageContent = normalizeHomepageContent(homepageResponse.data?.content ?? null);
  const fallback = loadFallbackSiteDataSync();

  return {
    homepage: mergeDeep(fallback.homepage, homepageContent),
    projects:
      projectsResponse.data?.length
        ? (projectsResponse.data as SupabaseProjectRow[]).map(normalizeProjectRow)
        : fallback.projects,
    socialLinks:
      socialResponse.data?.length
        ? (socialResponse.data as SupabaseSocialLinkRow[]).map(normalizeSocialLinkRow)
        : fallback.socialLinks,
  };
}

function loadFallbackSiteDataSync(): HomeSiteData {
  const stored = localStorage.getItem("site_data");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // 后台保存的数据是扁平的 HomepageContent 格式
      // 前端需要 HomeSiteData 格式，所以将扁平数据作为 homepage
      return {
        homepage: normalizeHomepageContent(parsed),
        projects: buildFallbackProjects(),
        socialLinks: buildFallbackSocialLinks(),
      };
    } catch (e) {
      console.error("Failed to parse stored site data:", e);
    }
  }
  return {
    homepage: normalizeHomepageContent(clone(fallbackFixture)),
    projects: buildFallbackProjects(),
    socialLinks: buildFallbackSocialLinks(),
  };
}

async function loadFallbackSiteData(): Promise<HomeSiteData> {
  return loadFallbackSiteDataSync();
}

export async function getSiteData(): Promise<HomeSiteData> {
  if (!HAS_SUPABASE) {
    return loadFallbackSiteData();
  }

  try {
    return await loadSupabaseSiteData();
  } catch (error) {
    console.warn("Supabase data load failed, falling back to local fixture.", error);
    return loadFallbackSiteData();
  }
}

function storeLeadDraft(input: LeadSubmissionInput) {
  try {
    const existing = JSON.parse(localStorage.getItem("uiweb:lead-drafts") || "[]") as LeadSubmissionInput[];
    const next = [...existing, input].slice(-20);
    localStorage.setItem("uiweb:lead-drafts", JSON.stringify(next));
  } catch (error) {
    console.warn("Unable to store local lead draft.", error);
  }
}

export async function submitLead(input: LeadSubmissionInput) {
  const client = getSupabaseClient();

  if (!client) {
    storeLeadDraft(input);
    return { mode: "local" as const };
  }

  const { error } = await client.from("lead_submissions").insert({
    phone: input.phone,
    source: input.source,
    page_url: input.pageUrl,
  });

  if (error) {
    throw error;
  }

  return { mode: "supabase" as const };
}

export function getProjectPathForImage(project: ProjectRow) {
  return project.cover_image_url || project.detail_image_url || null;
}
