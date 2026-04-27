import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import type { DashboardProfile } from './DashboardLayout';

const SiteUrlPage = () => {
  const { profile } = useOutletContext<{ profile: DashboardProfile }>();
  const siteUrl = `${window.location.origin}/${profile.username}`;
  return (
    <div className="blox-card p-6">
      <h2 className="text-lg font-semibold mb-2">Your site URL</h2>
      <p className="text-gray-400 text-sm mb-3">Share this link to use your version of the site.</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 bg-black/40 border border-white/10 rounded-md p-3 text-blox-teal break-all">{siteUrl}</code>
        <button
          onClick={() => {
            navigator.clipboard.writeText(siteUrl);
            toast.success('Copied!');
          }}
          className="p-3 bg-blox-teal/20 hover:bg-blox-teal/30 rounded-md transition-all"
          aria-label="Copy URL"
        >
          <Copy size={18} />
        </button>
      </div>
    </div>
  );
};

export default SiteUrlPage;
