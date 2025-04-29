import { Button } from '@/components/ui/button';
import useRaportContext from '@/contexts/RaportContext';

const PeriodSelectsButtons = () => {
  const { resetFilters } = useRaportContext();

  return (
    <div className=" gap-y-2 flex flex-col">
      <Button
        type="submit"
        className="w-full bg-black hover:bg-gray-800 text-white rounded-md py-2 cursor-pointer"
      >
        Generuj raport
      </Button>
      <Button
        onClick={resetFilters}
        className="w-full text-gray-500 hover:text-gray-700 hover:bg-transparent cursor-pointer"
      >
        Resetuj filtry
      </Button>
    </div>
  );
};

export default PeriodSelectsButtons;
