import React from "react";
import {
  DataGrid,
  GridColDef,
  GridValueFormatterParams,
} from "@mui/x-data-grid";

export interface TimeEntry {
  date: string;
  project: string;
  description: string;
  duration: number;
  billed_amount: number;
  due_amount: number;
}

const columns: GridColDef[] = [
  { field: "date", headerName: "Date", width: 100 },
  { field: "project", headerName: "Project", width: 100 },
  { field: "description", headerName: "Description", flex: 1 },
  {
    field: "duration",
    headerName: "Time",
    width: 70,
    valueFormatter: (params: GridValueFormatterParams) => {
      const hours = String(Math.floor(params.value / 60));
      const paddedHours = hours.padStart(2, "0");
      const minutes = String(params.value % 60);
      const paddedMinutes = minutes.padStart(2, "0");
      return `${paddedHours}:${paddedMinutes}`;
    },
  },
  {
    field: "billed_amount",
    headerName: "Billed",
    width: 80,
    valueFormatter: (params: GridValueFormatterParams) => {
      return `$${params.value.toFixed(2)}`;
    },
  },
  {
    field: "due_amount",
    headerName: "Due",
    width: 80,
    valueFormatter: (params: GridValueFormatterParams) => {
      return `$${params.value.toFixed(2)}`;
    },
  },
];

export function TimeTable({
  rows,
  loading,
}: {
  rows: TimeEntry[];
  loading: boolean;
}) {
  const totalRow = {
    date: "Total:",
    duration: rows.reduce((res, row) => res + row["duration"], 0),
    billed_amount: rows.reduce((res, row) => res + row["billed_amount"], 0),
    due_amount: rows.reduce((res, row) => res + row["due_amount"], 0),
  };

  return (
    <DataGrid
      autoHeight
      disableSelectionOnClick
      hideFooter
      density="compact"
      sx={{ my: 2, minHeight: 150 }}
      columns={columns}
      rows={rows.length > 0 ? [...rows, totalRow] : []}
      loading={loading}
      getRowId={(row) => `${row.date}${row.project}${row.description}`}
    />
  );
}
