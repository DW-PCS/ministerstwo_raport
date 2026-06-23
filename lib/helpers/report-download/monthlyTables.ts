import { fetchPortsAction, fetchReportDataAction, ReportRow } from '@/actions/report';
import { expandSelectedPortsToBackendNames } from '@/lib/helpers/port-filters';
import { MONTH_NAMES } from '@/lib/helpers/report-download/constants';
import {
  formatIsoDate,
  getByMatchers,
  normalizeLabel,
  percentValue,
} from '@/lib/helpers/report-download/utils';
import type { AppClientsTypes } from '@/types';

interface PortGroup {
  clients: AppClientsTypes[];
  titleText: string;
  totalLabel: string;
}

export interface MonthlyTableRow {
  lp: string;
  label: string;
  prevMonth: number;
  prevYtd: number;
  currMonth: number;
  currYtd: number;
  ratioMonth: number;
  ratioYtd: number;
  isTotalRow: boolean;
}

export interface MonthlyTableSection {
  monthName: string;
  ytdLabel: string;
  currentYear: number;
  previousYear: number;
  title: string;
  rows: MonthlyTableRow[];
}

function normalizePortName(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function toLocativePortName(portName: string): string {
  const normalized = normalizePortName(portName);
  if (normalized === 'gdansk') return 'Gdańsku';
  if (normalized === 'gdynia') return 'Gdyni';
  if (normalized === 'szczecin') return 'Szczecinie';
  if (normalized === 'swinoujscie') return 'Świnoujściu';
  return portName;
}

function parseYearMonth(dateValue?: string) {
  if (!dateValue) return null;
  const [yearPart, monthPart] = dateValue.split('-');
  const year = Number(yearPart);
  const month = Number(monthPart);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }
  return { year, monthIndex: month - 1 };
}

function buildMonthlyTotals(rows: ReportRow[], year: number) {
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
}

function getYtdTotals(monthlyTotals: Record<number, Record<string, number>>, monthIndex: number) {
  const totals: Record<string, number> = {};

  for (let idx = 0; idx <= monthIndex; idx++) {
    const monthTotals = monthlyTotals[idx] || {};
    Object.entries(monthTotals).forEach(([key, value]) => {
      totals[key] = (totals[key] || 0) + value;
    });
  }

  return totals;
}

function buildPortGroups(selectedAppClients: AppClientsTypes[]): PortGroup[] {
  const szczecin = selectedAppClients.find(port => normalizePortName(port.name) === 'szczecin');
  const swinoujscie = selectedAppClients.find(
    port => normalizePortName(port.name) === 'swinoujscie'
  );

  const usedPortNames = new Set<string>();
  const portGroups: PortGroup[] = [];

  if (szczecin && swinoujscie) {
    usedPortNames.add(szczecin.name);
    usedPortNames.add(swinoujscie.name);
    portGroups.push({
      clients: [szczecin, swinoujscie],
      titleText: 'Obroty w granicach portów w Szczecinie i w Świnoujściu wg grup towarowych',
      totalLabel: 'Razem obroty w portach w Szczecinie i w Świnoujściu',
    });
  }

  selectedAppClients
    .filter(port => !usedPortNames.has(port.name))
    .forEach(port => {
      portGroups.push({
        clients: [port],
        titleText: `Obroty w granicach portu w ${toLocativePortName(port.name)} wg grup towarowych`,
        totalLabel: `Razem obroty w porcie w ${toLocativePortName(port.name)}`,
      });
    });

  return portGroups;
}

function toRows(
  totalLabel: string,
  values: {
    coal: Record<string, number>;
    ore: Record<string, number>;
    otherBulk: Record<string, number>;
    grain: Record<string, number>;
    wood: Record<string, number>;
    generalCargo: Record<string, number>;
    ferryCargo: Record<string, number>;
    fuels: Record<string, number>;
    lng: Record<string, number>;
    teu: Record<string, number>;
  },
  totalMain: Record<string, number>
): MonthlyTableRow[] {
  return [
    {
      lp: '1',
      label: 'Węgiel',
      prevMonth: values.coal.prevMonth,
      prevYtd: values.coal.prevYtd,
      currMonth: values.coal.currMonth,
      currYtd: values.coal.currYtd,
      ratioMonth: percentValue(values.coal.currMonth, values.coal.prevMonth),
      ratioYtd: percentValue(values.coal.currYtd, values.coal.prevYtd),
      isTotalRow: false,
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
      isTotalRow: false,
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
      isTotalRow: false,
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
      isTotalRow: false,
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
      isTotalRow: false,
    },
    {
      lp: '6',
      label: 'Drobnica',
      prevMonth: values.generalCargo.prevMonth,
      prevYtd: values.generalCargo.prevYtd,
      currMonth: values.generalCargo.currMonth,
      currYtd: values.generalCargo.currYtd,
      ratioMonth: percentValue(values.generalCargo.currMonth, values.generalCargo.prevMonth),
      ratioYtd: percentValue(values.generalCargo.currYtd, values.generalCargo.prevYtd),
      isTotalRow: false,
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
      isTotalRow: false,
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
      isTotalRow: false,
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
      isTotalRow: false,
    },
    {
      lp: '',
      label: totalLabel,
      prevMonth: totalMain.prevMonth,
      prevYtd: totalMain.prevYtd,
      currMonth: totalMain.currMonth,
      currYtd: totalMain.currYtd,
      ratioMonth: percentValue(totalMain.currMonth, totalMain.prevMonth),
      ratioYtd: percentValue(totalMain.currYtd, totalMain.prevYtd),
      isTotalRow: true,
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
      isTotalRow: false,
    },
  ];
}

export async function buildMonthlyTableSections(
  submittedPorts: string[],
  submittedCommodities: string[],
  endDate?: Date
): Promise<MonthlyTableSection[]> {
  if (submittedPorts.length === 0 || submittedCommodities.length === 0) return [];

  const referenceDate = endDate ?? new Date();
  const currentYear = referenceDate.getFullYear();
  const previousYear = currentYear - 1;
  const lastMonthIndex = referenceDate.getMonth();

  const allPorts = await fetchPortsAction();
  const backendPortNames = expandSelectedPortsToBackendNames(submittedPorts, allPorts);
  const selectedAppClients = allPorts.filter(port => backendPortNames.includes(port.name));
  if (selectedAppClients.length === 0) return [];

  const portGroups = buildPortGroups(selectedAppClients);
  const monthIndices = Array.from({ length: lastMonthIndex + 1 }, (_, idx) => lastMonthIndex - idx);

  const result: MonthlyTableSection[] = [];

  for (const portGroup of portGroups) {
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

    for (const monthIndex of monthIndices) {
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

      result.push({
        monthName,
        ytdLabel,
        currentYear,
        previousYear,
        title: `${portGroup.titleText} za ${monthName} ${currentYear}r.`,
        rows: toRows(portGroup.totalLabel, values, totalMain),
      });
    }
  }

  return result;
}
