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
  const [variant, setVariant] = useState<1 | 2>(1);

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

  const variant2Rows = sortedRows.reduce<Array<{
    port: string;
    group: string;
    period1Label: string;
    tonnage1: number;
    period2Label: string;
    tonnage2: number;
    change: number | null;
    key: string;
  }>>((acc, row, idx) => {
    if (row.change !== null) {
      const prev = sortedRows[idx - 1];
      acc.push({
        port: row.port,
        group: row.group,
        period1Label: prev.periodLabel,
        tonnage1: prev.tonnage,
        period2Label: row.periodLabel,
        tonnage2: row.tonnage,
        change: row.change,
        key: `${row.port}-${row.group}-${idx}`,
      });
    }
    return acc;
  }, []);

  const title = getTitle(submittedPeriods);
  const firstLabel = submittedPeriods[0]?.label ?? '';
  const lastLabel = submittedPeriods[submittedPeriods.length - 1]?.label ?? firstLabel;

  const V2_HEADERS = ['Port', 'Grupa towarowa', 'Okres 1', 'Tonaż 1 [t]', 'Okres 2', 'Tonaż 2 [t]', 'Zmiana'];
  const V2_NUMERIC_COLS: number[] = [];

  async function handleDownload(format: 'csv' | 'xlsx' | 'pdf' | 'docx') {
    setIsDownloading(true);
    const fmtChange = (c: number | null) => c === null ? '–' : `${c >= 0 ? '+' : ''}${c.toFixed(1)}%`;
    const isV2 = variant === 2;
    const exportRows: string[][] = isV2
      ? variant2Rows.map(r => [r.port, r.group, r.period1Label, String(r.tonnage1), r.period2Label, String(r.tonnage2), fmtChange(r.change)])
      : sortedRows.map(r => [r.port, r.group, r.periodLabel, String(r.tonnage), fmtChange(r.change)]);
    const headers = isV2 ? V2_HEADERS : undefined;
    const numericCols = isV2 ? V2_NUMERIC_COLS : undefined;
    try {
      if (format === 'csv') exportComparisonCsv(exportRows, firstLabel, lastLabel, headers);
      else if (format === 'xlsx') exportComparisonXlsx(exportRows, firstLabel, lastLabel, headers);
      else if (format === 'pdf') await exportComparisonPdf(exportRows, title, firstLabel, lastLabel, headers);
      else await exportComparisonDocx(exportRows, title, firstLabel, lastLabel, headers, numericCols);
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
        <div className="flex gap-1 px-6 pt-4">
          {([1, 2] as const).map(v => (
            <button
              key={v}
              onClick={() => setVariant(v)}
              className={cn(
                'px-4 py-1.5 text-sm rounded-md font-medium transition-colors',
                variant === v ? 'bg-[#1a0069] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {v === 1 ? 'Wariant 1' : 'Wariant 2'}
            </button>
          ))}
        </div>
        <p className="px-6 pt-2 pb-0 text-xs text-muted-foreground">
          {variant === 1
            ? 'Każdy okres wyświetlany w osobnym wierszu ze zmianą względem poprzedniego okresu.'
            : 'Kolejne okresy zestawione parami w jednym wierszu – tonaż i zmiana między nimi.'}
        </p>
        <div className="overflow-x-auto px-6 py-4">
          {variant === 1 ? (
            <Table className="w-auto">
              <TableHeader>
                <TableRow className="bg-[#1a0069] hover:bg-[#1a0069]">
                  <TableHead className="font-bold text-white border-r border-white/20 whitespace-nowrap">Port</TableHead>
                  <TableHead className="font-bold text-white border-r border-white/20 whitespace-nowrap">Grupa towarowa</TableHead>
                  <TableHead className="font-bold text-white border-r border-white/20 whitespace-nowrap">Okres</TableHead>
                  <TableHead className="font-bold text-white border-r border-white/20 whitespace-nowrap">Tonaż [t]</TableHead>
                  <TableHead className="font-bold text-white whitespace-nowrap">Zmiana</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRows.map((row, idx) => {
                  const { text, className } = formatChange(row.change);
                  return (
                    <TableRow
                      key={`${row.port}-${row.group}-${row.periodIndex}`}
                      className={cn(
                        'border-black/20 hover:bg-purple-50',
                        idx % 2 === 0 ? 'bg-[#f5f3ff]' : 'bg-white'
                      )}
                    >
                      <TableCell className="border-r border-black/20 whitespace-nowrap font-medium">{row.port}</TableCell>
                      <TableCell className="border-r border-black/20 whitespace-nowrap">{row.group}</TableCell>
                      <TableCell className="border-r border-black/20 whitespace-nowrap">{row.periodLabel}</TableCell>
                      <TableCell className="tabular-nums border-r border-black/20 whitespace-nowrap">
                        {formatNumber(row.tonnage)}
                      </TableCell>
                      <TableCell className={cn('tabular-nums whitespace-nowrap', className)}>
                        {text}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <Table className="w-auto">
              <TableHeader>
                <TableRow className="bg-[#1a0069] hover:bg-[#1a0069]">
                  <TableHead className="font-bold text-white border-r border-white/20 whitespace-nowrap">Port</TableHead>
                  <TableHead className="font-bold text-white border-r border-white/20 whitespace-nowrap">Grupa towarowa</TableHead>
                  <TableHead className="font-bold text-white border-r border-white/20 whitespace-nowrap">Okres 1</TableHead>
                  <TableHead className="font-bold text-white border-r border-white/20 whitespace-nowrap">Tonaż 1 [t]</TableHead>
                  <TableHead className="font-bold text-white border-r border-white/20 whitespace-nowrap">Okres 2</TableHead>
                  <TableHead className="font-bold text-white border-r border-white/20 whitespace-nowrap">Tonaż 2 [t]</TableHead>
                  <TableHead className="font-bold text-white whitespace-nowrap">Zmiana</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variant2Rows.map((row, idx) => {
                  const { text, className } = formatChange(row.change);
                  return (
                    <TableRow
                      key={row.key}
                      className={cn(
                        'border-black/20 hover:bg-purple-50',
                        idx % 2 === 0 ? 'bg-[#f5f3ff]' : 'bg-white'
                      )}
                    >
                      <TableCell className="border-r border-black/20 whitespace-nowrap font-medium">{row.port}</TableCell>
                      <TableCell className="border-r border-black/20 whitespace-nowrap">{row.group}</TableCell>
                      <TableCell className="border-r border-black/20 whitespace-nowrap">{row.period1Label}</TableCell>
                      <TableCell className="tabular-nums border-r border-black/20 whitespace-nowrap">{formatNumber(row.tonnage1)}</TableCell>
                      <TableCell className="border-r border-black/20 whitespace-nowrap">{row.period2Label}</TableCell>
                      <TableCell className="tabular-nums border-r border-black/20 whitespace-nowrap">{formatNumber(row.tonnage2)}</TableCell>
                      <TableCell className={cn('tabular-nums whitespace-nowrap', className)}>
                        {text}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
    </Card>
  );
}