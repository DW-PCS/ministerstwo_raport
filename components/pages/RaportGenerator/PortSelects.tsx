import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import useRaportContext from '@/contexts/RaportContext';
import { AppClientsTypes } from '@/lib/types';
import Title from '../../Title';

interface PortSelectsProps {
  ports: AppClientsTypes[];
}

const PortSelects = ({ ports }: PortSelectsProps) => {
  const { selectedPorts, handlePortChange } = useRaportContext();

  return (
    <div className="space-y-4">
      <Title text="Porty" />
      <div className="space-y-3 max-h-60 overflow-y-auto">
        {ports.map(port => (
          <div key={port.id} className="flex items-center space-x-2">
            <Checkbox
              id={`port-${port.city}`}
              checked={selectedPorts.includes(port.city)}
              onCheckedChange={checked => handlePortChange(port.city, checked as boolean)}
              className="border-gray-400 text-white data-[state=checked]:bg-[#1a0069] data-[state=checked]:border-[#1a0069]"
            />
            <Label htmlFor={`port-${port.city}`} className="text-sm sm:text-base cursor-pointer">
              {port.city}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PortSelects;
