import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://ysnyczhchuhgwlildivu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_J89PNRCCJZL3gzIlxD-1bw__aqbaJei';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testStorage() {
  console.log('测试 Supabase Storage 上传功能...\n');
  
  // 直接测试上传
  console.log('尝试上传测试文件到 site-assets bucket...');
  const testContent = 'test content ' + Date.now();
  const testFile = new Blob([testContent], { type: 'text/plain' });
  
  const fileName = `test/test-${Date.now()}.txt`;
  
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('site-assets')
    .upload(fileName, testFile, { upsert: true });
  
  if (uploadError) {
    console.error('❌ 上传失败:', uploadError.message);
    console.log('错误详情:', JSON.stringify(uploadError, null, 2));
    console.log('\n可能的原因：');
    console.log('1. Bucket 名称大小写不匹配（代码中是 site-assets，请检查 Supabase 中是否一致）');
    console.log('2. 上传权限策略未正确配置');
    return;
  }
  
  console.log('✅ 上传成功！');
  console.log('文件路径:', uploadData.path);
  
  // 获取公开 URL
  const { data: urlData } = supabase.storage
    .from('site-assets')
    .getPublicUrl(fileName);
  
  console.log('公开 URL:', urlData.publicUrl);
  
  // 测试 projects 表
  console.log('\n测试 projects 表...');
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('*')
    .limit(3);
  
  if (projectsError) {
    console.error('❌ 查询 projects 失败:', projectsError.message);
  } else {
    console.log('✅ projects 表数据:', projects);
  }
}

testStorage();
