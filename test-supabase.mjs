import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ysnyczhchuhgwlildivu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_J89PNRCCJZL3gzIlxD-1bw__aqbaJei';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testSupabase() {
  console.log('Testing Supabase connection...');
  
  // Test 1: Insert a lead
  console.log('\n1. Testing INSERT...');
  const { data: insertData, error: insertError } = await supabase
    .from('lead_submissions')
    .insert({
      phone: '13800138000',
      source: '测试提交',
      page_url: 'http://localhost:8787/'
    })
    .select();
  
  if (insertError) {
    console.error('INSERT failed:', insertError.message);
  } else {
    console.log('INSERT successful:', insertData);
  }
  
  // Test 2: Select leads
  console.log('\n2. Testing SELECT...');
  const { data: selectData, error: selectError } = await supabase
    .from('lead_submissions')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (selectError) {
    console.error('SELECT failed:', selectError.message);
  } else {
    console.log('SELECT successful, found', selectData?.length || 0, 'leads');
    console.log('Leads:', selectData);
  }
  
  // Test 3: Delete a lead (if we have one)
  if (insertData && insertData.length > 0) {
    console.log('\n3. Testing DELETE...');
    const { error: deleteError } = await supabase
      .from('lead_submissions')
      .delete()
      .eq('id', insertData[0].id);
    
    if (deleteError) {
      console.error('DELETE failed:', deleteError.message);
    } else {
      console.log('DELETE successful');
    }
  }
}

testSupabase().catch(console.error);
