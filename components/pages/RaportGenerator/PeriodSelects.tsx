import PeriodDates from '../../selectors/PeriodDates';
import Title from '../../Title';
import FormButtons from './FormButtons';

interface PeriodSelectsProps {
  isLoading: boolean;
  onReset: () => void;
}

const PeriodSelects = ({ isLoading, onReset }: PeriodSelectsProps) => {
  return (
    <div className="space-y-4 flex flex-col">
      <Title text="Okres" />
      <div className="space-y-4 flex flex-col flex-1 justify-between">
        <PeriodDates />
        <FormButtons isLoading={isLoading} onReset={onReset} />
      </div>
    </div>
  );
};

export default PeriodSelects;
