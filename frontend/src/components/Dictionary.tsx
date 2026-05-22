import { useEffect, useMemo, useRef, useState } from "react"
import { Lightbulb, Loader2, Sparkles } from "lucide-react"
import { useNavigate } from "react-router"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ADD_WORD_URL, WORDS_URL } from "../consts"
import { fetchSuggestedNewWords } from "../openai/suggestNewWords"

type Word = {
  id: number
  word: string
  translation: string
  rank_en?: number
  rank_uk?: number
}

type SortBy = "n" | "t" | "te" | "tu" | "date"

type SuggestPhase = "intro" | "loading" | "result"

type SuggestedWord = {
  word: string
  translation: string
}

type SuggestResponse = {
  insight: string
  explanation: string
  words: SuggestedWord[]
}

const emptySuggestResponse: SuggestResponse = {
  insight: "",
  explanation: "",
  words: [],
}

function parseSuggestResponse(text: string): SuggestResponse {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    const objectMatch = text.match(/\{[\s\S]*\}/)
    if (!objectMatch) return emptySuggestResponse
    try {
      parsed = JSON.parse(objectMatch[0])
    } catch {
      return emptySuggestResponse
    }
  }

  if (typeof parsed !== "object" || parsed === null) return emptySuggestResponse

  const value = parsed as {
    insight?: unknown
    explanation?: unknown
    words?: unknown
  }

  const words = Array.isArray(value.words)
    ? value.words
        .filter(
          (item): item is { word: string; translation: string } =>
            typeof item === "object" &&
            item !== null &&
            typeof (item as { word?: unknown }).word === "string" &&
            typeof (item as { translation?: unknown }).translation === "string"
        )
        .map((item) => ({
          word: item.word.trim(),
          translation: item.translation.trim(),
        }))
        .filter((item) => item.word && item.translation)
    : []

  return {
    insight: typeof value.insight === "string" ? value.insight.trim() : "",
    explanation:
      typeof value.explanation === "string" ? value.explanation.trim() : "",
    words,
  }
}

const defaultPaginationParams = "&pn=1&limit=200&2"
const SUGGEST_SAMPLE_PARAMS = "&pn=1&limit=200"
const SUGGEST_PAGE_SIZE = 10

const fetchAllWords = async (): Promise<Word[]> => {
  const response = await fetch(`${WORDS_URL}${defaultPaginationParams}`)
  const result = await response.json()
  return result
}

const fetchSortedWords = async (sortBy: SortBy): Promise<Word[]> => {
  const sortByParam = sortBy !== "date" ? `&order=${sortBy}` : ""
  const response = await fetch(
    `${WORDS_URL}${defaultPaginationParams}${sortByParam}`
  )
  const result = await response.json()
  return result
}

function SuggestLoadingBlock() {
  return (
    <div
      className="flex min-h-[260px] flex-col items-center justify-center gap-10 px-2 py-6"
      aria-busy="true"
      aria-live="polite"
    >
      <Loader2
        className="size-11 shrink-0 animate-spin text-primary"
        aria-hidden
      />
      <p className="max-w-sm text-center text-sm text-muted-foreground">
        Аналізуємо слова і звертаємось до моделі. Зазвичай це займає кілька секунд.
      </p>
    </div>
  )
}

const mapWordsForSuggest = (words: Word[]) =>
  words.map((w) => ({ word: w.word, translation: w.translation }))

const pickSuggestSample = (words: Word[]) => {
  if (words.length <= 100) {
    return mapWordsForSuggest(words)
  }

  const latestWords = words.slice(-50)
  const olderWords = [...words.slice(0, -50)]

  for (let i = olderWords.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[olderWords[i], olderWords[j]] = [olderWords[j], olderWords[i]]
  }

  return mapWordsForSuggest([...latestWords, ...olderWords.slice(0, 50)])
}

const Dictionary = () => {
  const [allWords, setAllWords] = useState<Word[]>([])
  const [search, setSearch] = useState<string>("")
  const [sortBy, setSortBy] = useState<SortBy>("date")
  const [suggestOpen, setSuggestOpen] = useState(false)
  const [suggestPhase, setSuggestPhase] = useState<SuggestPhase>("intro")
  const [suggestError, setSuggestError] = useState<string | null>(null)
  const [suggestText, setSuggestText] = useState<string | null>(null)
  const [addingWords, setAddingWords] = useState<Record<string, boolean>>({})
  const [addedWords, setAddedWords] = useState<Record<string, boolean>>({})
  const [visibleSuggestedCount, setVisibleSuggestedCount] = useState(SUGGEST_PAGE_SIZE)
  const suggestAbortRef = useRef<AbortController | null>(null)

  const navigate = useNavigate()

  const parsedSuggestions = useMemo(
    () => (suggestText ? parseSuggestResponse(suggestText) : emptySuggestResponse),
    [suggestText]
  )

  const existingWordKeys = useMemo(
    () =>
      new Set(
        allWords.map((w) => `${w.word.trim().toLowerCase()}::${w.translation.trim().toLowerCase()}`)
      ),
    [allWords]
  )

  const visibleSuggestedWords = useMemo(
    () => parsedSuggestions.words.slice(0, visibleSuggestedCount),
    [parsedSuggestions.words, visibleSuggestedCount]
  )

  useEffect(() => {
    fetchAllWords().then(setAllWords)
  }, [])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }

  const handleSortChange = (value: string) => {
    const next = value as SortBy
    setSortBy(next)
    fetchSortedWords(next).then(setAllWords)
  }

  const filteredWords = allWords.filter(
    (w) =>
      w.word.toLowerCase().includes(search.toLowerCase()) ||
      w.translation.toLowerCase().includes(search.toLowerCase())
  )

  const openSuggestDialog = () => {
    suggestAbortRef.current?.abort()
    suggestAbortRef.current = null
    setSuggestOpen(true)
    setSuggestPhase("intro")
    setSuggestError(null)
    setSuggestText(null)
    setAddingWords({})
    setAddedWords({})
    setVisibleSuggestedCount(SUGGEST_PAGE_SIZE)
  }

  const runSuggestAnalysis = () => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY
    if (!apiKey) {
      setSuggestError(
        "Потрібен ключ API: додайте OPENAI_API_KEY або VITE_OPENAI_API_KEY у frontend/.env.local і перезапустіть dev-сервер."
      )
      return
    }

    suggestAbortRef.current?.abort()
    const controller = new AbortController()
    suggestAbortRef.current = controller

    setSuggestError(null)
    setSuggestText(null)
    setSuggestPhase("loading")
    setVisibleSuggestedCount(SUGGEST_PAGE_SIZE)

    ;(async () => {
      try {
        const response = await fetch(`${WORDS_URL}${SUGGEST_SAMPLE_PARAMS}`)
        if (!response.ok) {
          throw new Error("Не вдалося завантажити слова зі словника")
        }
        const words = (await response.json()) as Word[]
        const sample = pickSuggestSample(words)
        if (sample.length === 0) {
          throw new Error("У словнику немає слів для аналізу")
        }
        const text = await fetchSuggestedNewWords(
          apiKey,
          sample,
          controller.signal
        )
        if (!controller.signal.aborted) {
          setSuggestText(text)
          setSuggestPhase("result")
          setVisibleSuggestedCount(SUGGEST_PAGE_SIZE)
        }
      } catch (e) {
        if (controller.signal.aborted) return
        setSuggestError(
          e instanceof Error ? e.message : "Не вдалося отримати пропозиції"
        )
        setSuggestPhase("result")
      }
    })()
  }

  const handleSuggestClose = () => {
    suggestAbortRef.current?.abort()
    suggestAbortRef.current = null
    setSuggestOpen(false)
    setSuggestPhase("intro")
    setSuggestError(null)
    setSuggestText(null)
    setAddingWords({})
    setAddedWords({})
    setVisibleSuggestedCount(SUGGEST_PAGE_SIZE)
  }

  const toWordKey = (word: string, translation: string) =>
    `${word.trim().toLowerCase()}::${translation.trim().toLowerCase()}`

  const handleAddSuggestedWord = async (word: string, translation: string) => {
    const key = toWordKey(word, translation)
    if (addingWords[key] || addedWords[key] || existingWordKeys.has(key)) return

    setAddingWords((prev) => ({ ...prev, [key]: true }))
    try {
      const response = await fetch(
        `${ADD_WORD_URL}&word=${encodeURIComponent(word)}&translation=${encodeURIComponent(translation)}`
      )
      if (!response.ok) throw new Error("Не вдалося додати слово")
      setAddedWords((prev) => ({ ...prev, [key]: true }))
      setAllWords((prev) => [{ id: Date.now(), word, translation }, ...prev])
    } catch {
      setSuggestError("Не вдалося додати частину слів. Спробуйте ще раз.")
    } finally {
      setAddingWords((prev) => ({ ...prev, [key]: false }))
    }
  }

  return (
    <div className="p-6 pt-24">
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div className="grid min-w-[250px] gap-2">
          <Label htmlFor="dict-search">Пошук слова або перекладу</Label>
          <Input
            id="dict-search"
            value={search}
            onChange={handleSearchChange}
            placeholder="Введіть текст…"
          />
        </div>

        <div className="grid min-w-[200px] gap-2">
          <Label htmlFor="sort-select">Сортувати за</Label>
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger id="sort-select" className="w-[220px]">
              <SelectValue placeholder="Сортувати за" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Датою (спочатку нові)</SelectItem>
              <SelectItem value="n">Назвою (англійською)</SelectItem>
              <SelectItem value="t">Перекладом (українською)</SelectItem>
              <SelectItem value="te">Правильні (англ. → укр.)</SelectItem>
              <SelectItem value="tu">Правильні (укр. → англ.)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="mb-6 border-primary/25 bg-gradient-to-br from-primary/5 via-card to-card shadow-md ring-1 ring-primary/10">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="flex min-w-0 flex-1 gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Sparkles className="size-5" aria-hidden />
            </div>
            <div className="min-w-0 space-y-1">
              <p className="text-base font-semibold leading-tight text-foreground">
                Розумні підказки нових слів на основі вашого словника
              </p>
              <p className="text-sm leading-snug text-muted-foreground">
              ШІ аналізує ваші слова, визначає рівень і теми та пропонує нову лексику, яка допоможе вам розширити словниковий запас природно — без випадкових слів.
              </p>
            </div>
          </div>
          <Button
            type="button"
            size="lg"
            className="shrink-0 shadow-md sm:min-w-[220px]"
            onClick={openSuggestDialog}
          >
            <Sparkles className="size-4" aria-hidden />
            Отримати підказки ШІ
          </Button>
        </CardContent>
      </Card>

      <Dialog
        open={suggestOpen}
        onOpenChange={(open) => {
          if (!open) handleSuggestClose()
        }}
      >
        <DialogContent
          className="flex max-h-[90vh] max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
          showCloseButton
        >
          <div className="border-b border-border px-4 pb-3 pt-4 pr-12">
            <DialogHeader className="gap-2 text-left pb-[4px]">
              <DialogTitle className="text-lg leading-snug">
                {suggestPhase === "intro"
                  ? "Підказки нових слів"
                  : suggestPhase === "loading"
                    ? "Готуємо підказки…"
                    : suggestError
                      ? "Не вдалося отримати підказки"
                      : "Пропозиції слів"}
              </DialogTitle>
            </DialogHeader>
          </div>

          <div className="min-h-[260px] flex-1 overflow-y-auto px-4 py-4">
            {suggestPhase === "intro" && (
              <div className="mx-auto max-w-prose space-y-3 text-left mt-3">
                <DialogDescription>
                  Перед тим як згенерувати підказки:
                </DialogDescription>
                <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
                  <li>Ми проаналізуємо ваш поточний словник</li>
                  <li>Визначимо теми та рівень знань</li>
                  <li>Підіберемо нові слова, які логічно доповнюють ваш прогрес</li>
                </ul>
                <p className="text-sm text-muted-foreground">
                  Це займе кілька секунд, слова не додаються автоматично — ви самі обираєте, що зберегти.
                </p>
                <div className="flex items-start gap-2 text-sm text-muted-foreground mt-6">
                  <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-500" aria-hidden />
                  <p>Порада: чим більше слів у словнику, тим точніші рекомендації</p>
                </div>
              </div>
            )}

            {suggestPhase === "loading" && <SuggestLoadingBlock />}

            {suggestPhase === "result" && suggestError && (
              <div className="flex min-h-[200px] flex-col justify-center">
                <p className="text-sm text-destructive" role="alert">
                  {suggestError}
                </p>
              </div>
            )}

            {suggestPhase === "result" && !suggestError && suggestText && (
              <div className="space-y-4">
                {parsedSuggestions.insight && (
                  <div className="mx-auto">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Ваш прогрес
                    </p>
                    <div className="rounded-md border border-border bg-muted/30 p-4 text-sm leading-relaxed text-foreground">
                      {parsedSuggestions.insight}
                    </div>
                  </div>
                )}
                {parsedSuggestions.explanation && (
                  <div className="mx-auto">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Чому ці слова
                    </p>
                    <div className="rounded-md border border-border bg-muted/30 p-4 text-sm leading-relaxed text-foreground">
                      {parsedSuggestions.explanation}
                    </div>
                  </div>
                )}

                <p className="mx-auto w-full text-sm font-medium text-foreground mt-5 mb-5">
                  Рекомендовані слова:
                </p>

                <div className="overflow-hidden rounded-md border border-border bg-card">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Слово</TableHead>
                        <TableHead>Переклад</TableHead>
                        <TableHead className="w-[140px] text-right">Дія</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visibleSuggestedWords.map((row) => {
                        const key = toWordKey(row.word, row.translation)
                        const isAdded =
                          addedWords[key] || existingWordKeys.has(key)
                        const isAdding = addingWords[key]
                        return (
                          <TableRow key={key}>
                            <TableCell className="font-medium">{row.word}</TableCell>
                            <TableCell>{row.translation}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                type="button"
                                size="sm"
                                variant={isAdded ? "secondary" : "default"}
                                className={isAdded ? "bg-muted text-muted-foreground hover:bg-muted" : ""}
                                disabled={isAdded || isAdding}
                                onClick={() =>
                                  handleAddSuggestedWord(row.word, row.translation)
                                }
                              >
                                {isAdded ? "Додано" : isAdding ? "Додаємо..." : "Додати"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
                {visibleSuggestedCount < parsedSuggestions.words.length && (
                  <div className="flex justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setVisibleSuggestedCount((prev) =>
                          Math.min(prev + SUGGEST_PAGE_SIZE, parsedSuggestions.words.length)
                        )
                      }
                    >
                      Показати ще
                    </Button>
                  </div>
                )}

                <p className="mx-auto max-w-prose text-center text-xs text-muted-foreground">
                  Підказки згенеровані моделлю; перевіряйте формулювання та переклад перед навчанням.
                </p>
              </div>
            )}
          </div>

          {suggestPhase === "intro" && (
            <div className="flex flex-col-reverse gap-2 border-t border-border bg-muted/30 px-4 py-3 sm:flex-row sm:justify-end">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Пізніше
                </Button>
              </DialogClose>
              <Button type="button" onClick={runSuggestAnalysis}>
                Почати
              </Button>
            </div>
          )}

          {suggestPhase === "result" && (
            <div className="flex justify-end border-t border-border bg-muted/30 px-4 py-3">
              <Button type="button" variant="default" onClick={handleSuggestClose}>
                Готово
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border bg-[#c0e1fc] hover:bg-[#c0e1fc]">
              <TableHead className="border-r border-border font-bold text-[#37474F]">
                Слово (іноземна мова)
              </TableHead>
              <TableHead className="border-r border-border font-bold text-[#37474F]">
                Переклад (українська)
              </TableHead>
              <TableHead className="border-r border-border font-bold text-[#37474F]">
                Правильні відповіді (англ. → укр.)
              </TableHead>
              <TableHead className="font-bold text-[#37474F]">
                Правильні відповіді (укр. → англ.)
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredWords.map((word, index) => (
              <TableRow
                key={word.id}
                className={
                  index % 2 === 0 ? "bg-white hover:bg-muted/50" : "bg-[#F9F9F9] hover:bg-muted/50"
                }
              >
                <TableCell
                  className="cursor-pointer border-r border-border hover:text-primary hover:underline"
                  onClick={() => {
                    navigate(
                      `/update-word?word=${encodeURIComponent(word.word)}&translation=${encodeURIComponent(word.translation)}`
                    )
                  }}
                >
                  {word.word}
                </TableCell>
                <TableCell className="border-r border-border">{word.translation}</TableCell>
                <TableCell className="border-r border-border">{word.rank_en}</TableCell>
                <TableCell>{word.rank_uk}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default Dictionary
