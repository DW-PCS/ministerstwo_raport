import type { AppClientsTypes } from '@/types';
import { GDYNIA_OPTION, SZCZECIN_SWINOUJSCIE_OPTION } from '@/constants';

export interface PortOption {
  id: string;
  label: string;
  value: string;
  disabled: boolean;
}

interface BasicReportRow {
  port: string;
  kod: string;
  ilosc: number;
  reportDate?: string;
}

function normalizePortName(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();
}

function isSzczecin(value: string): boolean {
  return normalizePortName(value) === 'szczecin';
}

function isSwinoujscie(value: string): boolean {
  return normalizePortName(value) === 'swinoujscie';
}

function isGdynia(value: string): boolean {
  return normalizePortName(value) === 'gdynia';
}

function isCombinedSzczecinSwinoujscie(value: string): boolean {
  return normalizePortName(value) === normalizePortName(SZCZECIN_SWINOUJSCIE_OPTION);
}

export function buildPortOptions(ports: AppClientsTypes[]): PortOption[] {
  const options: PortOption[] = [];
  const seen = new Set<string>();
  const hasSzczecin = ports.some(port => isSzczecin(port.city) || isSzczecin(port.name));
  const hasSwinoujscie = ports.some(port => isSwinoujscie(port.city) || isSwinoujscie(port.name));

  if (hasSzczecin || hasSwinoujscie) {
    options.push({
      id: 'port-szczecin-swinoujscie',
      label: SZCZECIN_SWINOUJSCIE_OPTION,
      value: SZCZECIN_SWINOUJSCIE_OPTION,
      disabled: false,
    });
    seen.add(normalizePortName(SZCZECIN_SWINOUJSCIE_OPTION));
  }

  ports.forEach(port => {
    const displayName = port.city || port.name;
    const normalizedDisplayName = normalizePortName(displayName);
    if (isSzczecin(displayName) || isSwinoujscie(displayName)) return;
    if (seen.has(normalizedDisplayName)) return;

    options.push({
      id: `port-${normalizedDisplayName}`,
      label: displayName,
      value: displayName,
      disabled: isGdynia(displayName),
    });
    seen.add(normalizedDisplayName);
  });

  if (!seen.has(normalizePortName(GDYNIA_OPTION))) {
    options.push({
      id: 'port-gdynia',
      label: GDYNIA_OPTION,
      value: GDYNIA_OPTION,
      disabled: true,
    });
  }

  return options;
}

export function expandSelectedPortsToBackendNames(
  selectedPorts: string[],
  allPorts: AppClientsTypes[]
): string[] {
  const mapped = new Set<string>();

  selectedPorts.forEach(selectedPort => {
    if (isCombinedSzczecinSwinoujscie(selectedPort)) {
      allPorts.forEach(port => {
        if (
          isSzczecin(port.name) ||
          isSzczecin(port.city) ||
          isSwinoujscie(port.name) ||
          isSwinoujscie(port.city)
        ) {
          mapped.add(port.name);
        }
      });
      return;
    }

    allPorts.forEach(port => {
      if (
        normalizePortName(selectedPort) === normalizePortName(port.name) ||
        normalizePortName(selectedPort) === normalizePortName(port.city)
      ) {
        mapped.add(port.name);
      }
    });
  });

  return Array.from(mapped);
}

function mapBackendPortToPresentation(port: string): string {
  if (isSzczecin(port) || isSwinoujscie(port)) {
    return SZCZECIN_SWINOUJSCIE_OPTION;
  }
  return port;
}

export function aggregateReportRowsForPresentation<T extends BasicReportRow>(rows: T[]): T[] {
  const aggregated = new Map<string, T>();

  rows.forEach(row => {
    const displayPort = mapBackendPortToPresentation(row.port);
    const reportDate = row.reportDate || '';
    const key = `${displayPort}::${row.kod}::${reportDate}`;
    const existing = aggregated.get(key);

    if (existing) {
      existing.ilosc += Number(row.ilosc || 0);
      return;
    }

    aggregated.set(key, { ...row, port: displayPort, ilosc: Number(row.ilosc || 0) });
  });

  return Array.from(aggregated.values());
}
