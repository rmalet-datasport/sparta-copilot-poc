'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

export interface CampaignAsset {
  channel: string;
  subject?: string;
  title?: string;
  body?: string;
  caption?: string;
  hashtags?: string;
  meta?: string;
}

export interface SavedAsset {
  id: string;
  gate: string;
  gateLabel: string;
  segmentId: string;
  segmentName: string;
  segmentColor: string;
  segmentColorBg: string;
  channel: string;
  asset: CampaignAsset;
  imageUrl?: string;
  savedAt: number;
}

interface ContextValue {
  savedAssets: SavedAsset[];
  saveAsset: (a: Omit<SavedAsset, 'id' | 'savedAt'>) => void;
}

const CampaignHistoryContext = createContext<ContextValue | null>(null);

export function CampaignHistoryProvider({ children }: { children: ReactNode }) {
  const [savedAssets, setSavedAssets] = useState<SavedAsset[]>([]);

  const saveAsset = (a: Omit<SavedAsset, 'id' | 'savedAt'>) => {
    setSavedAssets(prev => [
      { ...a, id: `asset_${prev.length}_${Math.random().toString(36).slice(2, 6)}`, savedAt: Date.now() },
      ...prev,
    ]);
  };

  return (
    <CampaignHistoryContext.Provider value={{ savedAssets, saveAsset }}>
      {children}
    </CampaignHistoryContext.Provider>
  );
}

export function useCampaignHistory() {
  const ctx = useContext(CampaignHistoryContext);
  if (!ctx) throw new Error('useCampaignHistory must be inside CampaignHistoryProvider');
  return ctx;
}
