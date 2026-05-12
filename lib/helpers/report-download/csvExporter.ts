import { toast } from '@/components/ui/use-toast';
import { ExportBaseOptions, ProcessedData } from '@/lib/helpers/report-download/types';

interface CsvExportOptions extends ExportBaseOptions {
  processData: () => ProcessedData;
}

export function exportCsv({
  isDownloadEnabled,
  processData,
  getFilename,
  startDate,
  endDate,
}: CsvExportOptions): void {
  if (!isDownloadEnabled) return;

  try {
    const { headers, rows, totalsRow } = processData();
    const csvRows = [headers, ...rows, totalsRow].map(row => row.join(','));
    const csvContent = `\uFEFF${csvRows.join('\n')}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', getFilename('csv', startDate, endDate));
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: 'Pobrano raport CSV' });
  } catch (error) {
    console.error('Error generating CSV:', error);
    toast({
      title: 'Błąd pobierania',
      description: 'Nie udało się wygenerować pliku CSV.',
      variant: 'destructive',
    });
  }
}
