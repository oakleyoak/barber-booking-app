export interface ShopSettings {
  dailyTarget: number;
  weeklyTarget: number;
  monthlyTarget: number;
  barberCommission: number;
  apprenticeCommission: number;
  socialInsuranceRate: number;
  incomeTaxRate: number;
  incomeTaxThreshold: number;
}

export const defaultShopSettings: ShopSettings = {
  dailyTarget: 1500,     // Turkish Lira values
  weeklyTarget: 9000,    // Turkish Lira values  
  monthlyTarget: 45000,  // Turkish Lira values
  barberCommission: 60,
  apprenticeCommission: 40,
  socialInsuranceRate: 20,
  incomeTaxRate: 15,
  incomeTaxThreshold: 3000  // Turkish Lira threshold
};

export class ShopSettingsService {
  private static getStorageKey(shopName: string): string {
    return `shop_settings_${shopName}`;
  }

  static getSettings(shopName: string): ShopSettings {
    try {
      const saved = localStorage.getItem(this.getStorageKey(shopName));
      if (saved) {
        return { ...defaultShopSettings, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('Error loading shop settings:', error);
    }
    return defaultShopSettings;
  }

  static saveSettings(shopName: string, settings: ShopSettings): void {
    try {
      localStorage.setItem(this.getStorageKey(shopName), JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving shop settings:', error);
      throw new Error('Failed to save settings');
    }
  }

  static getCommissionRate(role: string, shopName: string): number {
    const settings = this.getSettings(shopName);
    switch (role.toLowerCase()) {
      case 'barber':
        return settings.barberCommission;
      case 'apprentice':
        return settings.apprenticeCommission;
      default:
        return settings.barberCommission;
    }
  }

  static getTargets(shopName: string): { daily: number; weekly: number; monthly: number } {
    const settings = this.getSettings(shopName);
    return {
      daily: settings.dailyTarget,
      weekly: settings.weeklyTarget,
      monthly: settings.monthlyTarget
    };
  }
}
