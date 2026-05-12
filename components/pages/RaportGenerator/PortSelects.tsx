import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import useRaportContext from '@/contexts/RaportContext';
import { buildPortOptions } from '@/lib/helpers/port-filters';
import { AppClientsTypes } from '@/lib/types';
import Title from '../../Title';

interface PortSelectsProps {
  ports: AppClientsTypes[];
}

const PortSelects = ({ ports }: PortSelectsProps) => {
  const { selectedPorts, handlePortChange } = useRaportContext();
  const portOptions = buildPortOptions(ports);

  return (
    <div className="space-y-4">
      <Title text="Porty" />
      <div className="space-y-3 max-h-60 overflow-y-auto">
        {portOptions.map(option => (
          <div key={option.id} className="flex items-center space-x-2">
            <Checkbox
              id={option.id}
              checked={selectedPorts.includes(option.value)}
              disabled={option.disabled}
              onCheckedChange={checked => handlePortChange(option.value, checked as boolean)}
              className="border-gray-400 text-white data-[state=checked]:bg-[#1a0069] data-[state=checked]:border-[#1a0069]"
            />
            <Label
              htmlFor={option.id}
              className={`text-sm sm:text-base ${option.disabled ? 'cursor-not-allowed text-muted-foreground' : 'cursor-pointer'}`}
            >
              {option.label}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PortSelects;
