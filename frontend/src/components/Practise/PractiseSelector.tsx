import { Button, Stack, Typography, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";

export enum DirectionEnum { en = "EngToUkr", uk = "UkrToEng" };

const PracticeSelector = () => {
  const navigate = useNavigate();

  const handleSelect = (direction: DirectionEnum) => {
    navigate(`/practice/${direction}`);
  };

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
      <Typography variant="h5" gutterBottom textAlign="center" sx={{mb: 4}}>
        Оберіть режим повторення
      </Typography>
      <Stack spacing={3}>
        <Button variant="outlined" onClick={() => handleSelect(DirectionEnum.en)}>
          Англійське слово → Український переклад
        </Button>
        <Button variant="outlined" onClick={() => handleSelect(DirectionEnum.uk)}>
          Українське слово → Англійський переклад
        </Button>
      </Stack>
    </Box>
    </Box>
  );
};

export default PracticeSelector;
