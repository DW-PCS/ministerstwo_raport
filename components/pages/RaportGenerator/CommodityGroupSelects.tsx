import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import useRaportContext from "@/contexts/RaportContext";
import Title from "../../Title";

const CommodityGroupSelects = ({ groups }: { groups: string[] }) => {
  const { selectedCommodities, handleCommodityChange } = useRaportContext();
  const selectedCount = groups.filter((g) =>
    selectedCommodities.includes(g),
  ).length;
  const allSelected = selectedCount === groups.length && groups.length > 0;
  const someSelected = selectedCount > 0 && !allSelected;

  const handleToggleAll = () => {
    groups.forEach((g) => handleCommodityChange(g, !allSelected));
  };

  return (
    <div className="space-y-4">
      <Title text="Grupy Towarowe" />
      <div className="space-y-3  overflow-y-auto">
        <div className="flex items-center space-x-2 pb-2 border-b border-black/10">
          <Checkbox
            id="commodity-select-all"
            checked={someSelected ? "indeterminate" : allSelected}
            onCheckedChange={handleToggleAll}
            className="border-gray-400 data-[state=checked]:bg-[#1a0069] data-[state=checked]:border-[#1a0069] data-[state=indeterminate]:bg-[#1a0069] data-[state=indeterminate]:border-[#1a0069]"
          />
          <Label
            htmlFor="commodity-select-all"
            className="cursor-pointer text-sm font-medium text-gray-500"
          >
            Wszystkie
            <span className="ml-1 text-xs font-normal text-gray-400">({selectedCount}/{groups.length})</span>
          </Label>
        </div>
        {groups.map((commodity: string) => (
          <div key={commodity} className="flex items-center space-x-2">
            <Checkbox
              id={`commodity-${commodity}`}
              checked={selectedCommodities.includes(commodity)}
              onCheckedChange={(checked) =>
                handleCommodityChange(commodity, checked as boolean)
              }
              className="border-gray-400 data-[state=checked]:bg-[#1a0069] data-[state=checked]:border-[#1a0069]"
            />
            <Label
              htmlFor={`commodity-${commodity}`}
              className="text-base cursor-pointer"
            >
              {commodity}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommodityGroupSelects;
