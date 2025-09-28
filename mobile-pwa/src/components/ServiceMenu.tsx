import React, { useState } from 'react';
import { Clock, DollarSign, Edit2 } from 'lucide-react';
import { SERVICES, ServicePricingService } from '../services/servicePricing';

interface ServiceMenuProps {
  onServiceSelect?: (serviceName: string, customPrice?: number) => void;
  selectedService?: string;
  showPrices?: boolean;
  compact?: boolean;
  allowCustomPricing?: boolean;
}

const ServiceMenu: React.FC<ServiceMenuProps> = ({ 
  onServiceSelect, 
  selectedService, 
  showPrices = true, 
  compact = false,
  allowCustomPricing = false
}) => {
  const [customPrices, setCustomPrices] = useState<{[key: string]: number}>({});
  const [editingPrice, setEditingPrice] = useState<string | null>(null);

  const handlePriceChange = (serviceName: string, newPrice: number) => {
    setCustomPrices(prev => ({
      ...prev,
      [serviceName]: newPrice
    }));
    setEditingPrice(null);
  };

  const getServicePrice = (service: any) => {
    return customPrices[service.name] || service.price;
  };

  const handleServiceClick = (service: any) => {
    const finalPrice = getServicePrice(service);
    onServiceSelect?.(service.name, allowCustomPricing ? finalPrice : undefined);
  };

  return (
    <div className={`grid ${compact ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2'} gap-4`}>
      {SERVICES.map((service) => (
        <div
          key={service.name}
          onClick={() => !editingPrice && handleServiceClick(service)}
          className={`
            border rounded-lg p-4 transition-all
            ${selectedService === service.name 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }
            ${onServiceSelect && !editingPrice ? 'cursor-pointer' : 'cursor-default'}
          `}
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-gray-900">{service.name}</h3>
            {showPrices && (
              <div className="flex items-center gap-2">
                {editingPrice === service.name ? (
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-500">₺</span>
                    <input
                      type="number"
                      step="0.01"
                      defaultValue={getServicePrice(service)}
                      className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      onBlur={(e) => {
                        const newPrice = parseFloat(e.target.value);
                        if (!isNaN(newPrice) && newPrice > 0) {
                          handlePriceChange(service.name, newPrice);
                        } else {
                          setEditingPrice(null);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.currentTarget.blur();
                        } else if (e.key === 'Escape') {
                          setEditingPrice(null);
                        }
                      }}
                      autoFocus
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <span className="text-lg font-bold text-blue-600">₺{(getServicePrice(service) / 100).toFixed(2)}</span>
                    {allowCustomPricing && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingPrice(service.name);
                        }}
                        className="text-gray-400 hover:text-blue-600 p-1"
                        title="Edit price"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
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
          
          {allowCustomPricing && customPrices[service.name] && (
            <p className="text-xs text-blue-600 mt-1">Custom price applied</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default ServiceMenu;
