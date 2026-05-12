'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import useRaportContext, { ChartType } from '@/contexts/RaportContext';
import PeriodDates from '../../selectors/PeriodDates';
import Title from '../../Title';
import FormButtons from './FormButtons';

interface PeriodSelectsProps {
  isLoading: boolean;
  onReset: () => void;
}

const CHART_OPTIONS: { type: ChartType; label: string }[] = [
  { type: 'bar_port', label: 'Słupkowy – struktura wg portu' },
  { type: 'bar_commodity', label: 'Słupkowy – wolumen wg grupy towarowej' },
  { type: 'pie', label: 'Kołowy – udział grup towarowych' },
];

const PeriodSelects = ({ isLoading, onReset }: PeriodSelectsProps) => {
  const { includeCharts, setIncludeCharts, selectedChartTypes, toggleChartType } =
    useRaportContext();

  return (
    <div className="space-y-4 flex flex-col">
      <Title text="Okres" />
      <div className="space-y-4 flex flex-col flex-1 justify-between">
        <div className="space-y-4">
          <PeriodDates />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="include-charts"
                checked={includeCharts}
                onCheckedChange={checked => setIncludeCharts(Boolean(checked))}
              />
              <Label htmlFor="include-charts" className="cursor-pointer text-sm font-medium">
                Dodaj wykresy do dokumentu
              </Label>
            </div>
            {includeCharts && (
              <div className="ml-6 space-y-2 rounded-lg border border-black/10 bg-[#f5f3ff] p-3">
                <p className="text-xs font-semibold text-[#1a0069]">Rodzaj wykresu:</p>
                {CHART_OPTIONS.map(({ type, label }) => (
                  <div key={type} className="flex items-center gap-2">
                    <Checkbox
                      id={`chart-type-${type}`}
                      checked={selectedChartTypes.includes(type)}
                      onCheckedChange={() => toggleChartType(type)}
                    />
                    <Label htmlFor={`chart-type-${type}`} className="cursor-pointer text-xs">
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <FormButtons isLoading={isLoading} onReset={onReset} />
      </div>
    </div>
  );
};

export default PeriodSelects;
