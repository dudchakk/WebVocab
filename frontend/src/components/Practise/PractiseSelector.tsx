import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useNavigate } from "react-router-dom"

export enum DirectionEnum { en = "EngToUkr", uk = "UkrToEng" }

const PracticeSelector = () => {
  const navigate = useNavigate()

  const handleSelect = (direction: DirectionEnum) => {
    navigate(`/practice/${direction}`)
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 pt-16">
      <Card className="w-full max-w-[500px] shadow-md">
        <CardHeader className="text-center">
          <CardTitle className="mb-2 text-xl">Оберіть режим повторення</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <Button variant="outline" className="h-auto min-h-10 whitespace-normal py-3 text-center" onClick={() => handleSelect(DirectionEnum.en)}>
            Англійське слово → Український переклад
          </Button>
          <Button variant="outline" className="h-auto min-h-10 whitespace-normal py-3 text-center" onClick={() => handleSelect(DirectionEnum.uk)}>
            Українське слово → Англійський переклад
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default PracticeSelector
