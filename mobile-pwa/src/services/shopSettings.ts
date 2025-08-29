import { dbService } from './database';
import { ShopSettings } from '../lib/supabase';

export const defaultShopSettings: ShopSettings = {
  id: '',
  shop_name: '',
  daily_target: 1500,
  weekly_target: 9000,
  monthly_target: 45000,
  barber_commission: 60,
  manager_commission: 70,
  apprentice_commission: 40,
  social_insurance_rate: 20,
  income_tax_rate: 15,
  income_tax_threshold: 3000,
  opening_time: '09:00:00',
  closing_time: '20:00:00',
  closed_days: ['Thursday', 'Sunday']
};

// Fix TypeScript errors by ensuring default values for optional properties
export class ShopSettingsService {
  static async getSettings(shopName: string): Promise<ShopSettings> {
    try {
      const settings = await dbService.getShopSettings(shopName);
      
      if (settings) {
        return {
          ...defaultShopSettings,
          ...settings // Merge with defaults to ensure all properties are defined
        };
      }
      // Return default settings if none exist
      return { ...defaultShopSettings, shop_name: shopName };
    } catch (error) {
      console.error('Error loading shop settings for shop:', shopName);
      return { ...defaultShopSettings, shop_name: shopName };
    }
  }

  static async saveSettings(shopName: string, settings: Omit<ShopSettings, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    try {
      await dbService.createOrUpdateShopSettings(settings);
    } catch (error) {
      console.error('Error saving shop settings:', error);
      throw new Error('Failed to save settings');
    }
  }

  static async getCommissionRate(role: string, shopName: string): Promise<number> {
    try {
      const settings = await this.getSettings(shopName);
      switch (role.toLowerCase()) {
        case 'barber':
          return settings.barber_commission ?? defaultShopSettings.barber_commission ?? 60;
        case 'manager':
          return settings.manager_commission ?? defaultShopSettings.manager_commission ?? 70;
        case 'apprentice':
          return settings.apprentice_commission ?? defaultShopSettings.apprentice_commission ?? 40;
        case 'owner':
          return 100; // Owner always gets 100%
        default:
          return defaultShopSettings.barber_commission ?? 60;
      }
    } catch (error) {
      console.error('Error getting commission rate:', error);
      return defaultShopSettings.barber_commission ?? 60;
    }
  }

  static async getTargets(shopName: string): Promise<{ daily: number; weekly: number; monthly: number }> {
    try {
      const settings = await this.getSettings(shopName);
      return {
        daily: settings.daily_target ?? defaultShopSettings.daily_target,
        weekly: settings.weekly_target ?? defaultShopSettings.weekly_target,
        monthly: settings.monthly_target ?? defaultShopSettings.monthly_target
      };
    } catch (error) {
      console.error('Error getting targets:', error);
      return {
        daily: defaultShopSettings.daily_target,
        weekly: defaultShopSettings.weekly_target,
        monthly: defaultShopSettings.monthly_target
      };
    }
  }

  static async updateOpeningHours(shopName: string, openingTime: string, closingTime: string, closedDays: string[]): Promise<void> {
    try {
      const currentSettings = await this.getSettings(shopName);
      const updatedSettings: Omit<ShopSettings, 'id' | 'created_at' | 'updated_at'> = {
        ...currentSettings,
        opening_time: openingTime,
        closing_time: closingTime,
        closed_days: closedDays
      };
      await this.saveSettings(shopName, updatedSettings);
    } catch (error) {
      console.error('Error updating opening hours:', error);
      throw new Error('Failed to update opening hours');
    }
  }
}
