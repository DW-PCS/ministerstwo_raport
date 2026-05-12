import { toast } from '@/components/ui/use-toast';
import { formatNumber } from '@/lib/helpers/format-helpers';
import {
  BRAND_DARK,
  BRAND_LIGHT,
  BRAND_PRIMARY,
  ENABLE_MONTHLY_SECTIONS_IN_PDF_AND_DOCX,
} from '@/lib/helpers/report-download/constants';
import { buildMonthlyTableSections } from '@/lib/helpers/report-download/monthlyTables';
import { PdfDocxBaseOptions } from '@/lib/helpers/report-download/types';
import { buildChartImages, fetchImageAsDataUrl } from '@/lib/helpers/report-download/visualUtils';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

export async function exportPdf({
  isDownloadEnabled,
  processData,
  formatPeriodText,
  getFilename,
  includeCharts,
  selectedChartTypes,
  submittedPorts,
  submittedCommodities,
  startDate,
  endDate,
}: PdfDocxBaseOptions): Promise<void> {
  if (!isDownloadEnabled) return;

  try {
    const processedData = processData();
    const periodText = formatPeriodText(startDate, endDate);
    const chartImages =
      includeCharts && selectedChartTypes.length > 0
        ? await buildChartImages(processedData, selectedChartTypes)
        : [];
    const monthlySections = ENABLE_MONTHLY_SECTIONS_IN_PDF_AND_DOCX
      ? await buildMonthlyTableSections(submittedPorts, submittedCommodities, endDate)
      : [];

    const [logoDataUrl, headerLogoDataUrl] = await Promise.all([
      fetchImageAsDataUrl('/05_znak_uproszczony_kolor_biale_tlo.png'),
      fetchImageAsDataUrl('/10_znak_bez_orla_kolor_ciemne_tlo.png'),
    ]);

    const pdfMakeClient = pdfMake as unknown as {
      vfs: Record<string, string>;
      createPdf: (definition: Record<string, unknown>) => {
        download: (fileName: string) => void;
      };
    };
    const pdfFontsClient = pdfFonts as unknown as { vfs: Record<string, string> };
    pdfMakeClient.vfs = pdfFontsClient.vfs;

    const pdfChartWidth = 500;
    const chartHeight = 220;

    const compactChartsContent: unknown[] = [];
    for (let i = 0; i < chartImages.length; i++) {
      const isFirstOnPage = i === 0 || i % 2 === 0;
      compactChartsContent.push({
        stack: [
          { text: chartImages[i].title, style: 'chartTitle', margin: [0, 0, 0, 8] },
          {
            image: chartImages[i].image,
            fit: [pdfChartWidth, chartHeight],
            alignment: 'center',
          },
        ],
        margin: [0, isFirstOnPage ? 0 : 80, 0, 0],
        ...(isFirstOnPage ? { pageBreak: 'before' } : {}),
      });
    }

    const monthlyTablesContent: unknown[] = [];
    for (const section of monthlySections) {
      monthlyTablesContent.push(
        { text: section.title, style: 'chartTitle', margin: [0, 14, 0, 8] },
        {
          table: {
            headerRows: 3,
            widths: [26, '*', 48, 48, 48, 48, 36, 36],
            body: [
              [
                { text: 'Lp.', rowSpan: 3, style: 'monthlyHeader' },
                { text: 'Grupa towarowa', rowSpan: 3, style: 'monthlyHeader' },
                { text: `${section.previousYear}`, colSpan: 2, style: 'monthlyHeader' },
                { text: '', style: 'monthlyHeader' },
                { text: `${section.currentYear}`, colSpan: 2, style: 'monthlyHeader' },
                { text: '', style: 'monthlyHeader' },
                { text: '%', colSpan: 2, style: 'monthlyHeader' },
                { text: '', style: 'monthlyHeader' },
              ],
              [
                { text: '', style: 'monthlyHeader' },
                { text: '', style: 'monthlyHeader' },
                { text: section.monthName, style: 'monthlyHeader' },
                { text: section.ytdLabel, style: 'monthlyHeader' },
                { text: section.monthName, style: 'monthlyHeader' },
                { text: section.ytdLabel, style: 'monthlyHeader' },
                { text: '5:3', style: 'monthlyHeader' },
                { text: '6:4', style: 'monthlyHeader' },
              ],
              [
                { text: '', style: 'monthlyHeader' },
                { text: '', style: 'monthlyHeader' },
                { text: '3', style: 'monthlyHeader' },
                { text: '4', style: 'monthlyHeader' },
                { text: '5', style: 'monthlyHeader' },
                { text: '6', style: 'monthlyHeader' },
                { text: '7', style: 'monthlyHeader' },
                { text: '8', style: 'monthlyHeader' },
              ],
              ...section.rows.map(row => [
                { text: row.lp || '', style: row.isTotalRow ? 'monthlyTotal' : 'monthlyCell' },
                { text: row.label, style: row.isTotalRow ? 'monthlyTotalLeft' : 'monthlyLeft' },
                {
                  text: formatNumber(row.prevMonth),
                  style: row.isTotalRow ? 'monthlyTotal' : 'monthlyCell',
                },
                {
                  text: formatNumber(row.prevYtd),
                  style: row.isTotalRow ? 'monthlyTotal' : 'monthlyCell',
                },
                {
                  text: formatNumber(row.currMonth),
                  style: row.isTotalRow ? 'monthlyTotal' : 'monthlyCell',
                },
                {
                  text: formatNumber(row.currYtd),
                  style: row.isTotalRow ? 'monthlyTotal' : 'monthlyCell',
                },
                {
                  text: formatNumber(row.ratioMonth),
                  style: row.isTotalRow ? 'monthlyTotal' : 'monthlyCell',
                },
                {
                  text: formatNumber(row.ratioYtd),
                  style: row.isTotalRow ? 'monthlyTotal' : 'monthlyCell',
                },
              ]),
            ],
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => '#8A8A8A',
            vLineColor: () => '#8A8A8A',
          },
        }
      );
    }

    const definition = {
      pageSize: 'A4',
      pageMargins: [32, 72, 32, 64],
      header: (currentPage: number) => {
        if (currentPage === 1) return null;
        return {
          margin: [32, 8, 32, 0],
          table: {
            widths: [74, '*', 'auto'],
            body: [
              [
                {
                  image: headerLogoDataUrl,
                  width: 70,
                  height: 40,
                  margin: [0, 0, 0, 0],
                },
                { text: '', border: [false, false, false, false] },
                {
                  text: periodText,
                  style: 'headerPeriod',
                  alignment: 'right',
                  margin: [0, 12, 0, 0],
                },
              ],
            ],
          },
          layout: {
            hLineWidth: () => 0,
            vLineWidth: () => 0,
            paddingBottom: () => 6,
          },
        };
      },
      footer: (currentPage: number, pageCount: number) => ({
        margin: [32, 8, 32, 8],
        table: {
          widths: ['*', 'auto'],
          body: [
            [
              {
                text: 'Dane wygenerowane z systemów portowych.',
                style: 'footerText',
                margin: [0, 6, 0, 0],
              },
              {
                text: `Strona ${currentPage} / ${pageCount}`,
                style: 'footerPage',
                alignment: 'right',
                margin: [0, 6, 0, 0],
              },
            ],
          ],
        },
        layout: {
          hLineWidth: (i: number) => (i === 0 ? 1 : 0),
          vLineWidth: () => 0,
          hLineColor: () => '#cbd5e1',
          paddingTop: () => 4,
        },
      }),
      content: [
        {
          table: {
            widths: ['*'],
            body: [
              [
                {
                  stack: [
                    {
                      image: logoDataUrl,
                      width: 168,
                      height: 72,
                      alignment: 'center',
                      margin: [0, 0, 0, 4],
                    },
                    {
                      text: 'Departament Gospodarki Morskiej i Żeglugi Śródlądowej',
                      style: 'coverDept',
                      alignment: 'center',
                      margin: [0, 0, 0, 16],
                      fontSize: 11,
                    },
                    {
                      text: 'Raport obrotów portowych',
                      style: 'coverTitle',
                      alignment: 'center',
                    },
                    {
                      text: periodText.replace('Okres: ', ''),
                      style: 'coverPeriod',
                      alignment: 'center',
                      margin: [0, 8, 0, 0],
                    },
                  ],
                  fillColor: BRAND_LIGHT,
                  margin: [24, 24, 24, 24],
                  border: [false, false, false, false],
                },
              ],
            ],
          },
          layout: 'noBorders',
          margin: [0, -42, 0, 24],
        },
        {
          table: {
            headerRows: 1,
            widths: ['*', ...processedData.commodityNames.map(() => 'auto')],
            body: [
              processedData.headers.map((header, headerIndex) => ({
                text: headerIndex === 0 ? String(header) : `${String(header)} [t]`,
                color: '#ffffff',
                bold: true,
                fontSize: 9,
                alignment: headerIndex === 0 ? 'left' : 'right',
                fillColor: BRAND_PRIMARY,
                margin: [4, 4, 4, 4],
              })),
              ...processedData.rows.map((row, rowIndex) =>
                row.map((cell, cellIndex) => ({
                  text: cellIndex === 0 ? String(cell) : formatNumber(Number(cell)),
                  fontSize: 9,
                  alignment: cellIndex === 0 ? 'left' : 'right',
                  fillColor: rowIndex % 2 === 0 ? '#f5f3ff' : undefined,
                  margin: [4, 3, 4, 3],
                }))
              ),
              processedData.totalsRow.map((cell, cellIndex) => ({
                text: cellIndex === 0 ? String(cell) : formatNumber(Number(cell)),
                bold: true,
                fontSize: 9,
                alignment: cellIndex === 0 ? 'left' : 'right',
                fillColor: BRAND_LIGHT,
                color: BRAND_DARK,
                margin: [4, 4, 4, 4],
              })),
            ],
          },
          layout: {
            hLineColor: () => '#c4b5fd',
            vLineColor: () => '#c4b5fd',
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
          },
        },
        ...monthlyTablesContent,
        ...compactChartsContent,
      ],
      defaultStyle: { font: 'Roboto', fontSize: 10, color: BRAND_DARK },
      styles: {
        coverTitle: { fontSize: 26, bold: true, color: BRAND_PRIMARY },
        coverPeriod: { fontSize: 14, color: '#374151' },
        coverMeta: { fontSize: 10, color: '#6b7280' },
        coverOrg: { fontSize: 11, bold: true, color: BRAND_PRIMARY },
        coverDept: { fontSize: 9, color: '#6b7280', bold: true },
        coverSignatureLabel: { fontSize: 9, color: '#9ca3af', italics: true },
        headerOrg: { fontSize: 11, bold: true, color: BRAND_PRIMARY },
        headerSub: { fontSize: 9, color: '#374151' },
        headerPeriod: { fontSize: 9, color: '#6b7280' },
        footerText: { fontSize: 8, color: '#9ca3af' },
        footerPage: { fontSize: 9, bold: true, color: '#6b7280' },
        chartTitle: { fontSize: 12, bold: true, color: BRAND_PRIMARY },
        monthlyHeader: { fontSize: 8, bold: true, alignment: 'center', fillColor: '#ffffff' },
        monthlyCell: { fontSize: 8, alignment: 'right' },
        monthlyLeft: { fontSize: 8, alignment: 'left' },
        monthlyTotal: { fontSize: 8, alignment: 'right', bold: true, fillColor: '#FFF9CC' },
        monthlyTotalLeft: { fontSize: 8, alignment: 'left', bold: true, fillColor: '#FFF9CC' },
      },
    };

    pdfMakeClient.createPdf(definition).download(getFilename('pdf', startDate, endDate));
    toast({ title: 'Pobrano raport PDF' });
  } catch (error) {
    console.error('Error generating PDF:', error);
    toast({
      title: 'Błąd pobierania',
      description: 'Nie udało się wygenerować pliku PDF.',
      variant: 'destructive',
    });
  }
}
