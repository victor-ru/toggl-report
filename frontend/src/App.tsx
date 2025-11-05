import { Button, Container, Typography, Box } from "@mui/material";
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  startOfWeek,
  endOfWeek,
  formatISO,
  subWeeks,
  subMonths,
  startOfMonth,
  endOfMonth,
  endOfDay,
  isEqual,
  parseISO,
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

  // get `since` and `until` from the query parameters
  const urlSearchParamsObj = new URLSearchParams(window.location.search);
  const urlSearchParams = Object.fromEntries(urlSearchParamsObj.entries());
  const { since: sinceParam, until: untilParam } = urlSearchParams;
  const initialSince = sinceParam ? parseISO(sinceParam) : thisWeekStart;
  const initialUntil = untilParam
    ? endOfDay(parseISO(untilParam))
    : thisWeekEnd;

  const [loading, setLoading] = useState<boolean>(true);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [since, setSince] = useState<Date>(initialSince);
  const [until, setUntil] = useState<Date>(initialUntil);

  const loadTimeEntries = useCallback(async () => {
    const pathname = window.location.pathname;
    if (pathname === "/") {
      return;
    }

    const params = {
      since: formatISO(since, {
        representation: "date",
      }),
      until: formatISO(until, {
        representation: "date",
      }),
    };

    // save `since` and `until` to the query parameters
    const searchParams = new URLSearchParams(params);
    const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
    window.history.pushState(null, "", newUrl);

    const url = `/api${pathname}`;
    const response = await axios.get(url, { params });
    setTimeEntries(response.data);
    setLoading(false);
  }, [since, until]);

  useEffect(() => {
    setTimeEntries([]);
    setLoading(true);
    loadTimeEntries();

    // load every 2 minutes
    const interval = setInterval(loadTimeEntries, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadTimeEntries]);

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
            onChangeUntil={(newUntil) => setUntil(endOfDay(newUntil))}
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
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Button
            onClick={() => {
              setTimeEntries([]);
              setLoading(true);
              loadTimeEntries();
            }}
            sx={{ mb: 1 }}
            variant="outlined"
          >
            Refresh
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
