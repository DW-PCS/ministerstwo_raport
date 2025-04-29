import PeriodDates from '../../selectors/PeriodDates';
import Title from '../../Title';
import PeriodSelectsButtons from './PeriodSelectsButtons';

const PeriodSelects = () => {
  return (
    <div className="space-y-4 flex flex-col">
      <Title text="Okres" />
      <div className="space-y-4 flex flex-col flex-1 justify-between">
        <PeriodDates />
        <PeriodSelectsButtons  />
      </div>
    </div>
  );
};

export default PeriodSelects;
