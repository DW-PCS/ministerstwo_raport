import { toast } from '@/components/ui/use-toast';
import type { ChainRow } from '@/hooks/useComparisonData';
import { BRAND_DARK, BRAND_LIGHT, BRAND_PRIMARY } from '@/lib/helpers/report-download/constants';
import { buildDocxDocument, buildPdfDefinition } from '@/lib/helpers/report-download/documentTemplate';
import { fetchImageAsDataUrl, fetchImageAsUint8Array } from '@/lib/helpers/report-download/visualUtils';
import {
  AlignmentType,
  BorderStyle,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from 'docx';
import { saveAs } from 'file-saver';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import * as XLSX from 'xlsx-js-style';

const HEADERS = ['Port', 'Grupa towarowa', 'Okres', 'Tonaż [t]', 'Zmiana'];
const COVER_TITLE = 'Raport porównawczy';

function buildFilename(format: string, firstLabel: string, lastLabel: string): string {
  const normalize = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/ł/g, 'l')
      .replace(/Ł/g, 'L')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  const from = normalize(firstLabel);
  const to = normalize(lastLabel);
  const range = from === to ? from : `${from}_${to}`;
  return `raport-porownawczy_${range}.${format}`;
}

function formatChange(change: number | null): string {
  if (change === null) return '–';
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
}

function toRows(chainRows: ChainRow[]): string[][] {
  return chainRows.map(row => [
    row.port,
    row.group,
    row.periodLabel,
    String(row.tonnage),
    formatChange(row.change),
  ]);
}

export function exportComparisonCsv(chainRows: ChainRow[], firstLabel: string, lastLabel: string): void {
  try {
    const rows = toRows(chainRows);
    const csvRows = [HEADERS, ...rows].map(row => row.join(','));
    const csvContent = `﻿${csvRows.join('\n')}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', buildFilename('csv', firstLabel, lastLabel));
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: 'Pobrano raport CSV' });
  } catch {
    toast({ title: 'Błąd pobierania', description: 'Nie udało się wygenerować pliku CSV.', variant: 'destructive' });
  }
}

export function exportComparisonXlsx(chainRows: ChainRow[], firstLabel: string, lastLabel: string): void {
  try {
    const rows = toRows(chainRows);

    const headerStyle = {
      font: { bold: true },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      fill: { patternType: 'solid', fgColor: { rgb: 'D9D9D9' } },
      border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } },
    };
    const cellStyle = {
      alignment: { horizontal: 'center', vertical: 'center' },
      border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } },
    };
    const leftCellStyle = {
      alignment: { horizontal: 'left', vertical: 'center' },
      border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } },
    };

    const sheet: XLSX.WorkSheet = {};
    const setCell = (row: number, col: number, value: string, style: object) => {
      const ref = XLSX.utils.encode_cell({ r: row, c: col });
      sheet[ref] = { t: 's', v: value, s: style };
    };

    HEADERS.forEach((header, col) => setCell(0, col, header, headerStyle));
    rows.forEach((row, rowIdx) => {
      row.forEach((cell, col) => setCell(rowIdx + 1, col, cell, col === 0 ? leftCellStyle : cellStyle));
    });

    const rowCount = rows.length + 1;
    sheet['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rowCount - 1, c: HEADERS.length - 1 } });
    sheet['!cols'] = [{ wch: 28 }, { wch: 28 }, { wch: 22 }, { wch: 16 }, { wch: 12 }];
    sheet['!rows'] = Array.from({ length: rowCount }, () => ({ hpt: 22 }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, 'Raport porównawczy');
    XLSX.writeFile(workbook, buildFilename('xlsx', firstLabel, lastLabel), { cellStyles: true });
    toast({ title: 'Pobrano raport XLSX' });
  } catch {
    toast({ title: 'Błąd pobierania', description: 'Nie udało się wygenerować pliku XLSX.', variant: 'destructive' });
  }
}

export async function exportComparisonPdf(chainRows: ChainRow[], title: string, firstLabel: string, lastLabel: string): Promise<void> {
  try {
    const rows = toRows(chainRows);

    const [logoDataUrl, headerLogoDataUrl] = await Promise.all([
      fetchImageAsDataUrl('/05_znak_uproszczony_kolor_biale_tlo.png'),
      fetchImageAsDataUrl('/10_znak_bez_orla_kolor_ciemne_tlo.png'),
    ]);

    const pdfMakeClient = pdfMake as unknown as {
      vfs: Record<string, string>;
      createPdf: (definition: Record<string, unknown>) => { download: (fileName: string) => void };
    };
    const pdfFontsClient = pdfFonts as unknown as { vfs: Record<string, string> };
    pdfMakeClient.vfs = pdfFontsClient.vfs;

    const mainTableContent = {
      table: {
        headerRows: 1,
        widths: ['*', '*', 'auto', 'auto', 'auto'],
        body: [
          HEADERS.map((header, i) => ({
            text: header,
            color: '#ffffff',
            bold: true,
            fontSize: 9,
            alignment: i < 3 ? 'left' : 'right',
            fillColor: BRAND_PRIMARY,
            margin: i < 3 ? [4, 4, 4, 4] : [10, 4, 0, 4],
            noWrap: i >= 3,
          })),
          ...rows.map((row, rowIdx) =>
            row.map((cell, cellIdx) => ({
              text: cell,
              fontSize: 9,
              alignment: cellIdx < 3 ? 'left' : 'right',
              fillColor: rowIdx % 2 === 0 ? '#f5f3ff' : undefined,
              margin: cellIdx < 3 ? [4, 3, 4, 3] : [10, 3, 0, 3],
              noWrap: cellIdx >= 3,
            }))
          ),
        ],
      },
      layout: {
        hLineColor: () => '#c4b5fd',
        vLineColor: () => '#c4b5fd',
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
      },
    };

    const definition = buildPdfDefinition({
      coverTitle: COVER_TITLE,
      coverSubtitle: title,
      periodText: title,
      mainTableContent,
      logoDataUrl,
      headerLogoDataUrl,
    });

    pdfMakeClient.createPdf(definition).download(buildFilename('pdf', firstLabel, lastLabel));
    toast({ title: 'Pobrano raport PDF' });
  } catch {
    toast({ title: 'Błąd pobierania', description: 'Nie udało się wygenerować pliku PDF.', variant: 'destructive' });
  }
}

export async function exportComparisonDocx(chainRows: ChainRow[], title: string, firstLabel: string, lastLabel: string): Promise<void> {
  try {
    const rows = toRows(chainRows);

    const [logoBytes, headerLogoBytes] = await Promise.all([
      fetchImageAsUint8Array('/05_znak_uproszczony_kolor_biale_tlo.png'),
      fetchImageAsUint8Array('/10_znak_bez_orla_kolor_ciemne_tlo.png'),
    ]);

    const brandPrimaryHex = BRAND_PRIMARY.replace('#', '');
    const slateHex = 'CBD5E1';

    const headerRow = new TableRow({
      children: HEADERS.map((header, i) =>
        new TableCell({
          shading: { type: ShadingType.SOLID, color: brandPrimaryHex, fill: brandPrimaryHex },
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 60, bottom: 60, right: 30 },
          children: [new Paragraph({
            alignment: i < 3 ? AlignmentType.LEFT : AlignmentType.RIGHT,
            indent: i >= 3 ? { right: 80 } : undefined,
            children: [new TextRun({ text: header, bold: true, color: 'FFFFFF', size: 18 })],
          })],
        })
      ),
    });

    const dataRows = rows.map((row, rowIdx) =>
      new TableRow({
        children: row.map((cell, cellIdx) =>
          new TableCell({
            shading: rowIdx % 2 === 0
              ? { type: ShadingType.SOLID, color: 'F5F3FF', fill: 'F5F3FF' }
              : undefined,
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 60, bottom: 60, right: 30 },
            children: [new Paragraph({
              alignment: cellIdx < 3 ? AlignmentType.LEFT : AlignmentType.RIGHT,
              indent: cellIdx >= 3 ? { right: 80 } : undefined,
              children: [new TextRun({ text: cell, size: 18, color: BRAND_DARK.replace('#', '') })],
            })],
          })
        ),
      })
    );

    const DOCX_PAGE_WIDTH = 10906;
    const NATURAL_WIDTHS = [2800, 2800, 1600, 1200, 1000];
    const naturalTotal = NATURAL_WIDTHS.reduce((a, b) => a + b, 0);
    const scale = DOCX_PAGE_WIDTH / naturalTotal;
    const columnWidths = NATURAL_WIDTHS.map((w) => Math.floor(w * scale));
    const scaledSum = columnWidths.reduce((a, b) => a + b, 0);
    columnWidths[columnWidths.length - 1] += DOCX_PAGE_WIDTH - scaledSum;

    const reportTable = new Table({
      rows: [headerRow, ...dataRows],
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      columnWidths,
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: slateHex },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: slateHex },
        left: { style: BorderStyle.SINGLE, size: 4, color: slateHex },
        right: { style: BorderStyle.SINGLE, size: 4, color: slateHex },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: slateHex },
        insideVertical: { style: BorderStyle.SINGLE, size: 2, color: slateHex },
      },
    });

    const doc = buildDocxDocument({
      coverTitle: COVER_TITLE,
      coverSubtitle: title,
      periodText: title,
      mainTable: reportTable,
      logoBytes,
      headerLogoBytes,
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, buildFilename('docx', firstLabel, lastLabel));
    toast({ title: 'Pobrano raport Word' });
  } catch {
    toast({ title: 'Błąd pobierania', description: 'Nie udało się wygenerować pliku Word.', variant: 'destructive' });
  }
}
