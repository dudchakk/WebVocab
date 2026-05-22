import { useEffect, useState, type ReactNode } from "react"
import { useParams } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CHECK_WORD_URL } from "../../consts"
import { DirectionEnum } from "./PractiseSelector"
import { fetchExampleSentenceForWord } from "../../openai/exampleSentence"

export enum ActionEnum {
  right = "Right",
  wrong = "Wrong",
}

const getNextWord = async (
  direction: DirectionEnum | undefined,
  id?: number,
  action?: ActionEnum
) => {
  const idParam = id ? `&id=${id}` : ""
  const actionParam = action ? `&action=${action}` : ""

  const response = await fetch(
    `${CHECK_WORD_URL}&Direction=${direction}${idParam}${actionParam}`
  )
  if (!response.ok) throw new Error("Не вдалося завантажити слово")
  return await response.json()
}

function underlineWordInSentence(sentence: string, word: string): ReactNode {
  const trimmed = word.trim()
  if (!trimmed) return sentence
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const re = new RegExp(escaped, "gi")
  const parts: ReactNode[] = []
  let last = 0
  let key = 0
  for (const m of sentence.matchAll(re)) {
    const idx = m.index ?? 0
    if (idx > last) parts.push(sentence.slice(last, idx))
    parts.push(<u key={`u-${key++}`}>{m[0]}</u>)
    last = idx + m[0].length
  }
  if (last < sentence.length) parts.push(sentence.slice(last))
  return parts.length > 0 ? <>{parts}</> : sentence
}

const PracticePage = () => {
  const { direction } = useParams<{
    direction: DirectionEnum
  }>()
  const [currentWord, setCurrentWord] = useState<{
    word: string
    translation: string
    id: number
  } | null>(null)
  const [showTranslation, setShowTranslation] = useState(false)
  const [loading, setLoading] = useState(true)
  const [exampleSentence, setExampleSentence] = useState<string | null>(null)
  const [exampleLoading, setExampleLoading] = useState(false)
  const [exampleError, setExampleError] = useState<string | null>(null)

  const loadWord = async (action?: ActionEnum) => {
    try {
      setLoading(true)
      const word = await getNextWord(direction, currentWord?.id, action)
      setCurrentWord(word)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setShowTranslation(false)
      setExampleSentence(null)
      setExampleError(null)
      setExampleLoading(false)
    }
  }

  useEffect(() => {
    loadWord()
  }, [direction])

  useEffect(() => {
    if (!showTranslation || !currentWord || !direction) {
      return
    }

    const apiKey = import.meta.env.VITE_OPENAI_API_KEY
    if (!apiKey) {
      setExampleError(
        "Додайте OPENAI_API_KEY (або VITE_OPENAI_API_KEY) у frontend/.env.local і перезапустіть dev-сервер."
      )
      return
    }

    const wordForExample =
      direction === DirectionEnum.en
        ? currentWord.word
        : currentWord.translation
    const languageLabel =
      direction === DirectionEnum.en ? "English" : "Ukrainian"

    const controller = new AbortController()
    let cancelled = false

    setExampleLoading(true)
    setExampleError(null)
    setExampleSentence(null)

    fetchExampleSentenceForWord(
      apiKey,
      wordForExample,
      languageLabel,
      controller.signal
    )
      .then((sentence) => {
        if (!cancelled) setExampleSentence(sentence)
      })
      .catch((err: unknown) => {
        if (cancelled || (err instanceof Error && err.name === "AbortError")) {
          return
        }
        setExampleError("Не вдалося згенерувати приклад речення.")
      })
      .finally(() => {
        if (!cancelled) setExampleLoading(false)
      })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [showTranslation, currentWord, direction])

  const handleCheck = () => {
    setShowTranslation(true)
  }

  const handleAnswer = async (action: ActionEnum) => {
    await loadWord(action)
  }

  if (loading || !currentWord)
    return (
      <p className="pt-24 text-center text-muted-foreground">Завантаження...</p>
    )

  const targetWord =
    direction === DirectionEnum.en
      ? currentWord.word
      : currentWord.translation

  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center px-4 pt-16">
      <Card className="w-full max-w-[500px] border-border bg-muted/40 shadow-md">
        <CardContent className="space-y-4 p-6">
          <h2 className="text-xl font-medium leading-snug">
            Слово:{" "}
            <strong>
              {direction === DirectionEnum.uk
                ? currentWord.translation
                : currentWord.word}
            </strong>
          </h2>

          {!showTranslation ? (
            <Button type="button" onClick={handleCheck}>
              Перевірити
            </Button>
          ) : (
            <>
              <p className="mt-2 text-lg">
                Переклад:{" "}
                <strong>
                  {direction === DirectionEnum.uk
                    ? currentWord.word
                    : currentWord.translation}
                </strong>
              </p>

              <div className="min-h-12">
                {exampleLoading && (
                  <div className="flex items-center gap-2">
                    <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden />
                    <span className="text-sm text-muted-foreground">
                      Готуємо приклад речення…
                    </span>
                  </div>
                )}
                {!exampleLoading && exampleSentence && (
                  <p className="text-sm">
                    Приклад:{" "}
                    <span className="italic">
                      {underlineWordInSentence(exampleSentence, targetWord)}
                    </span>
                  </p>
                )}
                {!exampleLoading && exampleError && (
                  <p className="text-sm text-destructive">{exampleError}</p>
                )}
              </div>

              <div className="mt-4 flex flex-wrap justify-around gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="border-green-600 text-green-700 hover:bg-green-50 dark:hover:bg-green-950/30"
                  onClick={() => handleAnswer(ActionEnum.right)}
                >
                  Правильно
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="border-destructive text-destructive hover:bg-destructive/10"
                  onClick={() => handleAnswer(ActionEnum.wrong)}
                >
                  Неправильно
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default PracticePage
