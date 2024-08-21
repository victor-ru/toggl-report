import * as React from "react";
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
  endOfYesterday,
} from "date-fns";
import { DateRangePicker } from "./components/DateRangePicker";
import { TimeTable, TimeEntry } from "./components/TimeTable";
import { useConfirm } from "material-ui-confirm";

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

  const confirm = useConfirm();

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

    setTimeEntries([]);
    setLoading(true);

    const url = `/api${pathname}`;
    const response = await axios.get(url, { params });
    setTimeEntries(response.data);
    setLoading(false);
  }, [since, until]);

  useEffect(() => {
    loadTimeEntries();

    // load every 20 seconds
    const interval = setInterval(loadTimeEntries, 15000);
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

  // if there are not time entries to be paid, the payment button will be disabled
  const totalDue = timeEntries.reduce((res, row) => {
    return res + row.due_amount;
  }, 0);

  // payments can only be made for dates before yesterday
  // so that incomplete days are not marked as paid
  const datesAllowPayment = since < until && until < endOfYesterday();

  // payment button caption displays additional information below the button
  let paymentButtonCaption = `Payment amount is $${totalDue.toFixed(2)}`;
  if (totalDue === 0) {
    paymentButtonCaption = "No payment required";
  }
  if (!datesAllowPayment) {
    paymentButtonCaption = `Only dates before ${formatISO(endOfYesterday(), {
      representation: "date",
    })} can be marked as payed`;
  }

  // disabled the payment button if a payment cannot be made
  const paymentButtonDisabled = totalDue === 0 || !datesAllowPayment || loading;

  const handleClickPaymentButton = async () => {
    const items = timeEntries
      .filter((row) => row.due_amount > 0)
      .map((row) => `${row.project}: ${row.description}`);
    const uniqueItems = [...new Set(items)];

    try {
      await confirm({
        description: (
          <>
            All the visible rows will be marked as paid
            <br />
            <br />
            Description:
            <br />
            <code
              style={{
                display: "block",
                padding: 10,
                border: "1px solid #ccc",
                borderRadius: 5,
                backgroundColor: "whitesmoke",
                maxHeight: 150,
                overflow: "auto",
                fontSize: 12,
              }}
            >
              {uniqueItems.map((item, index) => (
                <>
                  - {item}
                  <br />
                </>
              ))}
            </code>
            <br />
            Total payment amount is <b>${totalDue.toFixed(2)}</b>
          </>
        ),
      });

      setTimeEntries([]);
      setLoading(true);

      const url = `/api${window.location.pathname}/set_paid${window.location.search}`;
      await axios.post(url);
      loadTimeEntries();
    } catch (_) {
      return;
    }
  };

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
            onClick={handleClickPaymentButton}
            sx={{ mb: 1 }}
            color="success"
            variant="contained"
            disabled={paymentButtonDisabled}
          >
            Mark All As Paid
          </Button>
          {!loading && (
            <Typography variant="body2">{paymentButtonCaption}</Typography>
          )}
        </Box>
      </Box>
    </Container>
  );
}
