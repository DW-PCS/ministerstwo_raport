import useRaportContext from '@/contexts/RaportContext';

import SelectGroup from '../SelectGroup';
import YearSelector from './YearSelector';
import { QUARTER_SELECTS } from './constants';
import { quarterTypes } from './types';

const QuarterSelector = () => {
  const { quarter, setQuarter } = useRaportContext();

  return (
    <>
      <SelectGroup
        selectType={quarter}
        selectItems={QUARTER_SELECTS}
        handleChange={value => setQuarter(value as quarterTypes)}
      />
      <YearSelector />
    </>
  );
};

export default QuarterSelector;
