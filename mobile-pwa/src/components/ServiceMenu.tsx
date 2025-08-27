import React from 'react';
import { Clock, DollarSign } from 'lucide-react';
import { SERVICES, ServicePricingService } from '../services/servicePricing';

interface ServiceMenuProps {
  onServiceSelect?: (serviceName: string) => void;
  selectedService?: string;
  showPrices?: boolean;
  compact?: boolean;
}

const ServiceMenu: React.FC<ServiceMenuProps> = ({ 
  onServiceSelect, 
  selectedService, 
  showPrices = true, 
  compact = false 
}) => {
  return (
    <div className={`grid ${compact ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2'} gap-4`}>
      {SERVICES.map((service) => (
        <div
          key={service.name}
          onClick={() => onServiceSelect?.(service.name)}
          className={`
            border rounded-lg p-4 transition-all cursor-pointer
            ${selectedService === service.name 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }
            ${onServiceSelect ? 'cursor-pointer' : 'cursor-default'}
          `}
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-gray-900">{service.name}</h3>
            {showPrices && (
              <span className="text-lg font-bold text-blue-600">₺{service.price}</span>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{service.duration} min</span>
            </div>
          </div>
          
          {service.description && !compact && (
            <p className="text-sm text-gray-500 mt-2">{service.description}</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default ServiceMenu;
