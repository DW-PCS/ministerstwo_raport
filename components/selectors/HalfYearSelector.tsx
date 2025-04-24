import useRaportContext from '@/contexts/RaportContext';

import SelectGroup from '../SelectGroup';
import YearSelector from './YearSelector';
import { HALF_YEAR_SELECTS } from './constants';
import { halfYearType } from './types';
const HalfYearSelector = () => {
  const { halfYear, setHalfYear } = useRaportContext();

  return (
    <>
      <SelectGroup
        selectType={halfYear}
        selectItems={HALF_YEAR_SELECTS}
        handleChange={value => setHalfYear(value as halfYearType)}
      />
      <YearSelector />
    </>
  );
};

export default HalfYearSelector;
