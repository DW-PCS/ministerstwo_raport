import { Loader2 } from 'lucide-react';

interface FormButtonsProps {
  isLoading?: boolean;
  onReset: () => void;
}

const FormButtons = ({ isLoading = false, onReset }: FormButtonsProps) => {
  return (
    <div className="gap-y-2 flex flex-col">
      <button
        type="submit"
        className="w-full bg-[#1a0069] hover:bg-[#2a0099] text-white rounded-md py-2 cursor-pointer disabled:opacity-60"
        style={{ color: '#ffffff' }}
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Generowanie...
          </span>
        ) : (
          'Generuj raport'
        )}
      </button>
      <button
        type="button"
        onClick={onReset}
        className="w-full text-gray-500 hover:text-gray-700 py-2 cursor-pointer bg-transparent"
        disabled={isLoading}
      >
        Resetuj filtry
      </button>
    </div>
  );
};

export default FormButtons;
