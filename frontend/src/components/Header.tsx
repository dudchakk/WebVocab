import { AppBar, Toolbar, Button, Box } from "@mui/material";
import { Link } from "react-router-dom";

export default function Header() {
  return (
    <AppBar
      position="fixed"
      sx={{ backgroundColor: "#90CAF9", boxShadow: "none" }}
    >
      <Toolbar>
        <Box sx={{ display: "flex", width: "100%", justifyContent: "space-around" }}>
          <Button color="inherit" component={Link} to="/" sx={{
             '&:hover': {
              color: '#000',
            },
          }}>
            Словник
          </Button>
          <Button color="inherit" component={Link} to="/add-word">
            Додати слово
          </Button>
          <Button color="inherit" component={Link} to="/practice">
            Повторення
          </Button>
          <Button color="inherit" component={Link} to="/statistics">
            Статистика
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
