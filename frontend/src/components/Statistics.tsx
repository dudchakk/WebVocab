import { useEffect, useMemo, useState } from "react"
import { Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
} from "recharts"
import { DAILY_STAT_URL } from "../consts"

type DailyStatApiRow = {
  d: string
  e2u_right_count: string | number | null
  e2u_wrong_count: string | number | null
  u2e_right_count: string | number | null
  u2e_wrong_count: string | number | null
}

type DailyStatRow = {
  day: string
  e2uRight: number
  e2uWrong: number
  u2eRight: number
  u2eWrong: number
  total: number
  rightTotal: number
  wrongTotal: number
}

const toCount = (value: string | number | null): number => {
  if (value === null) {
    return 0
  }
  const parsed = Number(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

const fetchDailyStats = async (): Promise<DailyStatRow[]> => {
  const response = await fetch(DAILY_STAT_URL)
  if (!response.ok) {
    throw new Error("Не вдалося отримати статистику")
  }

  const data = (await response.json()) as DailyStatApiRow[]

  return data
    .map((row) => {
      const e2uRight = toCount(row.e2u_right_count)
      const e2uWrong = toCount(row.e2u_wrong_count)
      const u2eRight = toCount(row.u2e_right_count)
      const u2eWrong = toCount(row.u2e_wrong_count)
      const rightTotal = e2uRight + u2eRight
      const wrongTotal = e2uWrong + u2eWrong

      return {
        day: row.d,
        e2uRight,
        e2uWrong,
        u2eRight,
        u2eWrong,
        rightTotal,
        wrongTotal,
        total: rightTotal + wrongTotal,
      }
    })
    .reverse()
}

export default function Statistics() {
  const [stats, setStats] = useState<DailyStatRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true)
        setError(null)
        const rows = await fetchDailyStats()
        setStats(rows)
      } catch {
        setError("Не вдалося завантажити статистику")
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  const summary = useMemo(() => {
    return stats.reduce(
      (acc, row) => {
        acc.total += row.total
        acc.right += row.rightTotal
        acc.wrong += row.wrongTotal
        return acc
      },
      { total: 0, right: 0, wrong: 0 }
    )
  }, [stats])

  const accuracy =
    summary.total > 0 ? Math.round((summary.right / summary.total) * 100) : 0

  if (loading) {
    return (
      <div className="flex justify-center pt-28">
        <Loader2 className="size-10 animate-spin text-muted-foreground" aria-label="Завантаження" />
      </div>
    )
  }

  return (
    <div className="grid gap-6 p-6 pt-20">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Статистика за 30 днів</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Всього відповідей: {summary.total} | Правильних: {summary.right} |
          Неправильних: {summary.wrong} | Точність: {accuracy}%
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Помилка</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="h-[360px]">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Денна активність</CardTitle>
        </CardHeader>
        <CardContent className="h-[280px] px-2 pb-4">
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
        </CardContent>
      </Card>

      <Card className="h-[360px]">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Розподіл за напрямками</CardTitle>
        </CardHeader>
        <CardContent className="h-[280px] px-2 pb-4">
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
        </CardContent>
      </Card>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border bg-[#c0e1fc] hover:bg-[#c0e1fc]">
              <TableHead className="font-bold">День</TableHead>
              <TableHead className="font-bold">Eng→Ukr ✓</TableHead>
              <TableHead className="font-bold">Eng→Ukr ✗</TableHead>
              <TableHead className="font-bold">Ukr→Eng ✓</TableHead>
              <TableHead className="font-bold">Ukr→Eng ✗</TableHead>
              <TableHead className="font-bold">Всього</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stats.map((row, index) => (
              <TableRow
                key={row.day}
                className={
                  index % 2 === 0 ? "bg-white hover:bg-muted/50" : "bg-[#F9F9F9] hover:bg-muted/50"
                }
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
      </div>
    </div>
  )
}
