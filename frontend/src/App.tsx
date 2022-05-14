import * as React from "react";
import { Button, Container, Typography, Box } from "@mui/material";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  startOfWeek,
  endOfWeek,
  formatISO,
  subWeeks,
  subMonths,
  startOfMonth,
  endOfMonth,
  isEqual,
} from "date-fns";
import { DateRangePicker } from "./components/DateRangePicker";
import { TimeTable, TimeEntry } from "./components/TimeTable";

// weeks start on monday
const WEEK_START_DAY = 1;

export default function App() {
  const now = new Date();
  const thisWeekStart = startOfWeek(now, {
    weekStartsOn: WEEK_START_DAY,
  });
  const thisWeekEnd = endOfWeek(now, {
    weekStartsOn: WEEK_START_DAY,
  });

  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);

  const weekAgo = subWeeks(now, 1);
  const lastWeekStart = startOfWeek(weekAgo, {
    weekStartsOn: WEEK_START_DAY,
  });
  const lastWeekEnd = endOfWeek(weekAgo, {
    weekStartsOn: WEEK_START_DAY,
  });

  const monthAgo = subMonths(now, 1);
  const lastMonthStart = startOfMonth(monthAgo);
  const lastMonthEnd = endOfMonth(monthAgo);

  const [loading, setLoading] = useState<boolean>(true);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [since, setSince] = useState<Date>(thisWeekStart);
  const [until, setUntil] = useState<Date>(thisWeekEnd);

  useEffect(() => {
    const load = async () => {
      const params = {
        since: formatISO(since, {
          representation: "date",
        }),
        until: formatISO(until, {
          representation: "date",
        }),
      };

      setTimeEntries([]);
      setLoading(true);
      const response = await axios.get(window.location.pathname, { params });
      setTimeEntries(response.data);
      setLoading(false);
    };

    load();
  }, [since, until]);

  const handleClickThisWeek = () => {
    setSince(thisWeekStart);
    setUntil(thisWeekEnd);
  };

  const handleClickLastWeek = () => {
    setSince(lastWeekStart);
    setUntil(lastWeekEnd);
  };

  const handleClickThisMonth = () => {
    setSince(thisMonthStart);
    setUntil(thisMonthEnd);
  };

  const handleClickLastMonth = () => {
    setSince(lastMonthStart);
    setUntil(lastMonthEnd);
  };

  const thisWeekActive =
    isEqual(since, thisWeekStart) && isEqual(until, thisWeekEnd);
  const lastWeekActive =
    isEqual(since, lastWeekStart) && isEqual(until, lastWeekEnd);
  const thisMonthActive =
    isEqual(since, thisMonthStart) && isEqual(until, thisMonthEnd);
  const lastMonthActive =
    isEqual(since, lastMonthStart) && isEqual(until, lastMonthEnd);

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography align="center" variant="h5" component="h5" gutterBottom>
          Weekly summary
        </Typography>
        <Box sx={{ display: "flex" }}>
          <DateRangePicker
            since={since}
            until={until}
            onChangeSince={setSince}
            onChangeUntil={setUntil}
          />
          <Button
            variant={thisWeekActive ? "contained" : "outlined"}
            size="small"
            onClick={handleClickThisWeek}
            sx={{ mr: 2 }}
          >
            This week
          </Button>
          <Button
            variant={lastWeekActive ? "contained" : "outlined"}
            size="small"
            sx={{ mr: 2 }}
            onClick={handleClickLastWeek}
          >
            Last week
          </Button>
          <Button
            variant={thisMonthActive ? "contained" : "outlined"}
            size="small"
            sx={{ mr: 2 }}
            onClick={handleClickThisMonth}
          >
            This month
          </Button>
          <Button
            variant={lastMonthActive ? "contained" : "outlined"}
            size="small"
            onClick={handleClickLastMonth}
          >
            Last month
          </Button>
        </Box>
        <TimeTable loading={loading} rows={timeEntries} />
      </Box>
    </Container>
  );
}
