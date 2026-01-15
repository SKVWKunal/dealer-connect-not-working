/**
 * Feature Flag Service
 * 
 * Manages dynamic module activation/deactivation.
 * Super Admin can toggle modules on/off, which affects:
 * - Navigation visibility
 * - Route access
 * - Form/dashboard availability
 */

import { ModuleKey, FeatureFlag, FeatureFlagConfig } from '@/types';
import { configStorage } from './storage';
import { auditService } from './audit';

type FlagChangeCallback = (flags: Record<ModuleKey, FeatureFlag>) => void;

const FEATURE_FLAGS_KEY = 'feature_flags';
const FEATURE_FLAGS_VERSION = 2;

const DEFAULT_FLAGS: Record<ModuleKey, FeatureFlag> = {
  dealer_pcc: {
    moduleKey: 'dealer_pcc',
    enabled: true, // Always on by default
    lastModifiedBy: 'system',
    lastModifiedAt: new Date().toISOString(),
    reason: 'Default module'
  },
  api_registration: {
    moduleKey: 'api_registration',
    enabled: true,
    lastModifiedBy: 'system',
    lastModifiedAt: new Date().toISOString(),
    reason: 'Enabled by default'
  },
  mt_meet: {
    moduleKey: 'mt_meet',
    enabled: true,
    lastModifiedBy: 'system',
    lastModifiedAt: new Date().toISOString(),
    reason: 'Enabled by default'
  },
  workshop_survey: {
    moduleKey: 'workshop_survey',
    enabled: true,
    lastModifiedBy: 'system',
    lastModifiedAt: new Date().toISOString(),
    reason: 'Enabled by default'
  },
  warranty_survey: {
    moduleKey: 'warranty_survey',
    enabled: true,
    lastModifiedBy: 'system',
    lastModifiedAt: new Date().toISOString(),
    reason: 'Enabled by default'
  },
  technical_awareness_survey: {
    moduleKey: 'technical_awareness_survey',
    enabled: true,
    lastModifiedBy: 'system',
    lastModifiedAt: new Date().toISOString(),
    reason: 'Enabled by default'
  }
};


class FeatureFlagService {
  private listeners: Set<FlagChangeCallback> = new Set();

  constructor() {
    const existing = configStorage.get<FeatureFlagConfig>(FEATURE_FLAGS_KEY);

    if (!existing) {
      configStorage.set(FEATURE_FLAGS_KEY, { version: FEATURE_FLAGS_VERSION, flags: DEFAULT_FLAGS });
      return;
    }

    const existingVersion = existing.version ?? 1;

    // Migrate older configs:
    // - add missing modules
    // - apply new defaults ONLY if the flag was never changed by a user (lastModifiedBy === 'system')
    if (existingVersion < FEATURE_FLAGS_VERSION) {
      const migratedFlags = { ...(existing.flags || {}) } as Record<ModuleKey, FeatureFlag>;

      (Object.keys(DEFAULT_FLAGS) as ModuleKey[]).forEach((moduleKey) => {
        const current = existing.flags?.[moduleKey];
        const nextDefault = DEFAULT_FLAGS[moduleKey];

        if (!current) {
          migratedFlags[moduleKey] = nextDefault;
          return;
        }

        const wasSystemDefault = current.lastModifiedBy === 'system';

        if (wasSystemDefault && current.enabled === false && nextDefault.enabled === true) {
          migratedFlags[moduleKey] = {
            ...current,
            enabled: true,
            lastModifiedAt: new Date().toISOString(),
            reason: current.reason ?? 'Updated default'
          };
          return;
        }

        migratedFlags[moduleKey] = current;
      });

      configStorage.set(FEATURE_FLAGS_KEY, { version: FEATURE_FLAGS_VERSION, flags: migratedFlags });
      return;
    }
  }


  private getConfig(): FeatureFlagConfig {
    const config = configStorage.get<FeatureFlagConfig>(FEATURE_FLAGS_KEY);
    if (!config?.flags) {
      return { version: FEATURE_FLAGS_VERSION, flags: DEFAULT_FLAGS };
    }

    return {
      version: config.version ?? FEATURE_FLAGS_VERSION,
      // Ensure any missing keys fall back to defaults (without overriding user choices)
      flags: { ...DEFAULT_FLAGS, ...config.flags }
    };
  }


  private setConfig(config: FeatureFlagConfig): void {
    configStorage.set(FEATURE_FLAGS_KEY, config);
    this.notifyListeners();
  }

  private notifyListeners(): void {
    const config = this.getConfig();
    this.listeners.forEach(callback => callback(config.flags));
  }

  getFlag(moduleKey: ModuleKey): boolean {
    const config = this.getConfig();
    return config.flags[moduleKey]?.enabled ?? false;
  }

  getAllFlags(): Record<ModuleKey, FeatureFlag> {
    const config = this.getConfig();
    return config.flags;
  }

  async setFlag(
    moduleKey: ModuleKey, 
    enabled: boolean, 
    userId: string,
    reason?: string
  ): Promise<void> {
    const config = this.getConfig();
    
    const previousState = config.flags[moduleKey]?.enabled;
    
    config.flags[moduleKey] = {
      moduleKey,
      enabled,
      lastModifiedBy: userId,
      lastModifiedAt: new Date().toISOString(),
      reason
    };
    
    this.setConfig(config);

    // Log audit event
    await auditService.log({
      userId,
      userEmail: '', // Will be filled by auth context
      role: 'super_admin',
      module: moduleKey,
      action: 'flag_toggle',
      details: {
        previousState,
        newState: enabled,
        reason
      },
      notes: `Module ${moduleKey} ${enabled ? 'enabled' : 'disabled'}`
    });
  }

  onChange(callback: FlagChangeCallback): () => void {
    this.listeners.add(callback);
    // Return unsubscribe function
    return () => this.listeners.delete(callback);
  }

  // Module metadata for UI
  getModuleInfo(moduleKey: ModuleKey): { name: string; description: string } {
    const moduleInfo: Record<ModuleKey, { name: string; description: string }> = {
      dealer_pcc: {
        name: 'Dealer PCC',
        description: 'Product Concern Capture submission and tracking system'
      },
      api_registration: {
        name: 'API Registration',
        description: 'Event-based participant registration management'
      },
      mt_meet: {
        name: 'MT Meet',
        description: 'Master Technician meeting and event management'
      },
      workshop_survey: {
        name: 'Workshop System Survey',
        description: 'ElsaPro, ODIS, and tools feedback collection'
      },
      warranty_survey: {
        name: 'Warranty Survey',
        description: 'Warranty process feedback and improvement'
      },
      technical_awareness_survey: {
        name: 'Technical Awareness Survey',
        description: 'Technical knowledge assessment surveys'
      }
    };
    return moduleInfo[moduleKey];
  }
}

export const featureFlagService = new FeatureFlagService();
