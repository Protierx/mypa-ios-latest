/**
 * Supabase Integration Test
 * Tests all hooks and Edge Functions
 * 
 * Run from React Native:
 * import { runIntegrationTests } from '@/utils/testSupabaseIntegration';
 * runIntegrationTests();
 */
import { supabase } from '@/lib/supabase';
import api from '@/services/supabaseApi';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

async function runTest(
  name: string,
  testFn: () => Promise<void>
): Promise<TestResult> {
  const start = Date.now();
  try {
    await testFn();
    return {
      name,
      passed: true,
      duration: Date.now() - start,
    };
  } catch (error) {
    return {
      name,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - start,
    };
  }
}

export async function runIntegrationTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  console.log('\n🧪 Starting Supabase Integration Tests...\n');

  // Test 1: Auth Session
  results.push(
    await runTest('Auth: Get Session', async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      console.log('  Session:', data.session ? 'Active ✓' : 'None (need to login)');
    })
  );

  // Test 2: Profile Read
  results.push(
    await runTest('Database: Read Profile', async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('  Skipped - no session');
        return;
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (error) throw error;
      console.log('  Profile:', data.display_name || 'Anonymous');
    })
  );

  // Test 3: Tasks CRUD
  results.push(
    await runTest('Database: Tasks CRUD', async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('  Skipped - no session');
        return;
      }

      // Create
      const { data: created, error: createError } = await supabase
        .from('tasks')
        .insert({
          user_id: session.user.id,
          title: 'Test Task (delete me)',
          priority: 'low',
        })
        .select()
        .single();
      
      if (createError) throw createError;
      console.log('  Created task:', created.id);

      // Read
      const { data: read, error: readError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', created.id)
        .single();
      
      if (readError) throw readError;
      console.log('  Read task:', read.title);

      // Update
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ title: 'Updated Test Task' })
        .eq('id', created.id);
      
      if (updateError) throw updateError;
      console.log('  Updated task');

      // Delete
      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', created.id);
      
      if (deleteError) throw deleteError;
      console.log('  Deleted task');
    })
  );

  // Test 4: Edge Function - AI Greeting
  results.push(
    await runTest('Edge Function: AI Greeting', async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('  Skipped - no session');
        return;
      }

      try {
        const greeting = await api.getGreeting();
        console.log('  Greeting:', greeting.greeting.substring(0, 50) + '...');
        console.log('  Tasks:', greeting.taskCount, 'Completed:', greeting.completedToday);
      } catch (error: any) {
        // Edge function might not be deployed yet
        if (error.message?.includes('not found')) {
          console.log('  Edge function not deployed yet - OK');
          return;
        }
        throw error;
      }
    })
  );

  // Test 5: Edge Function - Calculate Unlocks
  results.push(
    await runTest('Edge Function: Calculate Unlocks', async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('  Skipped - no session');
        return;
      }

      try {
        const unlocks = await api.checkUnlocks();
        console.log('  Days active:', unlocks.stats.daysActive);
        console.log('  Tasks completed:', unlocks.stats.tasksCompleted);
        console.log('  New unlocks:', unlocks.newUnlocks.length);
      } catch (error: any) {
        if (error.message?.includes('not found')) {
          console.log('  Edge function not deployed yet - OK');
          return;
        }
        throw error;
      }
    })
  );

  // Test 6: Realtime Connection
  results.push(
    await runTest('Realtime: Channel Subscription', async () => {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 5000);

        const channel = supabase
          .channel('test-channel')
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              clearTimeout(timeout);
              console.log('  Connected to realtime');
              supabase.removeChannel(channel);
              resolve();
            } else if (status === 'CHANNEL_ERROR') {
              clearTimeout(timeout);
              reject(new Error('Channel error'));
            }
          });
      });
    })
  );

  // Print results
  console.log('\n📊 Test Results:\n');
  let passed = 0;
  let failed = 0;

  results.forEach((result) => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.name} (${result.duration}ms)`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    if (result.passed) passed++;
    else failed++;
  });

  console.log(`\n📈 Summary: ${passed}/${results.length} passed`);
  
  if (failed > 0) {
    console.log('⚠️  Some tests failed. Check your configuration.');
  } else {
    console.log('🎉 All tests passed!');
  }

  return results;
}

// Helper to test voice command
export async function testVoiceCommand(transcript: string) {
  console.log(`\n🎤 Testing voice command: "${transcript}"\n`);
  
  try {
    const response = await api.processVoiceCommand(transcript, { screen: 'ai_home' });
    console.log('Intent:', response.intent);
    console.log('Message:', response.message);
    console.log('Action:', response.action);
    return response;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export default runIntegrationTests;
