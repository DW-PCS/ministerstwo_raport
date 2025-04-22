
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import useRaportContext from "@/contexts/RaportContext";
import { ports } from "@/lib/constants";
import Title from "../Title";

const Ports = () => {

  const { selectedPorts, handlePortChange } = useRaportContext()
  return (
    <div className="space-y-4">
      <Title text="Porty" />
      <div className="space-y-3 max-h-60 overflow-y-auto">
        {ports.map((port) => (
          <div key={port} className="flex items-center space-x-2">
            <Checkbox
              id={`port-${port}`}
              checked={selectedPorts.includes(port)}
              onCheckedChange={(checked) => handlePortChange(port, checked as boolean)}
              className="border-gray-400 text-white data-[state=checked]:bg-[#1a0069] data-[state=checked]:border-[#1a0069]"
            />
            <Label htmlFor={`port-${port}`} className="text-sm sm:text-base">
              {port}
            </Label>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Ports
