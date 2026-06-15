import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import useRaportContext from "@/contexts/RaportContext";
import { buildPortOptions } from "@/lib/helpers/port-filters";
import { AppClientsTypes } from "@/lib/types";
import Title from "../../Title";

interface PortSelectsProps {
  ports: AppClientsTypes[];
}

const PortSelects = ({ ports }: PortSelectsProps) => {
  const { selectedPorts, handlePortChange } = useRaportContext();
  const portOptions = buildPortOptions(ports);
  const enabledOptions = portOptions.filter((o) => !o.disabled);
  const selectedCount = enabledOptions.filter((o) =>
    selectedPorts.includes(o.value),
  ).length;
  const allSelected =
    selectedCount === enabledOptions.length && enabledOptions.length > 0;
  const someSelected = selectedCount > 0 && !allSelected;

  const handleToggleAll = () => {
    enabledOptions.forEach((o) => handlePortChange(o.value, !allSelected));
  };

  return (
    <div className="space-y-4">
      <Title text="Porty" />
      <div className="space-y-3 overflow-y-auto">
        <div className="flex items-center space-x-2 pb-2 border-b border-black/10">
          <Checkbox
            id="port-select-all"
            checked={someSelected ? "indeterminate" : allSelected}
            onCheckedChange={handleToggleAll}
            className="border-gray-400 data-[state=checked]:bg-[#1a0069] data-[state=checked]:border-[#1a0069] data-[state=indeterminate]:bg-[#1a0069] data-[state=indeterminate]:border-[#1a0069]"
          />
          <Label
            htmlFor="port-select-all"
            className="cursor-pointer text-sm font-medium text-gray-500"
          >
            Wszystkie
            <span className="ml-1 text-xs font-normal text-gray-400">({selectedCount}/{enabledOptions.length})</span>
          </Label>
        </div>
        {portOptions.map((option) => (
          <div key={option.id} className="flex items-center space-x-2">
            <Checkbox
              id={option.id}
              checked={selectedPorts.includes(option.value)}
              disabled={option.disabled}
              onCheckedChange={(checked) =>
                handlePortChange(option.value, checked as boolean)
              }
              className="border-gray-400 text-white data-[state=checked]:bg-[#1a0069] data-[state=checked]:border-[#1a0069]"
            />
            <Label
              htmlFor={option.id}
              className={`text-sm sm:text-base ${option.disabled ? "cursor-not-allowed text-muted-foreground" : "cursor-pointer"}`}
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
