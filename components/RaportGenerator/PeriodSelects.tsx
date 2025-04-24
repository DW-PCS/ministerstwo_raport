import useRaportContext from '@/contexts/RaportContext';

import SelectGroup from '../SelectGroup';
import { PERIOD_SELECTS, periodType } from '../selectors';
import HalfYearSelector from '../selectors/HalfYearSelector';
import MonthSelector from '../selectors/MonthSelector';
import PeriodDates from '../selectors/PeriodDates';
import QuarterSelector from '../selectors/QuarterSelector';
import YearSelector from '../selectors/YearSelector';
import Title from '../Title';
import PeriodSelectsButtons from './PeriodSelectsButtons';

const PeriodSelects = () => {
  const { periodType, setPeriodType } = useRaportContext();

  return (
    <div className="space-y-4 flex flex-col">
      <Title text="Okres" />
      <div className="space-y-4 flex flex-col">
        <SelectGroup
          label="Wybierz okres z listy"
          selectType={periodType}
          selectItems={PERIOD_SELECTS}
          handleChange={value => setPeriodType(value as periodType)}
        />

        {periodType == 'konkretne' && <PeriodDates />}
        {periodType == 'półrocze' && <HalfYearSelector />}
        {periodType == 'rok' && <YearSelector />}
        {periodType == 'kwartał' && <QuarterSelector />}
        {periodType == 'miesiąc' && <MonthSelector />}

        <PeriodSelectsButtons />
      </div>
    </div>
  );
};

export default PeriodSelects;
