import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button, Typography, Box } from "@mui/material";
import { CHECK_WORD_URL } from "../../consts";
import { DirectionEnum } from "./PractiseSelector";

export enum ActionEnum { right = "Right", wrong = "Wrong" };

const getNextWord = async (direction: DirectionEnum | undefined, id?: number, action?: ActionEnum) => {
  const idParam = id ? `&id=${id}` : "";
  const actionParam = action ? `&action=${action}` : "";

  const response = await fetch(`${CHECK_WORD_URL}&Direction=${direction}${idParam}${actionParam}`);
  if (!response.ok) throw new Error("Не вдалося завантажити слово");
  return await response.json();
};

const PracticePage = () => {
  const { direction } = useParams<{
    direction: DirectionEnum
  }>();
  const [currentWord, setCurrentWord] = useState<{ word: string; translation: string, id: number } | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadWord = async (action?: ActionEnum) => {
    try {
      setLoading(true);
      const word = await getNextWord(direction, currentWord?.id, action);
      console.log(word)
      setCurrentWord(word);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setShowTranslation(false);
    }
  };

  useEffect(() => {
    loadWord();
  }, [direction]);

  const handleCheck = () => {
    setShowTranslation(true);
  };

  const handleAnswer = async (action: ActionEnum) => {
    await loadWord(action);
  };

  if (loading || !currentWord) return <Typography>Завантаження...</Typography>;

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
        <Typography variant="h5" gutterBottom sx={{ mb: 3}}>
          Слово: <strong>{ direction === DirectionEnum.uk ? currentWord.translation : currentWord.word}</strong>
        </Typography>

        {!showTranslation ? (
          <Button variant="contained" onClick={handleCheck}>
            Перевірити
          </Button>
        ) : (
          <>
            <Typography variant="body1" sx={{ marginTop: 2, fontSize: 18 }}>
              Переклад: <strong>{direction === DirectionEnum.uk ? currentWord.word : currentWord.translation}</strong>
            </Typography>
            <Box display="flex" justifyContent="space-around" marginTop={3} gap={1}>
              <Button color="success" variant="outlined" onClick={() => handleAnswer(ActionEnum.right)}>
                Правильно
              </Button>
              <Button color="error" variant="outlined" onClick={() => handleAnswer(ActionEnum.wrong)}>
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
