import PeriodDates from '../../selectors/PeriodDates';
import Title from '../../Title';
import FormButtons from './FormButtons';

const PeriodSelects = ({ isLoading }: { isLoading: boolean }) => {
  return (
    <div className="space-y-4 flex flex-col">
      <Title text="Okres" />
      <div className="space-y-4 flex flex-col flex-1 justify-between">
        <PeriodDates />
        <FormButtons isLoading={isLoading} />
      </div>
    </div>
  );
};

export default PeriodSelects;
