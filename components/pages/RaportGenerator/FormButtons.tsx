import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const FormButtons = ({ isLoading = false }) => {
  return (
    <div className="gap-y-2 flex flex-col">
      <Button
        type="submit"
        className="w-full bg-black hover:bg-gray-800 text-white rounded-md py-2 cursor-pointer"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generowanie...
          </>
        ) : (
          'Generuj raport'
        )}
      </Button>
      {/* TODO: implement the reset function instead of window.location.reload() */}
      <Button
        type="button"
        onClick={() => window.location.reload()}
        className="w-full text-gray-500 hover:text-gray-700 hover:bg-transparent cursor-pointer"
        disabled={isLoading}
      >
        Resetuj filtry
      </Button>
    </div>
  );
};

export default FormButtons;
