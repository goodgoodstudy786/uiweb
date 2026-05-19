import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ysnyczhchuhgwlildivu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_J89PNRCCJZL3gzIlxD-1bw__aqbaJei';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testProjects() {
  console.log('检查 projects 表数据...\n');
  
  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .order('sort_order', { ascending: true });
  
  if (error) {
    console.error('❌ 查询失败:', error.message);
    return;
  }
  
  console.log(`找到 ${projects.length} 个作品:\n`);
  
  projects.forEach((p, i) => {
    console.log(`作品 ${i + 1}:`);
    console.log(`  slug: ${p.slug}`);
    console.log(`  title: ${p.title}`);
    console.log(`  summary: ${p.summary}`);
    console.log(`  cover_image_url: ${p.cover_image_url || '(空)'}`);
    console.log(`  cover_image_alt: ${p.cover_image_alt || '(空)'}`);
    console.log(`  published: ${p.published}`);
    console.log('');
  });
}

testProjects();
