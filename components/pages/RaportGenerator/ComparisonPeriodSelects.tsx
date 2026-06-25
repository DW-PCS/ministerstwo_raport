'use client';

import ComparisonPeriodDates from '@/components/selectors/ComparisonPeriodDates';
import type { UseComparisonDataReturn } from '@/hooks/useComparisonData';
import FormButtons from './FormButtons';
import Title from '../../Title';

interface ComparisonPeriodSelectsProps {
  hook: UseComparisonDataReturn;
  onReset: () => void;
}

const ComparisonPeriodSelects = ({ hook, onReset }: ComparisonPeriodSelectsProps) => {
  return (
    <div className="space-y-4 flex flex-col">
      <Title text="Okres porównania" />
      <div className="space-y-4 flex flex-col flex-1 justify-between">
        <ComparisonPeriodDates hook={hook} />
        <FormButtons isLoading={hook.isLoading} onReset={onReset} />
      </div>
    </div>
  );
};

export default ComparisonPeriodSelects;
