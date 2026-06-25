import { toast } from "@/components/ui/use-toast";
import { formatNumber } from "@/lib/helpers/format-helpers";
import { BRAND_PRIMARY, ENABLE_MONTHLY_SECTIONS_IN_PDF_AND_DOCX } from "@/lib/helpers/report-download/constants";
import { buildDocxDocument } from "@/lib/helpers/report-download/documentTemplate";
import { buildMonthlyTableSections } from "@/lib/helpers/report-download/monthlyTables";
import { PdfDocxBaseOptions } from "@/lib/helpers/report-download/types";
import {
  buildChartImages,
  dataUrlToUint8ArrayFn,
  fetchImageAsUint8Array,
} from "@/lib/helpers/report-download/visualUtils";
import {
  AlignmentType,
  BorderStyle,
  HeadingLevel,
  ImageRun,
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
} from "docx";
import { saveAs } from "file-saver";

export async function exportDocx({
  isDownloadEnabled,
  processData,
  formatPeriodText,
  getFilename,
  includeCharts,
  selectedChartTypes,
  submittedPorts,
  submittedCommodities,
  rawData,
  showTrendLine,
  trendType,
  startDate,
  endDate,
}: PdfDocxBaseOptions): Promise<void> {
  if (!isDownloadEnabled) return;

  try {
    const processedData = processData();
    const periodText = formatPeriodText(startDate, endDate);
    const chartImages =
      includeCharts && selectedChartTypes.length > 0
        ? await buildChartImages(processedData, selectedChartTypes, { rawData, showTrendLine, trendType })
        : [];
    const monthlySections = ENABLE_MONTHLY_SECTIONS_IN_PDF_AND_DOCX
      ? await buildMonthlyTableSections(submittedPorts, submittedCommodities, endDate)
      : [];

    const [logoBytes, , headerLogoBytes] = await Promise.all([
      fetchImageAsUint8Array("/05_znak_uproszczony_kolor_biale_tlo.png"),
      fetchImageAsUint8Array("/14_znak_skrot_kolor_ciemne_tlo.png"),
      fetchImageAsUint8Array("/10_znak_bez_orla_kolor_ciemne_tlo.png"),
    ]);

    const brandPrimaryHex = BRAND_PRIMARY.replace("#", "");
    const brandLightHex = "E8E4F5";
    const slateHex = "CBD5E1";
    const darkHex = "0F172A";

    const headerRow = new TableRow({
      children: processedData.headers.map(
        (header, headerIndex) =>
          new TableCell({
            shading: { type: ShadingType.SOLID, color: brandPrimaryHex, fill: brandPrimaryHex },
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 60, bottom: 60, right: 30 },
            children: [
              new Paragraph({
                alignment: headerIndex === 0 ? AlignmentType.LEFT : AlignmentType.RIGHT,
                indent: headerIndex === 0 ? undefined : { right: 80 },
                children: [
                  new TextRun({
                    text: headerIndex === 0 ? String(header) : `${String(header)} [t]`,
                    bold: true,
                    color: "FFFFFF",
                    size: 18,
                  }),
                ],
              }),
            ],
          }),
      ),
    });

    const dataRows = processedData.rows.map(
      (row, rowIndex) =>
        new TableRow({
          children: row.map(
            (cell, cellIndex) =>
              new TableCell({
                shading:
                  rowIndex % 2 === 0
                    ? { type: ShadingType.SOLID, color: "F5F3FF", fill: "F5F3FF" }
                    : undefined,
                verticalAlign: VerticalAlign.CENTER,
                margins: { top: 60, bottom: 60, right: 30 },
                children: [
                  new Paragraph({
                    alignment: cellIndex === 0 ? AlignmentType.LEFT : AlignmentType.RIGHT,
                    indent: cellIndex === 0 ? undefined : { right: 80 },
                    children: [
                      new TextRun({
                        text: cellIndex === 0 ? String(cell) : formatNumber(Number(cell)),
                        size: 18,
                      }),
                    ],
                  }),
                ],
              }),
          ),
        }),
    );

    const totalsRow = new TableRow({
      children: processedData.totalsRow.map(
        (cell, cellIndex) =>
          new TableCell({
            shading: { type: ShadingType.SOLID, color: brandLightHex, fill: brandLightHex },
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 60, bottom: 60, right: 30 },
            children: [
              new Paragraph({
                alignment: cellIndex === 0 ? AlignmentType.LEFT : AlignmentType.RIGHT,
                indent: cellIndex === 0 ? undefined : { right: 80 },
                children: [
                  new TextRun({
                    text: cellIndex === 0 ? String(cell) : formatNumber(Number(cell)),
                    bold: true,
                    size: 18,
                    color: darkHex,
                  }),
                ],
              }),
            ],
          }),
      ),
    });

    const DOCX_NUMBER_CHAR_WIDTH = 120;
    const DOCX_HEADER_CHAR_WIDTH = 100;
    const DOCX_TEXT_CHAR_WIDTH = 105;
    const DOCX_CELL_PADDING = 216;
    const DOCX_PAGE_WIDTH = 10906;
    const DOCX_MIN_COL0 = 1200;

    const docxCol0Texts = [
      ...processedData.rows.map((row) => String(row[0])),
      String(processedData.totalsRow[0]),
    ];
    const docxCol0MaxLen = Math.max(
      ...docxCol0Texts.map((v) => v.length),
      String(processedData.headers[0]).length,
    );
    const docxCol0NaturalWidth = Math.max(
      Math.ceil(docxCol0MaxLen * DOCX_TEXT_CHAR_WIDTH + DOCX_CELL_PADDING),
      DOCX_MIN_COL0,
    );

    const docxNumColWidths = processedData.headers.slice(1).map((header, idx) => {
      const i = idx + 1;
      const headerLen = `${String(header)} [t]`.length;
      const allNumbers = [
        ...processedData.rows.map((row) => formatNumber(Number(row[i]))),
        formatNumber(Number(processedData.totalsRow[i])),
      ];
      const maxNumLen = Math.max(...allNumbers.map((v) => v.length));
      return Math.ceil(
        Math.max(maxNumLen * DOCX_NUMBER_CHAR_WIDTH, headerLen * DOCX_HEADER_CHAR_WIDTH) + DOCX_CELL_PADDING,
      );
    });

    const allNaturalWidths = [docxCol0NaturalWidth, ...docxNumColWidths];
    const naturalTotal = allNaturalWidths.reduce((a, b) => a + b, 0);
    const docxScale = DOCX_PAGE_WIDTH / naturalTotal;
    const docxColumnWidths = allNaturalWidths.map((w) => Math.floor(w * docxScale));
    const scaledSum = docxColumnWidths.reduce((a, b) => a + b, 0);
    docxColumnWidths[docxColumnWidths.length - 1] += DOCX_PAGE_WIDTH - scaledSum;

    const reportTable = new Table({
      rows: [headerRow, ...dataRows, totalsRow],
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      columnWidths: docxColumnWidths,
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: slateHex },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: slateHex },
        left: { style: BorderStyle.SINGLE, size: 4, color: slateHex },
        right: { style: BorderStyle.SINGLE, size: 4, color: slateHex },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: slateHex },
        insideVertical: { style: BorderStyle.SINGLE, size: 2, color: slateHex },
      },
    });

    const mkHeaderCell = (text: string) =>
      new TableCell({
        shading: { type: ShadingType.SOLID, color: "FFFFFF", fill: "FFFFFF" },
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text, bold: true, size: 16 })],
        })],
      });

    const mkValueCell = (
      text: string,
      alignment: (typeof AlignmentType)[keyof typeof AlignmentType],
      isTotalRow: boolean,
      bold = false,
    ) =>
      new TableCell({
        shading: isTotalRow
          ? { type: ShadingType.SOLID, color: "FFF9CC", fill: "FFF9CC" }
          : undefined,
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({
          alignment,
          children: [new TextRun({ text, bold, size: 16 })],
        })],
      });

    const monthlyTablesDocx = monthlySections.flatMap((section) => {
      const monthlyHeaderRow = new TableRow({
        children: [
          mkHeaderCell("Lp."),
          mkHeaderCell("Grupa towarowa"),
          mkHeaderCell(`${section.previousYear} ${section.monthName}`),
          mkHeaderCell(`${section.previousYear} ${section.ytdLabel}`),
          mkHeaderCell(`${section.currentYear} ${section.monthName}`),
          mkHeaderCell(`${section.currentYear} ${section.ytdLabel}`),
          mkHeaderCell("5:3"),
          mkHeaderCell("6:4"),
        ],
      });

      const monthlyDataRows = section.rows.map(
        (row) =>
          new TableRow({
            children: [
              mkValueCell(row.lp || "", AlignmentType.CENTER, row.isTotalRow, row.isTotalRow),
              mkValueCell(row.label, AlignmentType.LEFT, row.isTotalRow, row.isTotalRow),
              mkValueCell(formatNumber(row.prevMonth), AlignmentType.RIGHT, row.isTotalRow, row.isTotalRow),
              mkValueCell(formatNumber(row.prevYtd), AlignmentType.RIGHT, row.isTotalRow, row.isTotalRow),
              mkValueCell(formatNumber(row.currMonth), AlignmentType.RIGHT, row.isTotalRow, row.isTotalRow),
              mkValueCell(formatNumber(row.currYtd), AlignmentType.RIGHT, row.isTotalRow, row.isTotalRow),
              mkValueCell(formatNumber(row.ratioMonth), AlignmentType.RIGHT, row.isTotalRow, row.isTotalRow),
              mkValueCell(formatNumber(row.ratioYtd), AlignmentType.RIGHT, row.isTotalRow, row.isTotalRow),
            ],
          }),
      );

      const monthlyTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        columnWidths: [700, 3300, 1000, 1000, 1000, 1000, 850, 850],
        rows: [monthlyHeaderRow, ...monthlyDataRows],
        borders: {
          top: { style: BorderStyle.SINGLE, size: 4, color: "8A8A8A" },
          bottom: { style: BorderStyle.SINGLE, size: 4, color: "8A8A8A" },
          left: { style: BorderStyle.SINGLE, size: 4, color: "8A8A8A" },
          right: { style: BorderStyle.SINGLE, size: 4, color: "8A8A8A" },
          insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: "8A8A8A" },
          insideVertical: { style: BorderStyle.SINGLE, size: 2, color: "8A8A8A" },
        },
      });

      return [
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 280, after: 120 },
          children: [new TextRun({ text: section.title, color: brandPrimaryHex, bold: true, size: 22 })],
        }),
        monthlyTable,
      ];
    });

    const chartContentDocx = chartImages.flatMap((chart, chartIndex) => [
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        pageBreakBefore: chartIndex === 0,
        spacing: { before: 480, after: 160 },
        children: [new TextRun({ text: chart.title, color: brandPrimaryHex, bold: true, size: 26 })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
        children: [
          new ImageRun({
            data: dataUrlToUint8ArrayFn(chart.image),
            type: "png",
            transformation: { width: 620, height: 340 },
          }),
        ],
      }),
    ]);

    const doc = buildDocxDocument({
      coverTitle: "Raport obrotów portowych",
      coverSubtitle: periodText.replace("Okres: ", ""),
      periodText,
      mainTable: reportTable,
      additionalContent: [...monthlyTablesDocx, ...chartContentDocx],
      logoBytes,
      headerLogoBytes,
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, getFilename("docx", startDate, endDate));
    toast({ title: "Pobrano raport Word" });
  } catch (error) {
    console.error("Error generating Word document:", error);
    toast({
      title: "Błąd pobierania",
      description: "Nie udało się wygenerować pliku Word.",
      variant: "destructive",
    });
  }
}
