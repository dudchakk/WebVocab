import { useEffect, useState, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import { Button, Typography, Box, CircularProgress } from "@mui/material";
import { CHECK_WORD_URL } from "../../consts";
import { DirectionEnum } from "./PractiseSelector";
import { fetchExampleSentenceForWord } from "../../openai/exampleSentence";

export enum ActionEnum {
  right = "Right",
  wrong = "Wrong",
}

const getNextWord = async (
  direction: DirectionEnum | undefined,
  id?: number,
  action?: ActionEnum
) => {
  const idParam = id ? `&id=${id}` : "";
  const actionParam = action ? `&action=${action}` : "";

  const response = await fetch(
    `${CHECK_WORD_URL}&Direction=${direction}${idParam}${actionParam}`
  );
  if (!response.ok) throw new Error("Не вдалося завантажити слово");
  return await response.json();
};

function underlineWordInSentence(sentence: string, word: string): ReactNode {
  const trimmed = word.trim();
  if (!trimmed) return sentence;
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(escaped, "gi");
  const parts: ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const m of sentence.matchAll(re)) {
    const idx = m.index ?? 0;
    if (idx > last) parts.push(sentence.slice(last, idx));
    parts.push(<u key={`u-${key++}`}>{m[0]}</u>);
    last = idx + m[0].length;
  }
  if (last < sentence.length) parts.push(sentence.slice(last));
  return parts.length > 0 ? <>{parts}</> : sentence;
}

const PracticePage = () => {
  const { direction } = useParams<{
    direction: DirectionEnum;
  }>();
  const [currentWord, setCurrentWord] = useState<{
    word: string;
    translation: string;
    id: number;
  } | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exampleSentence, setExampleSentence] = useState<string | null>(null);
  const [exampleLoading, setExampleLoading] = useState(false);
  const [exampleError, setExampleError] = useState<string | null>(null);

  const loadWord = async (action?: ActionEnum) => {
    try {
      setLoading(true);
      const word = await getNextWord(direction, currentWord?.id, action);
      setCurrentWord(word);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setShowTranslation(false);
      setExampleSentence(null);
      setExampleError(null);
      setExampleLoading(false);
    }
  };

  useEffect(() => {
    loadWord();
  }, [direction]);

  useEffect(() => {
    if (!showTranslation || !currentWord || !direction) {
      return;
    }

    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      setExampleError(
        "Додайте OPENAI_API_KEY (або VITE_OPENAI_API_KEY) у frontend/.env.local і перезапустіть dev-сервер."
      );
      return;
    }

    const wordForExample =
      direction === DirectionEnum.en
        ? currentWord.word
        : currentWord.translation;
    const languageLabel =
      direction === DirectionEnum.en ? "English" : "Ukrainian";

    const controller = new AbortController();
    let cancelled = false;

    setExampleLoading(true);
    setExampleError(null);
    setExampleSentence(null);

    fetchExampleSentenceForWord(
      apiKey,
      wordForExample,
      languageLabel,
      controller.signal
    )
      .then((sentence) => {
        if (!cancelled) setExampleSentence(sentence);
      })
      .catch((err: unknown) => {
        if (cancelled || (err instanceof Error && err.name === "AbortError")) {
          return;
        }
        setExampleError("Не вдалося згенерувати приклад речення.");
      })
      .finally(() => {
        if (!cancelled) setExampleLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [showTranslation, currentWord, direction]);

  const handleCheck = () => {
    setShowTranslation(true);
  };

  const handleAnswer = async (action: ActionEnum) => {
    await loadWord(action);
  };

  if (loading || !currentWord)
    return <Typography>Завантаження...</Typography>;

  const targetWord =
    direction === DirectionEnum.en
      ? currentWord.word
      : currentWord.translation;

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      height="calc(100vh - 64px)"
      width="350"
    >
      <Box
        width="100%"
        maxWidth="500px"
        p={4}
        borderRadius={2}
        boxShadow={3}
        bgcolor="#f9f9f9"
      >
        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
          Слово:{" "}
          <strong>
            {direction === DirectionEnum.uk
              ? currentWord.translation
              : currentWord.word}
          </strong>
        </Typography>

        {!showTranslation ? (
          <Button variant="contained" onClick={handleCheck}>
            Перевірити
          </Button>
        ) : (
          <>
            <Typography variant="body1" sx={{ marginTop: 2, fontSize: 18 }}>
              Переклад:{" "}
              <strong>
                {direction === DirectionEnum.uk
                  ? currentWord.word
                  : currentWord.translation}
              </strong>
            </Typography>

            <Box sx={{ marginTop: 2, minHeight: 48 }}>
              {exampleLoading && (
                <Box display="flex" alignItems="center" gap={1}>
                  <CircularProgress size={20} />
                  <Typography variant="body2" color="text.primary">
                    Готуємо приклад речення…
                  </Typography>
                </Box>
              )}
              {!exampleLoading && exampleSentence && (
                <Typography variant="body2" color="text.primary">
                  Приклад:{" "}
                  <Box
                    component="span"
                    sx={{ fontStyle: "italic" }}
                  >
                    {underlineWordInSentence(exampleSentence, targetWord)}
                  </Box>
                </Typography>
              )}
              {!exampleLoading && exampleError && (
                <Typography variant="body2" color="error">
                  {exampleError}
                </Typography>
              )}
            </Box>

            <Box display="flex" justifyContent="space-around" marginTop={3} gap={1}>
              <Button
                color="success"
                variant="outlined"
                onClick={() => handleAnswer(ActionEnum.right)}
              >
                Правильно
              </Button>
              <Button
                color="error"
                variant="outlined"
                onClick={() => handleAnswer(ActionEnum.wrong)}
              >
                Неправильно
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};

export default PracticePage;
