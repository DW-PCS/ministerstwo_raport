import useRaportContext from '@/contexts/RaportContext';
import SelectGroup from '../SelectGroup';
import { MONTH_SELECTS } from './constants';
import { monthTypes } from './types';
import YearSelector from './YearSelector';

const MonthSelector = () => {
  const { month, setMonth } = useRaportContext();

  return (
    <>
      <SelectGroup
        selectType={month}
        selectItems={MONTH_SELECTS}
        handleChange={value => setMonth(value as monthTypes)}
      />
      <YearSelector />
    </>
  );
};

export default MonthSelector;
