import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SelectGroupProps {
  selectType: string;
  label?: string;
  selectItems: {
    value: string;
    label: string;
  }[];
  handleChange: (v: string) => void;
  placeholder?: string;
}

const SelectGroup = ({
  selectType,
  label,
  selectItems,
  handleChange,
  placeholder,
}: SelectGroupProps) => {
  return (
    <div className="space-y-2 flex flex-col gap-y-2">
      {label && (
        <Label htmlFor={`select-${label}`} className="text-base">
          {label}
        </Label>
      )}
      <Select value={selectType} onValueChange={handleChange}>
        <SelectTrigger id={`select-${label}`} className="border-gray-300 cursor-pointer">
          <SelectValue placeholder={placeholder || label || 'Select an option'} />
        </SelectTrigger>
        <SelectContent className="bg-white">
          {selectItems?.map(item => (
            <SelectItem key={item.value} className="cursor-pointer" value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default SelectGroup;
