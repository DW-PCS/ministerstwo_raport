import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  PageNumber,
  Paragraph,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from 'docx';
import { BRAND_DARK, BRAND_LIGHT, BRAND_PRIMARY } from './constants';

const COVER_DEPT = 'Departament Gospodarki Morskiej i Żeglugi Śródlądowej';

export interface PdfDocumentOptions {
  coverTitle: string;
  coverSubtitle: string;
  periodText: string;
  mainTableContent: object;
  additionalContent?: unknown[];
  logoDataUrl: string;
  headerLogoDataUrl: string;
}

export interface DocxDocumentOptions {
  coverTitle: string;
  coverSubtitle: string;
  periodText: string;
  mainTable: Table;
  additionalContent?: (Paragraph | Table)[];
  logoBytes: Uint8Array;
  headerLogoBytes: Uint8Array;
}

export function buildPdfDefinition({
  coverTitle,
  coverSubtitle,
  periodText,
  mainTableContent,
  additionalContent = [],
  logoDataUrl,
  headerLogoDataUrl,
}: PdfDocumentOptions): Record<string, unknown> {
  return {
    pageSize: 'A4',
    pageMargins: [16, 72, 16, 64],
    header: (currentPage: number) => {
      if (currentPage === 1) return null;
      return {
        margin: [16, 8, 16, 0],
        table: {
          body: [[
            { image: headerLogoDataUrl, width: 70, height: 40, margin: [0, 0, 0, 0] },
            { text: '', border: [false, false, false, false] },
            { text: periodText, style: 'headerPeriod', alignment: 'right', margin: [0, 12, 0, 0] },
          ]],
        },
        layout: { hLineWidth: () => 0, vLineWidth: () => 0, paddingBottom: () => 6 },
      };
    },
    footer: (currentPage: number, pageCount: number) => ({
      margin: [16, 8, 16, 8],
      table: {
        widths: ['*', 'auto'],
        body: [[
          { text: 'Dane wygenerowane z systemów portowych.', style: 'footerText', margin: [0, 6, 0, 0] },
          { text: `Strona ${currentPage} / ${pageCount}`, style: 'footerPage', alignment: 'right', margin: [0, 6, 0, 0] },
        ]],
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
          body: [[{
            stack: [
              { image: logoDataUrl, width: 168, height: 72, alignment: 'center', margin: [0, 0, 0, 4] },
              { text: COVER_DEPT, style: 'coverDept', alignment: 'center', margin: [0, 0, 0, 16], fontSize: 11 },
              { text: coverTitle, style: 'coverTitle', alignment: 'center' },
              { text: coverSubtitle, style: 'coverPeriod', alignment: 'center', margin: [0, 8, 0, 0] },
            ],
            fillColor: BRAND_LIGHT,
            margin: [24, 24, 24, 24],
            border: [false, false, false, false],
          }]],
        },
        layout: 'noBorders',
        margin: [0, -42, 0, 24],
      },
      mainTableContent,
      ...additionalContent,
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
}

export function buildDocxDocument({
  coverTitle,
  coverSubtitle,
  periodText,
  mainTable,
  additionalContent = [],
  logoBytes,
  headerLogoBytes,
}: DocxDocumentOptions): Document {
  const brandPrimaryHex = BRAND_PRIMARY.replace('#', '');
  const slateHex = 'CBD5E1';

  const pageHeader = new Header({
    children: [
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        borders: {
          top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          bottom: { style: BorderStyle.SINGLE, size: 8, color: brandPrimaryHex },
          left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        },
        rows: [new TableRow({
          children: [
            new TableCell({
              width: { size: 20, type: WidthType.PERCENTAGE },
              verticalAlign: VerticalAlign.CENTER,
              children: [new Paragraph({ children: [new ImageRun({ data: headerLogoBytes, type: 'png', transformation: { width: 92, height: 52 } })] })],
            }),
            new TableCell({
              width: { size: 80, type: WidthType.PERCENTAGE },
              verticalAlign: VerticalAlign.CENTER,
              children: [new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: periodText, color: '6B7280', size: 16 })],
              })],
            }),
          ],
        })],
      }),
    ],
  });

  const pageFooter = new Footer({
    children: [
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        borders: {
          top: { style: BorderStyle.SINGLE, size: 4, color: slateHex },
          bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        },
        rows: [new TableRow({
          children: [
            new TableCell({
              width: { size: 70, type: WidthType.PERCENTAGE },
              verticalAlign: VerticalAlign.CENTER,
              children: [new Paragraph({ children: [new TextRun({ text: 'Dane wygenerowane z systemów portowych.', color: '9CA3AF', size: 14 })] })],
            }),
            new TableCell({
              width: { size: 30, type: WidthType.PERCENTAGE },
              verticalAlign: VerticalAlign.CENTER,
              children: [new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ text: 'Strona ', color: '6B7280', size: 14 }),
                  new TextRun({ children: [PageNumber.CURRENT], color: '6B7280', size: 14 }),
                  new TextRun({ text: ' / ', color: '6B7280', size: 14 }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], color: '6B7280', size: 14 }),
                ],
              })],
            }),
          ],
        })],
      }),
    ],
  });

  const firstPageHeader = new Header({ children: [new Paragraph({ children: [] })] });

  return new Document({
    sections: [{
      properties: {
        titlePage: true,
        page: { margin: { top: 720, right: 500, bottom: 720, left: 500 } },
      },
      headers: { default: pageHeader, first: firstPageHeader },
      footers: { default: pageFooter, first: pageFooter },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 480, after: 120 },
          children: [new ImageRun({ data: logoBytes, type: 'png', transformation: { width: 186, height: 80 } })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 240 },
          children: [new TextRun({ text: COVER_DEPT, bold: true, color: '6B7280', size: 22 })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
          children: [new TextRun({ text: coverTitle, bold: true, size: 52, color: brandPrimaryHex })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
          children: [new TextRun({ text: coverSubtitle, size: 28, color: '374151' })],
        }),
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          alignment: AlignmentType.CENTER,
          spacing: { before: 240, after: 160 },
          children: [new TextRun({ text: 'Tabela danych', color: brandPrimaryHex, bold: true, size: 26 })],
        }),
        mainTable,
        ...additionalContent,
      ],
    }],
  });
}
