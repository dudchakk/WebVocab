import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"

export default function Header() {
  return (
    <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-center border-b border-[#b0d4ef] bg-[#c0e1fc] text-foreground shadow-none">
      <nav className="flex w-full max-w-4xl items-center justify-around px-2">
        <Button variant="ghost" className="text-foreground hover:text-foreground" asChild>
          <Link to="/">Словник</Link>
        </Button>
        <Button variant="ghost" className="text-foreground hover:text-foreground" asChild>
          <Link to="/add-word">Додати слово</Link>
        </Button>
        <Button variant="ghost" className="text-foreground hover:text-foreground" asChild>
          <Link to="/practice">Повторення</Link>
        </Button>
        <Button variant="ghost" className="text-foreground hover:text-foreground" asChild>
          <Link to="/statistics">Статистика</Link>
        </Button>
      </nav>
    </header>
  )
}
