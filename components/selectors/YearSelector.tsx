import useRaportContext from '@/contexts/RaportContext';

import SelectGroup from '../SelectGroup';
import { YEAR_SELECTS } from './constants';

const YearSelector = () => {
  const { year, setYear } = useRaportContext();
  return (
    <SelectGroup
      selectType={year}
      selectItems={YEAR_SELECTS}
      handleChange={value => setYear(value as string)}
    />
  );
};

export default YearSelector;
