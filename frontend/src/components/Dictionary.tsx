import { useEffect, useRef, useState } from "react";
import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  SelectChangeEvent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Typography,
} from "@mui/material";
import { WORDS_URL } from "../consts";
import { useNavigate } from "react-router";
import { fetchSuggestedNewWords } from "../openai/suggestNewWords";

type Word = {
  id: number;
  word: string;
  translation: string;
  rank_en?: number;
  rank_uk?: number;
};

type SortBy = "n" | "t" | "te" | "tu" | "date";

const defaultPaginationParams = "&pn=1&limit=200&2";
const SUGGEST_SAMPLE_PARAMS = "&pn=1&limit=50";

const fetchAllWords = async (): Promise<Word[]> => {
  const response = await fetch(
    `${WORDS_URL}${defaultPaginationParams}`
  );
  const result = await response.json();
  return result;
};

const fetchSortedWords = async (sortBy: SortBy): Promise<Word[]> => {
  const sortByParam = sortBy !== "date" ? `&order=${sortBy}` : "";
  const response = await fetch(
    `${WORDS_URL}${defaultPaginationParams}${sortByParam}`
  );
  const result = await response.json();
  return result;
}

const Dictionary = () => {
  const [allWords, setAllWords] = useState<Word[]>([]);
  const [search, setSearch] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [suggestText, setSuggestText] = useState<string | null>(null);
  const suggestAbortRef = useRef<AbortController | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchAllWords().then(setAllWords);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleSortChange = (e: SelectChangeEvent<string>) => {
    setSortBy(e.target.value as SortBy);
    fetchSortedWords(e.target.value as SortBy).then(setAllWords);
  };

  const filteredWords = allWords.filter(
    (w) =>
      w.word.toLowerCase().includes(search.toLowerCase()) ||
      w.translation.toLowerCase().includes(search.toLowerCase())
  );

  const handleSuggestNewWords = () => {
    setSuggestOpen(true);
    setSuggestText(null);
    setSuggestError(null);
    suggestAbortRef.current?.abort();
    const controller = new AbortController();
    suggestAbortRef.current = controller;

    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      setSuggestError(
        "Додайте OPENAI_API_KEY (або VITE_OPENAI_API_KEY) у frontend/.env.local і перезапустіть dev-сервер."
      );
      return;
    }

    setSuggestLoading(true);
    (async () => {
      try {
        const response = await fetch(`${WORDS_URL}${SUGGEST_SAMPLE_PARAMS}`);
        if (!response.ok) {
          throw new Error("Не вдалося завантажити слова зі словника");
        }
        const words = (await response.json()) as Word[];
        const sample = words
          .slice(0, 50)
          .map((w) => ({ word: w.word, translation: w.translation }));
        if (sample.length === 0) {
          throw new Error("У словнику немає слів для аналізу");
        }
        const text = await fetchSuggestedNewWords(
          apiKey,
          sample,
          controller.signal
        );
        if (!controller.signal.aborted) {
          setSuggestText(text);
        }
      } catch (e) {
        if (controller.signal.aborted) return;
        setSuggestError(
          e instanceof Error ? e.message : "Не вдалося отримати пропозиції"
        );
      } finally {
        if (!controller.signal.aborted) {
          setSuggestLoading(false);
        }
      }
    })();
  };

  const handleSuggestClose = () => {
    suggestAbortRef.current?.abort();
    suggestAbortRef.current = null;
    setSuggestOpen(false);
    setSuggestLoading(false);
    setSuggestError(null);
    setSuggestText(null);
  };

  return (
    <Box sx={{ padding: 4 }}>
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap", marginTop: "100px", alignItems: "center" }}>
        <TextField
          label="Пошук слова або перекладу"
          variant="outlined"
          value={search}
          onChange={handleSearchChange}
          sx={{ minWidth: 250 }}
        />

        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="sort-label">Сортувати за</InputLabel>
          <Select
            labelId="sort-label"
            value={sortBy}
            onChange={handleSortChange}
            label="Сортувати за"
          >
            <MenuItem value="date">Датою (спочатку нові)</MenuItem>
            <MenuItem value="n">Назвою (англійською)</MenuItem>
            <MenuItem value="t">Перекладом (українською)</MenuItem>
            <MenuItem value="te">Правильні (англ. → укр.)</MenuItem>
            <MenuItem value="tu">Правильні (укр. → англ.)</MenuItem>
          </Select>
        </FormControl>

        <Button variant="outlined" onClick={handleSuggestNewWords}>
          Запропонувати нові слова
        </Button>
      </Box>

      <Dialog
        open={suggestOpen}
        onClose={handleSuggestClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Нові слова за вашим словником</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Використано перші 50 слів зі словника (за поточним порядком на сервері:
            датою додавання, новіші спочатку).
          </Typography>
          {suggestLoading && (
            <Box display="flex" alignItems="center" gap={2} py={2}>
              <CircularProgress size={28} />
              <Typography>Аналізуємо словник і звертаємось до моделі…</Typography>
            </Box>
          )}
          {!suggestLoading && suggestError && (
            <Typography color="error">{suggestError}</Typography>
          )}
          {!suggestLoading && suggestText && (
            <Typography
              component="pre"
              sx={{
                m: 0,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                fontFamily: "inherit",
                fontSize: "0.95rem",
              }}
            >
              {suggestText}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSuggestClose}>Закрити</Button>
        </DialogActions>
      </Dialog>

      <TableContainer component={Paper} sx={{marginTop: "50px"}}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#c0e1fc" }}>
              <TableCell sx={{ borderRight: "1px solid #ccc", fontWeight: "bold", color: "#37474F" }}>Слово (іноземна мова)</TableCell>
              <TableCell sx={{ borderRight: "1px solid #ccc", fontWeight: "bold", color: "#37474F" }}>Переклад (українська)</TableCell>
              <TableCell sx={{ borderRight: "1px solid #ccc", fontWeight: "bold", color: "#37474F" }}>Правильні відповіді (англ. → укр.)</TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "#37474F" }}>Правильні відповіді (укр. → англ.)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredWords.map((word, index) => (
              <TableRow key={word.id}  sx={{
                backgroundColor: index % 2 === 0 ? "#ffffff" : "#F9F9F9",
              }}>
                <TableCell sx={{ borderRight: "1px solid #ccc",
                  '&:hover': {
                    textDecoration: 'underline',
                    color: '#1976d2',
                    cursor: 'pointer',
                  },
                 }} onClick={() => {
                  navigate(`/update-word?word=${word.word}&translation=${word.translation}`)
                }}>{word.word}</TableCell>
                <TableCell sx={{ borderRight: "1px solid #ccc" }}>{word.translation}</TableCell>
                <TableCell sx={{ borderRight: "1px solid #ccc" }}>{word.rank_en}</TableCell>
                <TableCell>{word.rank_uk}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Dictionary;
