export interface ServiceOption {
  name: string;
  price: number;
  duration: number; // in minutes
  description?: string;
}

export const SERVICES: ServiceOption[] = [
  { name: 'Haircut', price: 70000, duration: 45, description: 'Professional haircut and styling' },
  { name: 'Beard trim', price: 30000, duration: 15, description: 'Beard trimming and shaping' },
  { name: 'Blowdry', price: 50000, duration: 30, description: 'Hair blowdry and styling' },
  { name: 'Face mask', price: 20000, duration: 30, description: 'Facial treatment and mask' },
  { name: 'Colour', price: 100000, duration: 60, description: 'Hair coloring service' },
  { name: 'Wax', price: 50000, duration: 60, description: 'Hair waxing and styling' },
  { name: 'Massage', price: 70000, duration: 45, description: 'Relaxing head and neck massage' },
  { name: 'Shave', price: 50000, duration: 30, description: 'Traditional wet shave' }
];

export class ServicePricingService {
  static getService(serviceName: string): ServiceOption | undefined {
    return SERVICES.find(service => service.name === serviceName);
  }

  static getAllServices(): ServiceOption[] {
    return [...SERVICES];
  }

  static getServicePrice(serviceName: string): number {
    const service = this.getService(serviceName);
    return service?.price || 0;
  }

  static getServiceDuration(serviceName: string): number {
    const service = this.getService(serviceName);
    return service?.duration || 30;
  }

  static formatServiceDisplay(service: ServiceOption): string {
    return `${service.name} - ₺${service.price} (${service.duration}min)`;
  }

  static calculateEstimatedTime(serviceNames: string[]): number {
    return serviceNames.reduce((total, serviceName) => {
      return total + this.getServiceDuration(serviceName);
    }, 0);
  }

  static calculateTotalPrice(serviceNames: string[]): number {
    return serviceNames.reduce((total, serviceName) => {
      return total + this.getServicePrice(serviceName);
    }, 0);
  }
}
