import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import type { DashboardProfile } from './DashboardLayout';

const SubdomainPage = () => {
  const { profile, setProfile } = useOutletContext<{
    profile: DashboardProfile;
    setProfile: (p: DashboardProfile) => void;
  }>();
  const [newUsername, setNewUsername] = useState(profile.username);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = newUsername.trim().toLowerCase();
    if (target === profile.username) {
      toast.info('No change.');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ username: target }).eq('id', profile.id);
    if (error) toast.error(error.message);
    else {
      toast.success('Subdomain updated.');
      setProfile({ ...profile, username: target });
    }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSave} className="blox-card p-6">
      <h2 className="text-lg font-semibold mb-2">Change subdomain</h2>
      <p className="text-gray-400 text-sm mb-4">3–30 characters: lowercase letters, numbers, hyphens, underscores. The old URL will stop working immediately.</p>
      <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value.toLowerCase())} pattern="[a-z0-9_-]{3,30}" required className="w-full bg-black/30 border border-white/10 rounded-md p-3 text-white focus:outline-none focus:border-blox-teal mb-4" />
      <button type="submit" disabled={saving} className="bg-blox-teal text-white py-2 px-6 rounded-md font-medium hover:bg-blox-teal/90 transition-all flex items-center gap-2">
        {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save subdomain
      </button>
    </form>
  );
};

export default SubdomainPage;
