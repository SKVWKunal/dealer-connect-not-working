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
    enabled: false,
    lastModifiedBy: 'system',
    lastModifiedAt: new Date().toISOString()
  },
  mt_meet: {
    moduleKey: 'mt_meet',
    enabled: false,
    lastModifiedBy: 'system',
    lastModifiedAt: new Date().toISOString()
  },
  workshop_survey: {
    moduleKey: 'workshop_survey',
    enabled: false,
    lastModifiedBy: 'system',
    lastModifiedAt: new Date().toISOString()
  },
  warranty_survey: {
    moduleKey: 'warranty_survey',
    enabled: false,
    lastModifiedBy: 'system',
    lastModifiedAt: new Date().toISOString()
  },
  technical_awareness_survey: {
    moduleKey: 'technical_awareness_survey',
    enabled: false,
    lastModifiedBy: 'system',
    lastModifiedAt: new Date().toISOString()
  }
};

class FeatureFlagService {
  private listeners: Set<FlagChangeCallback> = new Set();

  constructor() {
    // Initialize with default flags if not present
    if (!configStorage.get<FeatureFlagConfig>(FEATURE_FLAGS_KEY)) {
      configStorage.set(FEATURE_FLAGS_KEY, { flags: DEFAULT_FLAGS });
    }
  }

  private getConfig(): FeatureFlagConfig {
    return configStorage.get<FeatureFlagConfig>(FEATURE_FLAGS_KEY) || { flags: DEFAULT_FLAGS };
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
