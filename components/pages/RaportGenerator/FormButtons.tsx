import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface FormButtonsProps {
  isLoading?: boolean;
  onReset: () => void;
}

const FormButtons = ({ isLoading = false, onReset }: FormButtonsProps) => {
  return (
    <div className="gap-y-2 flex flex-col">
      <Button type="submit" variant="default" disabled={isLoading}>
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Generowanie...
          </span>
        ) : (
          'Generuj raport'
        )}
      </Button>
      <Button type="button" onClick={onReset} variant="outline" disabled={isLoading}>
        Resetuj filtry
      </Button>
    </div>
  );
};

export default FormButtons;
