import { toast } from "@/components/ui/use-toast";
import { formatNumber } from "@/lib/helpers/format-helpers";
import { ENABLE_MONTHLY_SECTIONS_IN_PDF_AND_DOCX } from "@/lib/helpers/report-download/constants";
import { buildPdfDefinition } from "@/lib/helpers/report-download/documentTemplate";
import { buildMonthlyTableSections } from "@/lib/helpers/report-download/monthlyTables";
import { PdfDocxBaseOptions } from "@/lib/helpers/report-download/types";
import {
  buildChartImages,
  fetchImageAsDataUrl,
} from "@/lib/helpers/report-download/visualUtils";
import { BRAND_DARK, BRAND_LIGHT, BRAND_PRIMARY } from "@/lib/helpers/report-download/constants";

export async function exportPdf({
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

    const [logoDataUrl, headerLogoDataUrl, pdfMakeModule, pdfFontsModule] = await Promise.all([
      fetchImageAsDataUrl("/05_znak_uproszczony_kolor_biale_tlo.png"),
      fetchImageAsDataUrl("/10_znak_bez_orla_kolor_ciemne_tlo.png"),
      import("pdfmake/build/pdfmake"),
      import("pdfmake/build/vfs_fonts"),
    ]);

    const pdfMakeClient = pdfMakeModule.default as unknown as {
      vfs: Record<string, string>;
      createPdf: (definition: Record<string, unknown>) => { download: (fileName: string) => void };
    };
    pdfMakeClient.vfs = (pdfFontsModule.default as unknown as { vfs: Record<string, string> }).vfs;

    const pdfChartWidth = 500;
    const chartHeight = 220;

    const compactChartsContent: unknown[] = [];
    for (let i = 0; i < chartImages.length; i++) {
      const isFirstOnPage = i === 0 || i % 2 === 0;
      compactChartsContent.push({
        stack: [
          { text: chartImages[i].title, style: "chartTitle", margin: [0, 0, 0, 8] },
          { image: chartImages[i].image, fit: [pdfChartWidth, chartHeight], alignment: "center" },
        ],
        margin: [0, isFirstOnPage ? 0 : 80, 0, 0],
        ...(isFirstOnPage ? { pageBreak: "before" } : {}),
      });
    }

    const monthlyTablesContent: unknown[] = [];
    for (const section of monthlySections) {
      monthlyTablesContent.push(
        { text: section.title, style: "chartTitle", margin: [0, 14, 0, 8] },
        {
          table: {
            headerRows: 3,
            body: [
              [
                { text: "Lp.", rowSpan: 3, style: "monthlyHeader" },
                { text: "Grupa towarowa", rowSpan: 3, style: "monthlyHeader" },
                { text: `${section.previousYear}`, colSpan: 2, style: "monthlyHeader" },
                { text: "", style: "monthlyHeader" },
                { text: `${section.currentYear}`, colSpan: 2, style: "monthlyHeader" },
                { text: "", style: "monthlyHeader" },
                { text: "%", colSpan: 2, style: "monthlyHeader" },
                { text: "", style: "monthlyHeader" },
              ],
              [
                { text: "", style: "monthlyHeader" },
                { text: "", style: "monthlyHeader" },
                { text: section.monthName, style: "monthlyHeader" },
                { text: section.ytdLabel, style: "monthlyHeader" },
                { text: section.monthName, style: "monthlyHeader" },
                { text: section.ytdLabel, style: "monthlyHeader" },
                { text: "5:3", style: "monthlyHeader" },
                { text: "6:4", style: "monthlyHeader" },
              ],
              [
                { text: "", style: "monthlyHeader" },
                { text: "", style: "monthlyHeader" },
                { text: "3", style: "monthlyHeader" },
                { text: "4", style: "monthlyHeader" },
                { text: "5", style: "monthlyHeader" },
                { text: "6", style: "monthlyHeader" },
                { text: "7", style: "monthlyHeader" },
                { text: "8", style: "monthlyHeader" },
              ],
              ...section.rows.map((row) => [
                { text: row.lp || "", style: row.isTotalRow ? "monthlyTotal" : "monthlyCell" },
                { text: row.label, style: row.isTotalRow ? "monthlyTotalLeft" : "monthlyLeft" },
                { text: formatNumber(row.prevMonth), style: row.isTotalRow ? "monthlyTotal" : "monthlyCell" },
                { text: formatNumber(row.prevYtd), style: row.isTotalRow ? "monthlyTotal" : "monthlyCell" },
                { text: formatNumber(row.currMonth), style: row.isTotalRow ? "monthlyTotal" : "monthlyCell" },
                { text: formatNumber(row.currYtd), style: row.isTotalRow ? "monthlyTotal" : "monthlyCell" },
                { text: formatNumber(row.ratioMonth), style: row.isTotalRow ? "monthlyTotal" : "monthlyCell" },
                { text: formatNumber(row.ratioYtd), style: row.isTotalRow ? "monthlyTotal" : "monthlyCell" },
              ]),
            ],
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => "#8A8A8A",
            vLineColor: () => "#8A8A8A",
          },
        },
      );
    }

    const tableWidths = ["*", ...processedData.headers.slice(1).map(() => "auto")];

    const mainTableContent = {
      table: {
        headerRows: 1,
        widths: tableWidths,
        body: [
          processedData.headers.map((header, headerIndex) => ({
            text: headerIndex === 0 ? String(header) : `${String(header)} [t]`,
            color: "#ffffff",
            bold: true,
            fontSize: 9,
            alignment: headerIndex === 0 ? "left" : "right",
            fillColor: BRAND_PRIMARY,
            margin: headerIndex === 0 ? [4, 4, 4, 4] : [10, 4, 0, 4],
            noWrap: headerIndex !== 0,
          })),
          ...processedData.rows.map((row, rowIndex) =>
            row.map((cell, cellIndex) => ({
              text: cellIndex === 0 ? String(cell) : formatNumber(Number(cell)),
              fontSize: 9,
              alignment: cellIndex === 0 ? "left" : "right",
              fillColor: rowIndex % 2 === 0 ? "#f5f3ff" : undefined,
              margin: cellIndex === 0 ? [4, 3, 4, 3] : [10, 3, 0, 3],
              noWrap: cellIndex !== 0,
            })),
          ),
          ...(processedData.totalsRow.length > 0 ? [processedData.totalsRow.map((cell, cellIndex) => ({
            text: cellIndex === 0 ? String(cell) : formatNumber(Number(cell)),
            bold: true,
            fontSize: 9,
            alignment: cellIndex === 0 ? "left" : "right",
            fillColor: BRAND_LIGHT,
            color: BRAND_DARK,
            margin: cellIndex === 0 ? [4, 4, 4, 4] : [8, 4, 0, 4],
            noWrap: cellIndex !== 0,
          }))] : []),
        ],
      },
      layout: {
        hLineColor: () => "#c4b5fd",
        vLineColor: () => "#c4b5fd",
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
      },
    };

    const definition = buildPdfDefinition({
      coverTitle: "Raport obrotów portowych",
      coverSubtitle: periodText.replace("Okres: ", ""),
      periodText,
      mainTableContent,
      additionalContent: [...monthlyTablesContent, ...compactChartsContent],
      logoDataUrl,
      headerLogoDataUrl,
    });

    pdfMakeClient.createPdf(definition).download(getFilename("pdf", startDate, endDate));
    toast({ title: "Pobrano raport PDF" });
  } catch (error) {
    console.error("Error generating PDF:", error);
    toast({
      title: "Błąd pobierania",
      description: "Nie udało się wygenerować pliku PDF.",
      variant: "destructive",
    });
  }
}
