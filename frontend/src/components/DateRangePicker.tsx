import * as React from "react";
import TextField from "@mui/material/TextField";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { useState } from "react";

export function DateRangePicker({
  since,
  until,
  onChangeSince,
  onChangeUntil,
}: {
  since: Date;
  until: Date;
  onChangeSince: (since: Date) => void;
  onChangeUntil: (until: Date) => void;
}) {
  const [sinceOpen, setSinceOpen] = useState<boolean>(false);
  const [untilOpen, setUntilOpen] = useState<boolean>(false);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <DatePicker
        disableHighlightToday
        open={sinceOpen}
        onOpen={() => setSinceOpen(true)}
        onClose={() => setSinceOpen(false)}
        label="Since"
        value={since}
        onChange={(newValue) => {
          if (newValue === null) {
            return;
          }

          onChangeSince(newValue);
        }}
        renderInput={(params) => (
          <TextField
            onClick={() => {
              setSinceOpen(true);
            }}
            size="small"
            sx={{ mr: 2, width: 180 }}
            {...{
              ...params,
              inputProps: { ...params.inputProps, readOnly: true },
            }}
          />
        )}
      />
      <DatePicker
        disableHighlightToday
        open={untilOpen}
        onOpen={() => setUntilOpen(true)}
        onClose={() => setUntilOpen(false)}
        label="Until"
        value={until}
        onChange={(newValue) => {
          if (newValue === null) {
            return;
          }

          onChangeUntil(newValue);
        }}
        renderInput={(params) => (
          <TextField
            onClick={() => {
              setUntilOpen(true);
            }}
            size="small"
            sx={{ mr: 2, width: 180 }}
            {...{
              ...params,
              inputProps: { ...params.inputProps, readOnly: true },
            }}
          />
        )}
      />
    </LocalizationProvider>
  );
}
