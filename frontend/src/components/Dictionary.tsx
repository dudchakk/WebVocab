import { useEffect, useState } from "react";
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
} from "@mui/material";
import { WORDS_URL } from "../consts";
import { useNavigate } from "react-router";

type Word = {
  id: number;
  word: string;
  translation: string;
  rank_en?: number;
  rank_uk?: number;
};

type SortBy = "n" | "t" | "te" | "tu" | "date";

const defaultPaginationParams = "&pn=1&limit=200&2";

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

  return (
    <Box sx={{ padding: 4 }}>
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap", marginTop: "100px" }}>
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
      </Box>

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
