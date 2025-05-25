import React, { useState } from 'react';
import { Box, Button, TextField, Typography } from '@mui/material';

type WordFormProps = {
  mode: 'add' | 'edit';
  initialWord?: string;
  initialTranslation?: string;
  onSubmit: (word: string, translation: string) => void;
  onDelete?: () => void;
}

const WordForm: React.FC<WordFormProps> = ({ mode, initialWord, initialTranslation, onSubmit, onDelete }) => {
  const [word, setWord] = useState(initialWord ?? "");
  const [translation, setTranslation] = useState(initialTranslation ?? "");

  const handleTranslate = () => {
    const url = `https://translate.google.com/?sl=auto&tl=uk&text=${encodeURIComponent(word)}&op=translate`;
    window.open(url, '_blank');
  };

  const isFormValid = word.trim() !== '' && translation.trim() !== '';

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      height="calc(100vh - 64px)"
    >
      <Box
        width="100%"
        maxWidth="500px"
        p={4}
        borderRadius={2}
        boxShadow={3}
        bgcolor="#f9f9f9"
      >
        <Typography variant="h5" mb={3} textAlign="center" fontWeight="bold">
          {mode === 'add' ? 'Додати нове слово' : 'Редагувати слово'}
        </Typography>

        <TextField
          fullWidth
          label="Слово"
          value={word}
          onChange={(e) => setWord(e.target.value)}
          margin="normal"
        />
        <TextField
          fullWidth
          label="Переклад"
          value={translation}
          onChange={(e) => setTranslation(e.target.value)}
          margin="normal"
        />

        <Box display="flex" justifyContent="space-between" mt={3}>
          <Button variant="outlined" onClick={handleTranslate}>
            Перекласти
          </Button>
          <Box>
            {mode === 'edit' && onDelete && (
              <Button
                variant="outlined"
                color="error"
                onClick={onDelete}
                sx={{ mr: 1 }}
              >
                Видалити
              </Button>
            )}
            <Button
              variant="contained"
              color={mode === 'add' ? 'success' : 'primary'}
              onClick={() => {
                onSubmit(word, translation);
                if (mode === 'add') {
                  setWord('');
                  setTranslation('');
                }
              }}
              disabled={!isFormValid}
            >
              {mode === 'add' ? 'Додати' : 'Оновити'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default WordForm;
