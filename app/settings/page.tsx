import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SettingsView from '@/components/SettingsView';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return <SettingsView profile={profile} userId={user.id} email={user.email ?? ''} />;
}
