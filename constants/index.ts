import type { TrendType } from '@/lib/helpers/trend-helpers';
import type { ChartType } from '@/types';

export const SESSION_TIMEOUT_SECONDS = 30 * 60; // 30 minutes

export const COLORS = [
  '#1a0069',
  '#ff7f0e',
  '#2ca02c',
  '#d62728',
  '#9467bd',
  '#8c564b',
  '#e377c2',
  '#bcbd22',
  '#17becf',
  '#e7ba52',
  '#7ab8d9',
  '#ffbb78',
  '#98df8a',
  '#ff9896',
  '#c5b0d5',
  '#c49c94',
  '#f7b6d2',
  '#dbdb8d',
  '#9edae5',
  '#ad8bc9',
];

export const SZCZECIN_SWINOUJSCIE_OPTION = 'Szczecin i Świnoujście';
export const GDYNIA_OPTION = 'Gdynia';

export const MONTH_NAMES = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień',
];

export const MONTH_ABBR = [
  'sty',
  'lut',
  'mar',
  'kwi',
  'maj',
  'cze',
  'lip',
  'sie',
  'wrz',
  'paź',
  'lis',
  'gru',
];

export const TREND_OPTIONS: { value: TrendType; label: string }[] = [
  { value: 'linear', label: 'Liniowy' },
  { value: 'logarithmic', label: 'Logarytmiczny' },
  { value: 'polynomial', label: 'Wielomianowy (st. 2)' },
  { value: 'power', label: 'Potęgowy' },
  { value: 'exponential', label: 'Wykładniczy' },
  { value: 'movingAverage', label: 'Średnia krocząca' },
];

export const CHART_OPTIONS: { type: ChartType; label: string }[] = [
  { type: 'bar_port', label: 'Słupkowy – struktura wg portu' },
  { type: 'bar_commodity', label: 'Słupkowy – wolumen wg grupy towarowej' },
  { type: 'pie', label: 'Kołowy – udział grup towarowych' },
  { type: 'bar_timeseries', label: 'Kolumnowy – obroty wg miesiąca (linia trendu)' },
];

export const TEST_DATA_START = new Date('2025-07-01');
export const TEST_DATA_END = new Date('2025-12-31');

export const REPORT_TYPES = [
  {
    id: 'cargo-turnover',
    title: 'Raport obrotów ładunkowych',
    description:
      'Zestawienie obrotów ładunkowych w podziale na porty i grupy towarowe w wybranym okresie',
    href: '/raporty/obroty-ladunkowe',
    status: 'Dostępny',
    available: true,
  },
  {
    id: 'ship-traffic',
    title: 'Raport ruchu statków',
    description:
      'Zestawienie zawinięć statków w podziale na porty w wybranym okresie',
    href: '/raporty/ruch-statkow',
    status: 'W przygotowaniu',
    available: false,
  },
  {
    id: 'ship-traffic-flags',
    title: 'Raport ruchu statków (bandery)',
    description:
      'Zestawienie zawinięć statków w podziale na państwa bandery w wybranym okresie',
    href: '/raporty/wykorzystanie-terminali',
    status: 'W przygotowaniu',
    available: false,
  },
  {
    id: 'ship-capacity',
    title: 'Raport pojemności statków netto',
    description:
      'Zestawienie pojemności netto statków zawijających do portów w wybranym okresie',
    href: '/raporty/srodki-transportu',
    status: 'W przygotowaniu',
    available: false,
  },
];
