import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ModuleKey, FeatureFlag } from '@/types';
import { featureFlagService } from '@/services/featureFlags';

interface FeatureFlagContextType {
  flags: Record<ModuleKey, FeatureFlag>;
  isModuleEnabled: (moduleKey: ModuleKey) => boolean;
  setModuleFlag: (moduleKey: ModuleKey, enabled: boolean, userId: string, reason?: string) => Promise<void>;
  getModuleInfo: (moduleKey: ModuleKey) => { name: string; description: string };
}

const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(undefined);

export function FeatureFlagProvider({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState<Record<ModuleKey, FeatureFlag>>(featureFlagService.getAllFlags());

  useEffect(() => {
    // Subscribe to flag changes
    const unsubscribe = featureFlagService.onChange((newFlags) => {
      setFlags(newFlags);
    });

    return unsubscribe;
  }, []);

  const isModuleEnabled = (moduleKey: ModuleKey): boolean => {
    return flags[moduleKey]?.enabled ?? false;
  };

  const setModuleFlag = async (
    moduleKey: ModuleKey,
    enabled: boolean,
    userId: string,
    reason?: string
  ): Promise<void> => {
    await featureFlagService.setFlag(moduleKey, enabled, userId, reason);
    // State will be updated via the onChange subscription
  };

  const getModuleInfo = (moduleKey: ModuleKey) => {
    return featureFlagService.getModuleInfo(moduleKey);
  };

  return (
    <FeatureFlagContext.Provider
      value={{
        flags,
        isModuleEnabled,
        setModuleFlag,
        getModuleInfo
      }}
    >
      {children}
    </FeatureFlagContext.Provider>
  );
}

export function useFeatureFlags() {
  const context = useContext(FeatureFlagContext);
  if (context === undefined) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagProvider');
  }
  return context;
}
