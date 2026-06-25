'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import useRaportContext from '@/contexts/RaportContext';
import { CHART_OPTIONS } from '@/constants';
import { AnimatePresence, motion } from 'framer-motion';
import PeriodDates from '../../selectors/PeriodDates';
import Title from '../../Title';
import FormButtons from './FormButtons';

interface PeriodSelectsProps {
  isLoading: boolean;
  onReset: () => void;
}

const PeriodSelects = ({ isLoading, onReset }: PeriodSelectsProps) => {
  const {
    includeCharts,
    setIncludeCharts,
    selectedChartTypes,
    toggleChartType,
    setSelectedChartTypes,
    breakdownByPeriod,
    setBreakdownByPeriod,
  } = useRaportContext();

  const availableChartOptions = CHART_OPTIONS.filter(({ type }) =>
    breakdownByPeriod ? type === 'bar_timeseries' : type !== 'bar_timeseries'
  );

  const handleBreakdownChange = (checked: boolean) => {
    setBreakdownByPeriod(checked);
    if (includeCharts) {
      const newOptions = CHART_OPTIONS.filter(({ type }) =>
        checked ? type === 'bar_timeseries' : type !== 'bar_timeseries'
      );
      setSelectedChartTypes(newOptions.map(o => o.type));
    }
  };

  const handleIncludeChartsChange = (checked: boolean) => {
    setIncludeCharts(checked);
    if (checked) {
      setSelectedChartTypes(availableChartOptions.map(o => o.type));
    }
  };

  return (
    <div className="space-y-4 flex flex-col">
      <Title text="Okres" />
      <div className="space-y-4 flex flex-col flex-1 justify-between">
        <div className="space-y-4">
          <PeriodDates />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="breakdown-by-period"
                checked={breakdownByPeriod}
                onCheckedChange={checked => handleBreakdownChange(Boolean(checked))}
              />
              <Label htmlFor="breakdown-by-period" className="cursor-pointer text-sm font-medium">
                Rozbij wg okresu
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="include-charts"
                checked={includeCharts}
                onCheckedChange={checked => handleIncludeChartsChange(Boolean(checked))}
              />
              <Label htmlFor="include-charts" className="cursor-pointer text-sm font-medium">
                Dodaj wykresy do dokumentu
              </Label>
            </div>
            <AnimatePresence initial={false}>
              {includeCharts && (
                <motion.div
                  key="chart-options"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="ml-6 space-y-2 rounded-lg border border-black/10 bg-[#f5f3ff] p-3">
                    <p className="text-xs font-semibold text-[#1a0069]">Rodzaj wykresu:</p>
                    {availableChartOptions.map(({ type, label }) => (
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <FormButtons isLoading={isLoading} onReset={onReset} />
      </div>
    </div>
  );
};

export default PeriodSelects;
