import { toast } from '@/components/ui/use-toast';
import { ExportBaseOptions, ProcessedData } from '@/lib/helpers/report-download/types';
import * as XLSX from 'xlsx-js-style';

interface XlsxExportOptions extends ExportBaseOptions {
  processData: () => ProcessedData;
}

export async function exportXlsx({
  isDownloadEnabled,
  processData,
  getFilename,
  startDate,
  endDate,
}: XlsxExportOptions): Promise<void> {
  if (!isDownloadEnabled) return;

  try {
    const { headers, rows, totalsRow } = processData();

    const headerStyle = {
      font: { bold: true },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      fill: { patternType: 'solid', fgColor: { rgb: 'D9D9D9' } },
      border: {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      },
    };

    const totalStyle = {
      font: { bold: true },
      alignment: { horizontal: 'center', vertical: 'center' },
      fill: { patternType: 'solid', fgColor: { rgb: 'FFF9CC' } },
      border: {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      },
    };

    const cellStyle = {
      alignment: { horizontal: 'center', vertical: 'center' },
      border: {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      },
    };

    const leftCellStyle = {
      alignment: { horizontal: 'left', vertical: 'center' },
      border: {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      },
    };

    const leftTotalStyle = {
      font: { bold: true },
      alignment: { horizontal: 'left', vertical: 'center' },
      fill: { patternType: 'solid', fgColor: { rgb: 'FFF9CC' } },
      border: {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      },
    };

    const sheet: XLSX.WorkSheet = {};

    const setCell = (row: number, col: number, value: string | number, style: object) => {
      const ref = XLSX.utils.encode_cell({ r: row, c: col });
      if (typeof value === 'number') {
        sheet[ref] = { t: 'n', v: value, s: style };
      } else {
        sheet[ref] = { t: 's', v: value, s: style };
      }
    };

    headers.forEach((header, col) => {
      setCell(0, col, header, headerStyle);
    });

    rows.forEach((row, rowIdx) => {
      row.forEach((cell, col) => {
        setCell(rowIdx + 1, col, cell, col === 0 ? leftCellStyle : cellStyle);
      });
    });

    totalsRow.forEach((cell, col) => {
      setCell(rows.length + 1, col, cell, col === 0 ? leftTotalStyle : totalStyle);
    });

    const colCount = headers.length;
    const rowCount = rows.length + 2;

    sheet['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rowCount - 1, c: colCount - 1 } });
    sheet['!cols'] = [{ wch: 28 }, ...Array(colCount - 1).fill({ wch: 18 })];
    sheet['!rows'] = Array.from({ length: rowCount }, () => ({ hpt: 22 }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, 'Raport');

    XLSX.writeFile(workbook, getFilename('xlsx', startDate, endDate), { cellStyles: true });

    toast({ title: 'Pobrano raport XLSX' });
  } catch (error) {
    console.error('Error generating XLSX:', error);
    toast({
      title: 'Błąd pobierania',
      description: 'Nie udało się wygenerować pliku XLSX.',
      variant: 'destructive',
    });
  }
}
