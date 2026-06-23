'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import useReportDownload, { ReportDataItem } from '@/hooks/useReportDownload';
import type { RawReportRow } from '@/lib/helpers/report-download/types';

import { Download, Loader2 } from 'lucide-react';

interface ReportDownloadButtonProps {
  data: ReportDataItem[];
  rawData?: RawReportRow[];
  className?: string;
  startDate?: Date;
  endDate?: Date;
}

const ReportDownloadButton = ({ data, rawData, startDate, endDate }: ReportDownloadButtonProps) => {
  const { isDownloadEnabled, downloadReport, isDownloading } = useReportDownload(data, rawData);

  return (
    <div className="flex flex-col items-end gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            disabled={!isDownloadEnabled || isDownloading}
            className="flex cursor-pointer items-center gap-2 hover:bg-light-gray"
          >
            {isDownloading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}
            <span>Pobierz raport</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-white" align="end">
          <DropdownMenuItem
            onClick={() => downloadReport('csv', startDate, endDate)}
            disabled={isDownloading}
            className="cursor-pointer hover:bg-light-gray"
          >
            Pobierz jako CSV
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => downloadReport('pdf', startDate, endDate)}
            disabled={isDownloading}
            className="cursor-pointer hover:bg-light-gray"
          >
            Pobierz jako PDF
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => downloadReport('docx', startDate, endDate)}
            disabled={isDownloading}
            className="cursor-pointer hover:bg-light-gray"
          >
            Pobierz jako DOCX
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => downloadReport('xlsx', startDate, endDate)}
            disabled={isDownloading}
            className="cursor-pointer hover:bg-light-gray"
          >
            Pobierz jako XLSX
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ReportDownloadButton;
