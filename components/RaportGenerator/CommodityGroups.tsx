
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import useRaportContext from "@/contexts/useRaportContext";
import { commodityGroups } from "@/lib/constants";
import Title from "../Title";


const CommodityGroups = () => {


    const { selectedCommodities, handleCommodityChange } = useRaportContext()

  return (
    <div className="space-y-4">
      <Title text="Grupy Towarowe" />
      <div className="space-y-3 max-h-60 overflow-y-auto">
        {commodityGroups.map((commodity:string) => (
          <div key={commodity} className="flex items-center space-x-2">
            <Checkbox
              id={`commodity-${commodity}`}
              checked={selectedCommodities.includes(commodity)}
              onCheckedChange={(checked) => handleCommodityChange(commodity, checked as boolean)}
              className="border-gray-400 data-[state=checked]:bg-black text-white data-[state=checked]:border-black"
            />
            <Label htmlFor={`commodity-${commodity}`} className="text-base">
              {commodity}
            </Label>
          </div>
        ))}
      </div>
  </div>
  )
}

export default CommodityGroups
