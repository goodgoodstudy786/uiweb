import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ysnyczhchuhgwlildivu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_J89PNRCCJZL3gzIlxD-1bw__aqbaJei';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugAll() {
  console.log('=== 完整调试：后台作品图片显示问题 ===\n');
  
  // 1. 检查 homepage 表中的数据（包含 works）
  console.log('1. 检查 homepage 表中的 works 数据...');
  const { data: homepageData, error: homepageError } = await supabase
    .from('homepage')
    .select('slug, content')
    .eq('slug', 'main')
    .single();
  
  if (homepageError) {
    console.error('❌ 查询 homepage 失败:', homepageError.message);
  } else if (homepageData && homepageData.content) {
    const content = homepageData.content;
    const works = content.works || [];
    console.log(`找到 ${works.length} 个作品:`);
    
    works.forEach((work, i) => {
      console.log(`\n作品 ${i + 1}:`);
      console.log(`  slug: ${work.slug}`);
      console.log(`  title: ${work.title}`);
      console.log(`  visual.coverUrl: ${work.visual?.coverUrl || '(空)'}`);
      console.log(`  visual.coverAlt: ${work.visual?.coverAlt || '(空)'}`);
      console.log(`  visual.variant: ${work.visual?.variant || '(空)'}`);
    });
  } else {
    console.log('❌ homepage 表中没有数据');
  }
  
  // 2. 检查 projects 表中的数据
  console.log('\n\n2. 检查 projects 表中的数据...');
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('*')
    .order('sort_order', { ascending: true });
  
  if (projectsError) {
    console.error('❌ 查询 projects 失败:', projectsError.message);
  } else {
    console.log(`找到 ${projects.length} 个作品:`);
    
    projects.forEach((p, i) => {
      console.log(`\n作品 ${i + 1}:`);
      console.log(`  slug: ${p.slug}`);
      console.log(`  title: ${p.title}`);
      console.log(`  cover_image_url: ${p.cover_image_url || '(空)'}`);
      console.log(`  cover_image_alt: ${p.cover_image_alt || '(空)'}`);
      console.log(`  layout_variant: ${p.layout_variant || '(空)'}`);
    });
  }
  
  // 3. 检查 Storage bucket
  console.log('\n\n3. 检查 Storage bucket 中的文件...');
  const { data: files, error: filesError } = await supabase.storage
    .from('site-assets')
    .list('works', { limit: 10 });
  
  if (filesError) {
    console.error('❌ 查询 Storage 失败:', filesError.message);
  } else {
    console.log(`找到 ${files.length} 个文件:`);
    files.forEach(f => {
      console.log(`  - ${f.name} (${(f.metadata.size / 1024).toFixed(1)} KB)`);
      const { data: urlData } = supabase.storage
        .from('site-assets')
        .getPublicUrl(`works/${f.name}`);
      console.log(`    URL: ${urlData.publicUrl}`);
    });
  }
  
  console.log('\n=== 调试完成 ===');
}

debugAll();
