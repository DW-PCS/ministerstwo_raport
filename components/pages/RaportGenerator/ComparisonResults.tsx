'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { UseComparisonDataReturn } from '@/hooks/useComparisonData';
import { formatNumber } from '@/lib/helpers/format-helpers';
import {
  exportComparisonCsv,
  exportComparisonDocx,
  exportComparisonPdf,
  exportComparisonXlsx,
} from '@/lib/helpers/report-download/comparisonExporter';
import { cn } from '@/lib/utils';
import type { SelectedComparisonPeriod } from '@/types';
import { ArrowDownUp, Download, Loader2 } from 'lucide-react';
import { useState } from 'react';

type SortOrder = 'chronological' | 'selection';

function getPeriodSortKey(p: SelectedComparisonPeriod): number {
  const base = p.year * 100;
  if (p.type === 'MONTH') return base + (p.month ?? 1);
  if (p.type === 'QUARTER') return base + (p.quarter ?? 1) * 3;
  if (p.type === 'HALF_YEAR') return base + (p.halfYear ?? 1) * 6;
  return base;
}

const TYPE_SUFFIX: Record<SelectedComparisonPeriod['type'], string> = {
  YEAR: 'rok do roku',
  MONTH: 'miesiąc do miesiąca',
  QUARTER: 'kwartał do kwartału',
  HALF_YEAR: 'półrocze do półrocza',
};

function getTitle(periods: SelectedComparisonPeriod[]): string {
  if (periods.length === 0) return 'Raport porównawczy';
  const types = new Set(periods.map(p => p.type));
  if (types.size > 1) return 'Raport porównawczy';
  return `Raport porównawczy – ${TYPE_SUFFIX[[...types][0]]}`;
}

interface ComparisonResultsProps {
  hook: UseComparisonDataReturn;
}

function formatChange(change: number | null): { text: string; className: string } {
  if (change === null) return { text: '–', className: 'text-muted-foreground' };
  const sign = change >= 0 ? '+' : '';
  return {
    text: `${sign}${change.toFixed(1)}%`,
    className: change >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium',
  };
}

export default function ComparisonResults({ hook }: ComparisonResultsProps) {
  const { chainRows, submittedPeriods, isGenerated } = hook;
  const [isDownloading, setIsDownloading] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('chronological');

  const sortedRows = [...chainRows]
    .sort((a, b) => {
      if (a.port !== b.port) return a.port.localeCompare(b.port, 'pl');
      if (a.group !== b.group) return a.group.localeCompare(b.group, 'pl');
      if (sortOrder === 'chronological') {
        const pa = submittedPeriods[a.periodIndex];
        const pb = submittedPeriods[b.periodIndex];
        return getPeriodSortKey(pa) - getPeriodSortKey(pb);
      }
      return a.periodIndex - b.periodIndex;
    })
    .map((row, idx, arr) => {
      const prev = idx > 0 ? arr[idx - 1] : null;
      const sameGroup = prev && prev.port === row.port && prev.group === row.group;
      const change =
        sameGroup && prev.tonnage !== 0
          ? ((row.tonnage - prev.tonnage) / prev.tonnage) * 100
          : null;
      return { ...row, change };
    });

  const title = getTitle(submittedPeriods);
  const firstLabel = submittedPeriods[0]?.label ?? '';
  const lastLabel = submittedPeriods[submittedPeriods.length - 1]?.label ?? firstLabel;

  async function handleDownload(format: 'csv' | 'xlsx' | 'pdf' | 'docx') {
    setIsDownloading(true);
    try {
      if (format === 'csv') exportComparisonCsv(chainRows, firstLabel, lastLabel);
      else if (format === 'xlsx') exportComparisonXlsx(chainRows, firstLabel, lastLabel);
      else if (format === 'pdf') await exportComparisonPdf(chainRows, title, firstLabel, lastLabel);
      else await exportComparisonDocx(chainRows, title, firstLabel, lastLabel);
    } finally {
      setIsDownloading(false);
    }
  }

  if (!isGenerated) {
    return (
      <Card id="report-results" className="shadow-lg rounded-2xl overflow-hidden border-0 bg-white">
        <CardContent className="p-6">
          <div className="text-center py-10 text-muted-foreground">
            Wybierz co najmniej jeden port i jedną grupę towarową, aby wygenerować raport porównawczy
          </div>
        </CardContent>
      </Card>
    );
  }

  if (chainRows.length === 0) {
    return (
      <Card id="report-results" className="shadow-lg rounded-2xl overflow-hidden border-0 bg-white">
        <CardContent className="p-6">
          <div className="text-center py-10 text-muted-foreground">
            Brak danych do wyświetlenia. Spróbuj zmienić kryteria wyszukiwania.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="report-results" className="shadow-lg rounded-2xl overflow-hidden border-0">
      <CardHeader className="border-b bg-white border-black/20 flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-semibold">{title}</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(o => o === 'chronological' ? 'selection' : 'chronological')}
            className="flex items-center gap-1.5 text-xs"
          >
            <ArrowDownUp size={13} />
            {sortOrder === 'chronological' ? 'Chronologicznie' : 'Kolejność wyboru'}
          </Button>
          <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button disabled={isDownloading} className="flex cursor-pointer items-center gap-2">
              {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              <span>Pobierz raport</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-white" align="end">
            <DropdownMenuItem onClick={() => handleDownload('csv')} disabled={isDownloading} className="cursor-pointer hover:bg-light-gray">
              Pobierz jako CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDownload('pdf')} disabled={isDownloading} className="cursor-pointer hover:bg-light-gray">
              Pobierz jako PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDownload('docx')} disabled={isDownloading} className="cursor-pointer hover:bg-light-gray">
              Pobierz jako DOCX
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDownload('xlsx')} disabled={isDownloading} className="cursor-pointer hover:bg-light-gray">
              Pobierz jako XLSX
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="p-0 bg-white">
        <div className="overflow-x-auto px-6 py-4">
          <Table className="w-auto">
            <TableHeader>
              <TableRow className="bg-[#1a0069] hover:bg-[#1a0069]">
                <TableHead className="font-bold text-white border-r border-white/20 whitespace-nowrap">Port</TableHead>
                <TableHead className="font-bold text-white border-r border-white/20 whitespace-nowrap">Grupa towarowa</TableHead>
                <TableHead className="font-bold text-white border-r border-white/20 whitespace-nowrap">Okres</TableHead>
                <TableHead className="text-right font-bold text-white border-r border-white/20 whitespace-nowrap">Tonaż [t]</TableHead>
                <TableHead className="text-right font-bold text-white whitespace-nowrap">Zmiana</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRows.map((row, idx) => {
                const { text, className } = formatChange(row.change);
                const prevRow = sortedRows[idx - 1];
                const isNewGroup = idx === 0 || prevRow.port !== row.port || prevRow.group !== row.group;
                return (
                  <TableRow
                    key={`${row.port}-${row.group}-${row.periodIndex}`}
                    className={cn(
                      'border-black/20 hover:bg-purple-50',
                      idx % 2 === 0 ? 'bg-[#f5f3ff]' : 'bg-white',
                      isNewGroup && idx !== 0 && 'border-t-2 border-t-[#1a0069]'
                    )}
                  >
                    <TableCell className="border-r border-black/20 whitespace-nowrap font-medium">{row.port}</TableCell>
                    <TableCell className="border-r border-black/20 whitespace-nowrap">{row.group}</TableCell>
                    <TableCell className="border-r border-black/20 whitespace-nowrap">{row.periodLabel}</TableCell>
                    <TableCell className="text-right tabular-nums border-r border-black/20 whitespace-nowrap">
                      {formatNumber(row.tonnage)}
                    </TableCell>
                    <TableCell className={cn('text-right tabular-nums whitespace-nowrap', className)}>
                      {text}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}