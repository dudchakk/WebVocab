import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DAILY_STAT_URL } from "../consts";

type DailyStatApiRow = {
  d: string;
  e2u_right_count: string | number | null;
  e2u_wrong_count: string | number | null;
  u2e_right_count: string | number | null;
  u2e_wrong_count: string | number | null;
};

type DailyStatRow = {
  day: string;
  e2uRight: number;
  e2uWrong: number;
  u2eRight: number;
  u2eWrong: number;
  total: number;
  rightTotal: number;
  wrongTotal: number;
};

const toCount = (value: string | number | null): number => {
  if (value === null) {
    return 0;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const fetchDailyStats = async (): Promise<DailyStatRow[]> => {
  const response = await fetch(DAILY_STAT_URL);
  if (!response.ok) {
    throw new Error("Не вдалося отримати статистику");
  }

  const data = (await response.json()) as DailyStatApiRow[];

  return data
    .map((row) => {
      const e2uRight = toCount(row.e2u_right_count);
      const e2uWrong = toCount(row.e2u_wrong_count);
      const u2eRight = toCount(row.u2e_right_count);
      const u2eWrong = toCount(row.u2e_wrong_count);
      const rightTotal = e2uRight + u2eRight;
      const wrongTotal = e2uWrong + u2eWrong;

      return {
        day: row.d,
        e2uRight,
        e2uWrong,
        u2eRight,
        u2eWrong,
        rightTotal,
        wrongTotal,
        total: rightTotal + wrongTotal,
      };
    })
    .reverse();
};

export default function Statistics() {
  const [stats, setStats] = useState<DailyStatRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const rows = await fetchDailyStats();
        setStats(rows);
      } catch {
        setError("Не вдалося завантажити статистику");
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const summary = useMemo(() => {
    return stats.reduce(
      (acc, row) => {
        acc.total += row.total;
        acc.right += row.rightTotal;
        acc.wrong += row.wrongTotal;
        return acc;
      },
      { total: 0, right: 0, wrong: 0 }
    );
  }, [stats]);

  const accuracy =
    summary.total > 0 ? Math.round((summary.right / summary.total) * 100) : 0;

  if (loading) {
    return (
      <Box sx={{ mt: "120px", display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, mt: "80px", display: "grid", gap: 3 }}>
      <Box>
        <Typography variant="h5">Статистика за 30 днів</Typography>
        <Typography variant="body1" color="text.secondary">
          Всього відповідей: {summary.total} | Правильних: {summary.right} |
          Неправильних: {summary.wrong} | Точність: {accuracy}%
        </Typography>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      <Paper sx={{ p: 2, height: 320 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Денна активність
        </Typography>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={stats}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} minTickGap={20} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="total" name="Всього" stroke="#1976d2" />
            <Line
              type="monotone"
              dataKey="rightTotal"
              name="Правильні"
              stroke="#2e7d32"
            />
            <Line
              type="monotone"
              dataKey="wrongTotal"
              name="Неправильні"
              stroke="#d32f2f"
            />
          </LineChart>
        </ResponsiveContainer>
      </Paper>

      <Paper sx={{ p: 2, height: 320 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Розподіл за напрямками
        </Typography>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} minTickGap={20} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="e2uRight" name="Eng→Ukr правильно" fill="#42a5f5" />
            <Bar dataKey="e2uWrong" name="Eng→Ukr неправильно" fill="#90caf9" />
            <Bar dataKey="u2eRight" name="Ukr→Eng правильно" fill="#66bb6a" />
            <Bar dataKey="u2eWrong" name="Ukr→Eng неправильно" fill="#ef9a9a" />
          </BarChart>
        </ResponsiveContainer>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#c0e1fc" }}>
              <TableCell sx={{ fontWeight: "bold" }}>День</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Eng→Ukr ✓</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Eng→Ukr ✗</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Ukr→Eng ✓</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Ukr→Eng ✗</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Всього</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stats.map((row, index) => (
              <TableRow
                key={row.day}
                sx={{ backgroundColor: index % 2 === 0 ? "#ffffff" : "#F9F9F9" }}
              >
                <TableCell>{row.day}</TableCell>
                <TableCell>{row.e2uRight}</TableCell>
                <TableCell>{row.e2uWrong}</TableCell>
                <TableCell>{row.u2eRight}</TableCell>
                <TableCell>{row.u2eWrong}</TableCell>
                <TableCell>{row.total}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}