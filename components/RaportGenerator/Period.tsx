
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import useRaportContext from "@/contexts/useRaportContext";
import { periodType } from "@/lib/types";
import PeriodDates from "../PeriodDates";
import Title from "../Title";

const Period = () => {
  const { periodType, setPeriodType, generateReport, resetFilters } = useRaportContext()


  return (
    <div className="space-y-4 flex flex-col">
      <Title text="Okres" />
      <div className="space-y-4 flex flex-col flex-1 justify-between">
        <div className="space-y-2 flex flex-col gap-y-2">
          <Label htmlFor="period-type" className="text-base">
            Wybierz okres z listy
          </Label>
          <Select value={periodType} onValueChange={(value) => setPeriodType(value as periodType)}>
            <SelectTrigger id="period-type" className="border-gray-300 cursor-pointer">
              <SelectValue placeholder="Wybierz okres" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem className="cursor-pointer" value="rok">Rok</SelectItem>
              <SelectItem className="cursor-pointer" value="półrocze">Półrocze</SelectItem>
              <SelectItem className="cursor-pointer" value="kwartał">Kwartał</SelectItem>
              <SelectItem className="cursor-pointer" value="miesiąc">Miesiąc</SelectItem>
              <SelectItem className="cursor-pointer" value="konkretne">Konkretne od-do</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <PeriodDates />
        <div className=" gap-y-2 flex flex-col">
          <Button
            onClick={generateReport}
            className="w-full bg-black hover:bg-gray-800 text-white rounded-md py-2 cursor-pointer"
          >
            Generuj raport
          </Button>
          <Button
            onClick={resetFilters}
            className="w-full text-gray-500 hover:text-gray-700 hover:bg-transparent cursor-pointer"
          >
            Resetuj filtry
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Period
