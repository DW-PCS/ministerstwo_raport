import { Button } from '@/components/ui/button';

const PeriodSelectsButtons = () => {
  return (
    <div className=" gap-y-2 flex flex-col">
      <Button
        type="submit"
        className="w-full bg-black hover:bg-gray-800 text-white rounded-md py-2 cursor-pointer"
      >
        Generuj raport
      </Button>
      {/* TODO: implement the reset function instead of window.location.reload() */}
      <Button
        onClick={() => window.location.reload()}
        className="w-full text-gray-500 hover:text-gray-700 hover:bg-transparent cursor-pointer"
      >
        Resetuj filtry
      </Button>
    </div>
  );
};

export default PeriodSelectsButtons;
