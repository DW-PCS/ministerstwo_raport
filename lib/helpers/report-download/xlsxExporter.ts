import { fetchPortsAction, fetchReportDataAction, ReportRow } from '@/actions/report';
import { toast } from '@/components/ui/use-toast';
import { expandSelectedPortsToBackendNames } from '@/lib/helpers/port-filters';
import { HEADER_TEXT, MONTH_NAMES } from '@/lib/helpers/report-download/constants';
import { ExportBaseOptions } from '@/lib/helpers/report-download/types';
import {
  formatIsoDate,
  getByMatchers,
  normalizeLabel,
  percentValue,
  round1,
} from '@/lib/helpers/report-download/utils';
import { AppClientsTypes } from '@/lib/types';
import * as XLSX from 'xlsx-js-style';

interface XlsxExportOptions extends ExportBaseOptions {
  submittedPorts: string[];
  submittedCommodities: string[];
}

export async function exportXlsx({
  isDownloadEnabled,
  getFilename,
  startDate,
  endDate,
  submittedPorts,
  submittedCommodities,
}: XlsxExportOptions): Promise<void> {
  if (!isDownloadEnabled) return;

  try {
    if (submittedPorts.length === 0 || submittedCommodities.length === 0) {
      toast({
        title: 'Brak danych do eksportu',
        description: 'Wygeneruj raport po wyborze portów i grup towarowych.',
        variant: 'destructive',
      });
      return;
    }

    const referenceDate = endDate ?? new Date();
    const currentYear = referenceDate.getFullYear();
    const previousYear = currentYear - 1;
    const lastMonthIndex = referenceDate.getMonth();

    const allPorts = await fetchPortsAction();
    const backendPortNames = expandSelectedPortsToBackendNames(submittedPorts, allPorts);
    const selectedAppClients: AppClientsTypes[] = allPorts.filter(port =>
      backendPortNames.includes(port.name)
    );

    if (selectedAppClients.length === 0) {
      toast({
        title: 'Brak danych portów',
        description: 'Nie udało się dopasować wybranych portów do danych źródłowych.',
        variant: 'destructive',
      });
      return;
    }

    const normalizePortName = (value: string) =>
      value
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();

    const toLocativePortName = (portName: string) => {
      const normalized = normalizePortName(portName);
      if (normalized === 'gdansk') return 'Gdańsku';
      if (normalized === 'gdynia') return 'Gdyni';
      if (normalized === 'szczecin') return 'Szczecinie';
      if (normalized === 'swinoujscie') return 'Świnoujściu';
      return portName;
    };

    const cleanSheetName = (name: string) => name.replace(/[\\/*?:\[\]]/g, ' ').slice(0, 31);

    const szczecin = selectedAppClients.find(port => normalizePortName(port.name) === 'szczecin');
    const swinoujscie = selectedAppClients.find(
      port => normalizePortName(port.name) === 'swinoujscie'
    );

    type PortGroup = {
      clients: AppClientsTypes[];
      titleText: string;
      totalLabel: string;
      sheetName: string;
    };

    const usedPortNames = new Set<string>();
    const portGroups: PortGroup[] = [];

    if (szczecin && swinoujscie) {
      usedPortNames.add(szczecin.name);
      usedPortNames.add(swinoujscie.name);
      portGroups.push({
        clients: [szczecin, swinoujscie],
        titleText: 'Obroty w granicach portów w Szczecinie i w Świnoujściu wg grup towarowych',
        totalLabel: 'Razem obroty w portach w Szczecinie i w Świnoujściu',
        sheetName: cleanSheetName('Szczecin i Świnoujście'),
      });
    }

    selectedAppClients
      .filter(port => !usedPortNames.has(port.name))
      .forEach(port => {
        portGroups.push({
          clients: [port],
          titleText: `Obroty w granicach portu w ${toLocativePortName(port.name)} wg grup towarowych`,
          totalLabel: `Razem obroty w porcie w ${toLocativePortName(port.name)}`,
          sheetName: cleanSheetName(port.name),
        });
      });

    if (portGroups.length === 0) {
      toast({
        title: 'Brak danych portów',
        description: 'Nie znaleziono portów do podziału na zakładki.',
        variant: 'destructive',
      });
      return;
    }

    const parseYearMonth = (dateValue?: string) => {
      if (!dateValue) return null;
      const [yearPart, monthPart] = dateValue.split('-');
      const year = Number(yearPart);
      const month = Number(monthPart);
      if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
        return null;
      }
      return { year, monthIndex: month - 1 };
    };

    const buildMonthlyTotals = (rows: ReportRow[], year: number) => {
      const monthlyTotals: Record<number, Record<string, number>> = {};

      rows.forEach(row => {
        const parsed = parseYearMonth(row.reportDate);
        if (!parsed || parsed.year !== year) return;

        const key = normalizeLabel(row.kod);
        const monthTotals = monthlyTotals[parsed.monthIndex] || {};
        monthTotals[key] = (monthTotals[key] || 0) + Number(row.ilosc || 0);
        monthlyTotals[parsed.monthIndex] = monthTotals;
      });

      return monthlyTotals;
    };

    const getYtdTotals = (
      monthlyTotals: Record<number, Record<string, number>>,
      monthIndex: number
    ) => {
      const totals: Record<string, number> = {};

      for (let idx = 0; idx <= monthIndex; idx++) {
        const monthTotals = monthlyTotals[idx] || {};
        Object.entries(monthTotals).forEach(([key, value]) => {
          totals[key] = (totals[key] || 0) + value;
        });
      }

      return totals;
    };

    const workbook = XLSX.utils.book_new();
    let addedSheetsCount = 0;

    const titleStyle = {
      font: { bold: true, sz: 13 },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    };

    const mixedGridBorder = {
      top: { style: 'thin', color: { rgb: '8A8A8A' } },
      right: { style: 'medium', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '8A8A8A' } },
      left: { style: 'medium', color: { rgb: '000000' } },
    };

    const headerStyleWhite = {
      font: { bold: true },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      fill: { patternType: 'solid', fgColor: { rgb: 'FFFFFF' } },
      border: mixedGridBorder,
    };

    const headerStyleGray = {
      font: { bold: true },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      fill: { patternType: 'solid', fgColor: { rgb: 'D9D9D9' } },
      border: mixedGridBorder,
    };

    const textCellStyle = {
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: mixedGridBorder,
    };

    const numberCellStyle = {
      alignment: { horizontal: 'center', vertical: 'center' },
      border: mixedGridBorder,
    };

    const totalRowStyle = {
      font: { bold: true },
      alignment: { horizontal: 'center', vertical: 'center' },
      fill: { patternType: 'solid', fgColor: { rgb: 'FFF9CC' } },
      border: mixedGridBorder,
    };

    const monthIndices = Array.from(
      { length: lastMonthIndex + 1 },
      (_, idx) => lastMonthIndex - idx
    );

    for (const portGroup of portGroups) {
      const sheet: XLSX.WorkSheet = {};
      const merges: XLSX.Range[] = [];

      const previousRangeStart = new Date(previousYear, 0, 1);
      const previousRangeEnd = new Date(previousYear, lastMonthIndex + 1, 0);
      const currentRangeStart = new Date(currentYear, 0, 1);
      const currentRangeEnd = new Date(currentYear, lastMonthIndex + 1, 0);

      const [previousRows, currentRows] = await Promise.all([
        fetchReportDataAction(
          portGroup.clients,
          submittedCommodities,
          formatIsoDate(previousRangeStart),
          formatIsoDate(previousRangeEnd)
        ),
        fetchReportDataAction(
          portGroup.clients,
          submittedCommodities,
          formatIsoDate(currentRangeStart),
          formatIsoDate(currentRangeEnd)
        ),
      ]);

      const previousMonthlyTotals = buildMonthlyTotals(previousRows, previousYear);
      const currentMonthlyTotals = buildMonthlyTotals(currentRows, currentYear);

      const setCell = (
        row: number,
        col: number,
        value: string | number,
        style?: Record<string, unknown>,
        numberFormat?: string
      ) => {
        const ref = XLSX.utils.encode_cell({ r: row, c: col });
        if (typeof value === 'number') {
          sheet[ref] = { t: 'n', v: value, z: numberFormat ?? '0.0', s: style };
        } else {
          sheet[ref] = { t: 's', v: value, s: style };
        }
      };

      const addMerge = (startRow: number, startCol: number, endRow: number, endCol: number) => {
        merges.push({ s: { r: startRow, c: startCol }, e: { r: endRow, c: endCol } });
      };

      const applyBorderToRange = (
        startRow: number,
        startCol: number,
        endRow: number,
        endCol: number
      ) => {
        for (let row = startRow; row <= endRow; row++) {
          for (let col = startCol; col <= endCol; col++) {
            const ref = XLSX.utils.encode_cell({ r: row, c: col });
            const existing = sheet[ref] as
              | { t: 'n' | 's'; v: string | number; z?: string; s?: Record<string, unknown> }
              | undefined;

            if (!existing) {
              sheet[ref] = { t: 's', v: '', s: { border: mixedGridBorder } };
              continue;
            }

            sheet[ref] = {
              ...existing,
              s: {
                ...(existing.s || {}),
                border: mixedGridBorder,
              },
            };
          }
        }
      };

      let renderedBlocksCount = 0;

      for (let blockIndex = 0; blockIndex < monthIndices.length; blockIndex++) {
        const monthIndex = monthIndices[blockIndex];
        const monthName = MONTH_NAMES[monthIndex];
        const ytdLabel = `${monthIndex + 1} m-cy`;

        const prevMonthTotals = previousMonthlyTotals[monthIndex] || {};
        const prevYtdTotals = getYtdTotals(previousMonthlyTotals, monthIndex);
        const currMonthTotals = currentMonthlyTotals[monthIndex] || {};
        const currYtdTotals = getYtdTotals(currentMonthlyTotals, monthIndex);

        const values = {
          coal: {
            prevMonth: getByMatchers(prevMonthTotals, [/^wegiel$/]),
            prevYtd: getByMatchers(prevYtdTotals, [/^wegiel$/]),
            currMonth: getByMatchers(currMonthTotals, [/^wegiel$/]),
            currYtd: getByMatchers(currYtdTotals, [/^wegiel$/]),
          },
          ore: {
            prevMonth: getByMatchers(prevMonthTotals, [/^ruda$/]),
            prevYtd: getByMatchers(prevYtdTotals, [/^ruda$/]),
            currMonth: getByMatchers(currMonthTotals, [/^ruda$/]),
            currYtd: getByMatchers(currYtdTotals, [/^ruda$/]),
          },
          otherBulk: {
            prevMonth: getByMatchers(prevMonthTotals, [/^inne masowe$/]),
            prevYtd: getByMatchers(prevYtdTotals, [/^inne masowe$/]),
            currMonth: getByMatchers(currMonthTotals, [/^inne masowe$/]),
            currYtd: getByMatchers(currYtdTotals, [/^inne masowe$/]),
          },
          grain: {
            prevMonth: getByMatchers(prevMonthTotals, [/^zboze$/]),
            prevYtd: getByMatchers(prevYtdTotals, [/^zboze$/]),
            currMonth: getByMatchers(currMonthTotals, [/^zboze$/]),
            currYtd: getByMatchers(currYtdTotals, [/^zboze$/]),
          },
          wood: {
            prevMonth: getByMatchers(prevMonthTotals, [/^drewno$/]),
            prevYtd: getByMatchers(prevYtdTotals, [/^drewno$/]),
            currMonth: getByMatchers(currMonthTotals, [/^drewno$/]),
            currYtd: getByMatchers(currYtdTotals, [/^drewno$/]),
          },
          generalCargo: {
            prevMonth: getByMatchers(prevMonthTotals, [/^drobnica$/]),
            prevYtd: getByMatchers(prevYtdTotals, [/^drobnica$/]),
            currMonth: getByMatchers(currMonthTotals, [/^drobnica$/]),
            currYtd: getByMatchers(currYtdTotals, [/^drobnica$/]),
          },
          ferryCargo: {
            prevMonth: getByMatchers(prevMonthTotals, [/drobnica promowa/]),
            prevYtd: getByMatchers(prevYtdTotals, [/drobnica promowa/]),
            currMonth: getByMatchers(currMonthTotals, [/drobnica promowa/]),
            currYtd: getByMatchers(currYtdTotals, [/drobnica promowa/]),
          },
          fuels: {
            prevMonth: getByMatchers(prevMonthTotals, [/^paliwa$/]),
            prevYtd: getByMatchers(prevYtdTotals, [/^paliwa$/]),
            currMonth: getByMatchers(currMonthTotals, [/^paliwa$/]),
            currYtd: getByMatchers(currYtdTotals, [/^paliwa$/]),
          },
          lng: {
            prevMonth: getByMatchers(prevMonthTotals, [/gaz lng/]),
            prevYtd: getByMatchers(prevYtdTotals, [/gaz lng/]),
            currMonth: getByMatchers(currMonthTotals, [/gaz lng/]),
            currYtd: getByMatchers(currYtdTotals, [/gaz lng/]),
          },
          teu: {
            prevMonth: getByMatchers(prevMonthTotals, [/teu/, /kontener/]),
            prevYtd: getByMatchers(prevYtdTotals, [/teu/, /kontener/]),
            currMonth: getByMatchers(currMonthTotals, [/teu/, /kontener/]),
            currYtd: getByMatchers(currYtdTotals, [/teu/, /kontener/]),
          },
        };

        const totalMain = {
          prevMonth:
            values.coal.prevMonth +
            values.ore.prevMonth +
            values.otherBulk.prevMonth +
            values.grain.prevMonth +
            values.wood.prevMonth +
            values.generalCargo.prevMonth +
            values.fuels.prevMonth,
          prevYtd:
            values.coal.prevYtd +
            values.ore.prevYtd +
            values.otherBulk.prevYtd +
            values.grain.prevYtd +
            values.wood.prevYtd +
            values.generalCargo.prevYtd +
            values.fuels.prevYtd,
          currMonth:
            values.coal.currMonth +
            values.ore.currMonth +
            values.otherBulk.currMonth +
            values.grain.currMonth +
            values.wood.currMonth +
            values.generalCargo.currMonth +
            values.fuels.currMonth,
          currYtd:
            values.coal.currYtd +
            values.ore.currYtd +
            values.otherBulk.currYtd +
            values.grain.currYtd +
            values.wood.currYtd +
            values.generalCargo.currYtd +
            values.fuels.currYtd,
        };

        const monthSum =
          totalMain.prevMonth + totalMain.prevYtd + totalMain.currMonth + totalMain.currYtd;
        const teuSum =
          values.teu.prevMonth + values.teu.prevYtd + values.teu.currMonth + values.teu.currYtd;
        const ferrySum =
          values.ferryCargo.prevMonth +
          values.ferryCargo.prevYtd +
          values.ferryCargo.currMonth +
          values.ferryCargo.currYtd;

        if (monthSum + teuSum + ferrySum === 0) {
          continue;
        }

        const blockBaseRow = renderedBlocksCount * 19;
        renderedBlocksCount += 1;

        setCell(
          blockBaseRow,
          0,
          `${portGroup.titleText} za ${monthName} ${currentYear}r.`,
          titleStyle
        );

        addMerge(blockBaseRow, 0, blockBaseRow, 7);

        const writeTable = (colOffset: number) => {
          setCell(blockBaseRow + 2, colOffset + 0, 'Lp.', headerStyleWhite);
          setCell(blockBaseRow + 2, colOffset + 1, 'Grupa towarowa', headerStyleWhite);
          setCell(blockBaseRow + 2, colOffset + 2, HEADER_TEXT, headerStyleWhite);

          setCell(blockBaseRow + 3, colOffset + 2, String(previousYear), headerStyleWhite);
          setCell(blockBaseRow + 3, colOffset + 4, String(currentYear), headerStyleWhite);
          setCell(blockBaseRow + 3, colOffset + 6, '%', headerStyleWhite);

          setCell(blockBaseRow + 4, colOffset + 2, monthName, headerStyleWhite);
          setCell(blockBaseRow + 4, colOffset + 3, ytdLabel, headerStyleWhite);
          setCell(blockBaseRow + 4, colOffset + 4, monthName, headerStyleWhite);
          setCell(blockBaseRow + 4, colOffset + 5, ytdLabel, headerStyleWhite);
          setCell(blockBaseRow + 4, colOffset + 6, '5:3', headerStyleWhite);
          setCell(blockBaseRow + 4, colOffset + 7, '6 : 4', headerStyleWhite);

          for (let col = 0; col < 8; col++) {
            setCell(blockBaseRow + 5, colOffset + col, col + 1, headerStyleGray, '0');
          }

          const tableRows: Array<{
            lp: string;
            label: string;
            prevMonth: number;
            prevYtd: number;
            currMonth: number;
            currYtd: number;
            ratioMonth: number;
            ratioYtd: number;
          }> = [
            {
              lp: '1',
              label: 'Węgiel',
              prevMonth: values.coal.prevMonth,
              prevYtd: values.coal.prevYtd,
              currMonth: values.coal.currMonth,
              currYtd: values.coal.currYtd,
              ratioMonth: percentValue(values.coal.currMonth, values.coal.prevMonth),
              ratioYtd: percentValue(values.coal.currYtd, values.coal.prevYtd),
            },
            {
              lp: '2',
              label: 'Ruda',
              prevMonth: values.ore.prevMonth,
              prevYtd: values.ore.prevYtd,
              currMonth: values.ore.currMonth,
              currYtd: values.ore.currYtd,
              ratioMonth: percentValue(values.ore.currMonth, values.ore.prevMonth),
              ratioYtd: percentValue(values.ore.currYtd, values.ore.prevYtd),
            },
            {
              lp: '3',
              label: 'Inne masowe',
              prevMonth: values.otherBulk.prevMonth,
              prevYtd: values.otherBulk.prevYtd,
              currMonth: values.otherBulk.currMonth,
              currYtd: values.otherBulk.currYtd,
              ratioMonth: percentValue(values.otherBulk.currMonth, values.otherBulk.prevMonth),
              ratioYtd: percentValue(values.otherBulk.currYtd, values.otherBulk.prevYtd),
            },
            {
              lp: '4',
              label: 'Zboże',
              prevMonth: values.grain.prevMonth,
              prevYtd: values.grain.prevYtd,
              currMonth: values.grain.currMonth,
              currYtd: values.grain.currYtd,
              ratioMonth: percentValue(values.grain.currMonth, values.grain.prevMonth),
              ratioYtd: percentValue(values.grain.currYtd, values.grain.prevYtd),
            },
            {
              lp: '5',
              label: 'Drewno',
              prevMonth: values.wood.prevMonth,
              prevYtd: values.wood.prevYtd,
              currMonth: values.wood.currMonth,
              currYtd: values.wood.currYtd,
              ratioMonth: percentValue(values.wood.currMonth, values.wood.prevMonth),
              ratioYtd: percentValue(values.wood.currYtd, values.wood.prevYtd),
            },
            {
              lp: '6',
              label: 'Drobnica',
              prevMonth: values.generalCargo.prevMonth,
              prevYtd: values.generalCargo.prevYtd,
              currMonth: values.generalCargo.currMonth,
              currYtd: values.generalCargo.currYtd,
              ratioMonth: percentValue(
                values.generalCargo.currMonth,
                values.generalCargo.prevMonth
              ),
              ratioYtd: percentValue(values.generalCargo.currYtd, values.generalCargo.prevYtd),
            },
            {
              lp: '',
              label: 'w tym drobnica promowa',
              prevMonth: values.ferryCargo.prevMonth,
              prevYtd: values.ferryCargo.prevYtd,
              currMonth: values.ferryCargo.currMonth,
              currYtd: values.ferryCargo.currYtd,
              ratioMonth: percentValue(values.ferryCargo.currMonth, values.ferryCargo.prevMonth),
              ratioYtd: percentValue(values.ferryCargo.currYtd, values.ferryCargo.prevYtd),
            },
            {
              lp: '7',
              label: 'Paliwa',
              prevMonth: values.fuels.prevMonth,
              prevYtd: values.fuels.prevYtd,
              currMonth: values.fuels.currMonth,
              currYtd: values.fuels.currYtd,
              ratioMonth: percentValue(values.fuels.currMonth, values.fuels.prevMonth),
              ratioYtd: percentValue(values.fuels.currYtd, values.fuels.prevYtd),
            },
            {
              lp: '',
              label: 'w tym gaz LNG',
              prevMonth: values.lng.prevMonth,
              prevYtd: values.lng.prevYtd,
              currMonth: values.lng.currMonth,
              currYtd: values.lng.currYtd,
              ratioMonth: percentValue(values.lng.currMonth, values.lng.prevMonth),
              ratioYtd: percentValue(values.lng.currYtd, values.lng.prevYtd),
            },
            {
              lp: '',
              label: portGroup.totalLabel,
              prevMonth: totalMain.prevMonth,
              prevYtd: totalMain.prevYtd,
              currMonth: totalMain.currMonth,
              currYtd: totalMain.currYtd,
              ratioMonth: percentValue(totalMain.currMonth, totalMain.prevMonth),
              ratioYtd: percentValue(totalMain.currYtd, totalMain.prevYtd),
            },
            {
              lp: '8',
              label: "Przeładunki kontenerów TEU (20')",
              prevMonth: values.teu.prevMonth,
              prevYtd: values.teu.prevYtd,
              currMonth: values.teu.currMonth,
              currYtd: values.teu.currYtd,
              ratioMonth: percentValue(values.teu.currMonth, values.teu.prevMonth),
              ratioYtd: percentValue(values.teu.currYtd, values.teu.prevYtd),
            },
          ];

          tableRows.forEach((row, idx) => {
            const rowNumber = blockBaseRow + 6 + idx;
            setCell(rowNumber, colOffset + 0, row.lp || '', numberCellStyle, '0');
            const isTotalRow = row.label.includes('Razem obroty');
            setCell(
              rowNumber,
              colOffset + 1,
              row.label,
              isTotalRow ? totalRowStyle : textCellStyle
            );
            setCell(
              rowNumber,
              colOffset + 2,
              round1(row.prevMonth),
              isTotalRow ? totalRowStyle : numberCellStyle,
              '0.0'
            );
            setCell(
              rowNumber,
              colOffset + 3,
              round1(row.prevYtd),
              isTotalRow ? totalRowStyle : numberCellStyle,
              '0.0'
            );
            setCell(
              rowNumber,
              colOffset + 4,
              round1(row.currMonth),
              isTotalRow ? totalRowStyle : numberCellStyle,
              '0.0'
            );
            setCell(
              rowNumber,
              colOffset + 5,
              round1(row.currYtd),
              isTotalRow ? totalRowStyle : numberCellStyle,
              '0.0'
            );
            setCell(
              rowNumber,
              colOffset + 6,
              row.ratioMonth,
              isTotalRow ? totalRowStyle : numberCellStyle,
              '0.0'
            );
            setCell(
              rowNumber,
              colOffset + 7,
              row.ratioYtd,
              isTotalRow ? totalRowStyle : numberCellStyle,
              '0.0'
            );

            setCell(rowNumber, 19, round1(row.prevMonth), numberCellStyle, '0.0');
            setCell(rowNumber, 20, round1(row.prevYtd), numberCellStyle, '0.0');
            setCell(rowNumber, 21, round1(row.currMonth), numberCellStyle, '0.0');
            setCell(rowNumber, 22, round1(row.currYtd), numberCellStyle, '0.0');
          });

          addMerge(blockBaseRow + 2, colOffset + 0, blockBaseRow + 4, colOffset + 0);
          addMerge(blockBaseRow + 2, colOffset + 1, blockBaseRow + 4, colOffset + 1);
          addMerge(blockBaseRow + 2, colOffset + 2, blockBaseRow + 2, colOffset + 7);
          addMerge(blockBaseRow + 3, colOffset + 2, blockBaseRow + 3, colOffset + 3);
          addMerge(blockBaseRow + 3, colOffset + 4, blockBaseRow + 3, colOffset + 5);
          addMerge(blockBaseRow + 3, colOffset + 6, blockBaseRow + 3, colOffset + 7);
          addMerge(blockBaseRow + 11, colOffset + 0, blockBaseRow + 12, colOffset + 0);
          addMerge(blockBaseRow + 13, colOffset + 0, blockBaseRow + 14, colOffset + 0);
          addMerge(blockBaseRow + 15, colOffset + 0, blockBaseRow + 15, colOffset + 1);
        };

        writeTable(0);
        writeTable(9);

        applyBorderToRange(blockBaseRow + 2, 0, blockBaseRow + 16, 7);
        applyBorderToRange(blockBaseRow + 2, 9, blockBaseRow + 16, 16);
      }

      sheet['!merges'] = merges;
      sheet['!cols'] = [
        { wch: 8 },
        { wch: 32 },
        { wch: 14 },
        { wch: 16 },
        { wch: 14 },
        { wch: 16 },
        { wch: 10 },
        { wch: 10 },
        { wch: 3 },
        { wch: 8 },
        { wch: 32 },
        { wch: 14 },
        { wch: 16 },
        { wch: 14 },
        { wch: 16 },
        { wch: 10 },
        { wch: 10 },
        { wch: 3 },
        { wch: 3 },
        { wch: 14 },
        { wch: 16 },
        { wch: 14 },
        { wch: 16 },
      ];

      if (renderedBlocksCount === 0) {
        continue;
      }

      const endRow = Math.max(renderedBlocksCount * 19 - 1, 0);
      sheet['!rows'] = Array.from({ length: endRow + 1 }, (_, rowIndex) => ({
        hpt: rowIndex % 19 === 2 ? 34 : 22,
      }));
      sheet['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: endRow, c: 22 } });

      XLSX.utils.book_append_sheet(workbook, sheet, portGroup.sheetName || 'WUS 2025');
      addedSheetsCount += 1;
    }

    if (addedSheetsCount === 0) {
      const emptySheet = XLSX.utils.aoa_to_sheet([
        ['Brak danych do eksportu dla wybranego zakresu i filtrów.'],
      ]);
      XLSX.utils.book_append_sheet(workbook, emptySheet, 'Brak danych');
    }

    XLSX.writeFile(workbook, getFilename('xlsx', startDate, endDate), {
      cellStyles: true,
    });

    toast({ title: 'Pobrano raport Excel (WUS 2025)' });
  } catch (error) {
    console.error('Error generating Excel:', error);
    toast({
      title: 'Błąd pobierania',
      description: 'Nie udało się wygenerować pliku Excel.',
      variant: 'destructive',
    });
  }
}
