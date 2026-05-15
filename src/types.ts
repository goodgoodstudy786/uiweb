export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export interface NavigationLink {
  label: string;
  href: string;
}

export interface ContentBlock {
  step: string;
  title: string;
  description: string;
}

export interface StatBlock {
  value: string;
  title: string;
  description: string;
}

export interface InspirationItem {
  slug: string;
  title: string;
  description: string;
  body: string[];
  icon?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export interface HomepageContent {
  meta: {
    title: string;
    description: string;
  };
  brand: {
    line1: string;
    line2: string;
    loaderLabel: string;
  };
  navigationTitle: string;
  worksSection: {
    title: string;
    badge: string;
    pageHref?: string;
  };
  navigation: NavigationLink[];
  hero: {
    titleLine1: string;
    titleLine2: string;
    copy: string;
    ctaLabel: string;
    ctaHref?: string;
  };
  ticker: string[];
  redBand: {
    title: string;
    subtitle: string;
  };
  capabilities: string[];
  about: {
    eyebrow: string;
    titleBefore: string;
    titleAccent: string;
    titleAfter: string;
    stats: StatBlock[];
  };
  services: {
    eyebrow: string;
    title: string;
    description: string;
    items: ContentBlock[];
  };
  process: {
    eyebrow: string;
    title: string;
    items: ContentBlock[];
  };
  inspiration: {
    eyebrow: string;
    titleLine1: string;
    titleLine2: string;
    description: string;
    pageHref?: string;
    detailButtonLabel?: string;
    items: InspirationItem[];
  };
  cta: {
    eyebrow: string;
    titleLine1: string;
    titleLine2: string;
    description: string;
    buttonLabel: string;
    buttonHref?: string;
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
    copyright: string;
    email: string;
  };
  leadModal: {
    title: string;
    description: string;
    inputPlaceholder: string;
    submitLabel: string;
  };
}

export interface ProjectRow {
  slug: string;
  title: string;
  category: string;
  summary: string;
  layout_variant: string;
  cover_image_path: string | null;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  detail_image_path: string | null;
  detail_image_url: string | null;
  detail_image_alt: string | null;
  detail_paragraphs: string[];
  sort_order: number;
  published: boolean;
}

export interface SocialLinkRow {
  label: string;
  url: string;
  platform: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface LeadSubmissionInput {
  phone: string;
  source: string;
  pageUrl: string;
}

export interface HomeSiteData {
  homepage: HomepageContent;
  projects: ProjectRow[];
  socialLinks: SocialLinkRow[];
}
