import React, { createContext, useContext } from 'react';
import { siteConfig } from '@/config/toolsConfig';

interface SiteContextValue {
  /** Webhook to send submissions to for the current scope (user-owned or default). */
  activeWebhookUrl: string;
  /** Username owning the current scope, if any. */
  ownerUsername?: string;
  /** Path prefix to prepend to in-app links (e.g. "/alice" or ""). */
  basePath: string;
}

const SiteContext = createContext<SiteContextValue>({
  activeWebhookUrl: siteConfig.webhookUrl,
  basePath: '',
});

export const SiteProvider: React.FC<{ value: SiteContextValue; children: React.ReactNode }> = ({ value, children }) => (
  <SiteContext.Provider value={value}>{children}</SiteContext.Provider>
);

export const useSite = () => useContext(SiteContext);
