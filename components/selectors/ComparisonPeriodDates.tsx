'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MONTH_ABBR, MONTH_NAMES } from '@/constants';
import type { UseComparisonDataReturn } from '@/hooks/useComparisonData';
import { cn } from '@/lib/utils';
import type { SelectedComparisonPeriod } from '@/types';

import { Trash2, X } from 'lucide-react';
import { useState } from 'react';

function isOutsideTestRange(p: SelectedComparisonPeriod): boolean {
  if (p.year !== 2025) return true;
  if (p.type === 'YEAR') return true;
  if (p.type === 'HALF_YEAR') return p.halfYear === 1;
  if (p.type === 'QUARTER') return (p.quarter ?? 1) < 3;
  if (p.type === 'MONTH') return (p.month ?? 1) < 7;
  return false;
}

type DraftType = 'YEAR' | 'HALF_YEAR' | 'QUARTER' | 'MONTH';

const TYPE_OPTIONS: { value: DraftType; label: string }[] = [
  { value: 'MONTH', label: 'Miesiąc' },
  // { value: 'QUARTER', label: 'Kwartał' },
  // { value: 'HALF_YEAR', label: 'Półrocze' },
  // { value: 'YEAR', label: 'Rok' },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: currentYear - 2009 }, (_, i) => currentYear - i);

const QUARTER_LABELS = ['I kw.', 'II kw.', 'III kw.', 'IV kw.'];
const HALF_YEAR_LABELS = ['I półrocze', 'II półrocze'];

function buildLabel(type: DraftType, year: number, subIndex: number): string {
  if (type === 'YEAR') return String(year);
  if (type === 'HALF_YEAR') return `${subIndex === 1 ? 'I' : 'II'} półrocze ${year}`;
  if (type === 'QUARTER') return `${['I', 'II', 'III', 'IV'][subIndex - 1]} kwartał ${year}`;
  return `${MONTH_NAMES[subIndex - 1]} ${year}`;
}

interface ComparisonPeriodDatesProps {
  hook: UseComparisonDataReturn;
}

const ComparisonPeriodDates = ({ hook }: ComparisonPeriodDatesProps) => {
  const { selectedPeriods, addPeriod, removePeriod, clearPeriods } = hook;

  const [draftType, setDraftType] = useState<DraftType>('MONTH');
  const [draftYear, setDraftYear] = useState(currentYear - 1);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  const handleTypeChange = (val: DraftType) => {
    setDraftType(val);
    setSelectedIndices([]);
  };

  const getAddedPeriod = (index: number) =>
    selectedPeriods.find(
      p =>
        p.type === draftType &&
        p.year === draftYear &&
        (draftType === 'MONTH'
          ? p.month === index
          : draftType === 'QUARTER'
            ? p.quarter === index
            : draftType === 'HALF_YEAR'
              ? p.halfYear === index
              : true)
    );

  const isAlreadyAdded = (index: number) => !!getAddedPeriod(index);

  const toggleIndex = (index: number) => {
    if (isAlreadyAdded(index)) return;
    setSelectedIndices(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const newCount = selectedIndices.filter(i => !isAlreadyAdded(i)).length;

  const handleAdd = () => {
    if (draftType === 'YEAR') {
      if (isAlreadyAdded(0)) return;
      addPeriod({
        id: `YEAR-${draftYear}-${Date.now()}`,
        type: 'YEAR',
        year: draftYear,
        halfYear: null,
        quarter: null,
        month: null,
        label: String(draftYear),
      });
      return;
    }

    selectedIndices.filter(i => !isAlreadyAdded(i)).forEach(index => {
      const period: SelectedComparisonPeriod = {
        id: `${draftType}-${draftYear}-${index}-${Date.now()}-${Math.random()}`,
        type: draftType,
        year: draftYear,
        halfYear: draftType === 'HALF_YEAR' ? (index as 1 | 2) : null,
        quarter: draftType === 'QUARTER' ? (index as 1 | 2 | 3 | 4) : null,
        month: draftType === 'MONTH' ? index : null,
        label: buildLabel(draftType, draftYear, index),
      };
      addPeriod(period);
    });
    setSelectedIndices([]);
  };

  const showBanner = selectedPeriods.some(isOutsideTestRange);
  const yearAlreadyAdded = draftType === 'YEAR' && isAlreadyAdded(0);

  const toggleBtnClass = (index: number) => {
    const added = isAlreadyAdded(index);
    const active = selectedIndices.includes(index);
    return cn(
      'rounded-md border text-sm font-medium transition-all select-none cursor-pointer',
      added
        ? 'bg-[#1a0069]/10 border-[#1a0069]/20 text-[#1a0069]/50 hover:bg-red-50 hover:border-red-300 hover:text-red-500'
        : active
          ? 'bg-[#1a0069] border-[#1a0069] text-white shadow-sm'
          : 'bg-white border-gray-200 text-gray-700 hover:border-[#1a0069]/50 hover:bg-[#f5f3ff]'
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Select value={draftType} onValueChange={val => handleTypeChange(val as DraftType)}>
          <SelectTrigger className="flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={String(draftYear)}
          onValueChange={val => {
            setDraftYear(Number(val));
            setSelectedIndices([]);
          }}
        >
          <SelectTrigger className="flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {YEARS.map(y => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {draftType === 'MONTH' && (
        <div className="grid grid-cols-4 gap-1.5">
          {MONTH_ABBR.map((abbr, i) => {
            const added = isAlreadyAdded(i + 1);
            return (
              <button
                key={i + 1}
                type="button"
                onClick={() => {
                  if (added) {
                    const p = getAddedPeriod(i + 1);
                    if (p) removePeriod(p.id);
                  } else {
                    toggleIndex(i + 1);
                  }
                }}
                className={cn(toggleBtnClass(i + 1), 'py-2 flex items-center justify-center gap-1')}
              >
                {abbr}

              </button>
            );
          })}
        </div>
      )}

      {draftType === 'QUARTER' && (
        <div className="grid grid-cols-2 gap-2">
          {QUARTER_LABELS.map((label, i) => {
            const added = isAlreadyAdded(i + 1);
            return (
              <button
                key={i + 1}
                type="button"
                onClick={() => {
                  if (added) {
                    const p = getAddedPeriod(i + 1);
                    if (p) removePeriod(p.id);
                  } else {
                    toggleIndex(i + 1);
                  }
                }}
                className={cn(toggleBtnClass(i + 1), 'py-2.5 flex items-center justify-center gap-1.5')}
              >
                {label}
                {added && <Trash2 className="h-3 w-3 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}

      {draftType === 'HALF_YEAR' && (
        <div className="grid grid-cols-2 gap-2">
          {HALF_YEAR_LABELS.map((label, i) => {
            const added = isAlreadyAdded(i + 1);
            return (
              <button
                key={i + 1}
                type="button"
                onClick={() => {
                  if (added) {
                    const p = getAddedPeriod(i + 1);
                    if (p) removePeriod(p.id);
                  } else {
                    toggleIndex(i + 1);
                  }
                }}
                className={cn(toggleBtnClass(i + 1), 'py-2.5 flex items-center justify-center gap-1.5')}
              >
                {label}
                {added && <Trash2 className="h-3 w-3 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}

      <Button
        type="button"
        onClick={handleAdd}
        disabled={draftType !== 'YEAR' ? newCount === 0 : yearAlreadyAdded}
        className="w-full bg-[#1a0069] hover:bg-[#1a0069]/90 text-white disabled:opacity-40"
      >
        {draftType === 'YEAR'
          ? yearAlreadyAdded
            ? `Rok ${draftYear} już dodany`
            : `Dodaj rok ${draftYear}`
          : newCount === 0
            ? 'Zaznacz okresy powyżej'
            : `Dodaj zaznaczone (${newCount})`}
      </Button>

      {selectedPeriods.length > 0 && (
        <div className="space-y-1.5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-0.5">
            {selectedPeriods.map(p => (
              <Badge
                key={p.id}
                variant="secondary"
                className="flex justify-between py-1 pr-1.5 text-[12px]  bg-[#f5f3ff] text-[#1a0069] border border-[#1a0069]/20 w-full"
              >
                {p.label}
                <button
                  type="button"
                  onClick={() => removePeriod(p.id)}
                  className="ml-0.5 rounded-full hover:bg-[#1a0069]/10 "
                >
                  <X className="h-3 w-3 ml-auto" />
                </button>
              </Badge>
            ))}
          </div>
          <button
            type="button"
            onClick={clearPeriods}
            className="text-xs text-muted-foreground hover:text-destructive underline underline-offset-2"
          >
            Wyczyść wszystkie
          </button>
        </div>
      )}

      {showBanner && (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          Tylko niektóre wybrane okresy zawierają dane testowe. (lipiec - grudzień 2025)
        </p>
      )}
    </div>
  );
};

export default ComparisonPeriodDates;
