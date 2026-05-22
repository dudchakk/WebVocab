import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type WordFormProps = {
  mode: 'add' | 'edit'
  initialWord?: string
  initialTranslation?: string
  onSubmit: (word: string, translation: string) => void
  onDelete?: () => void
}

const WordForm: React.FC<WordFormProps> = ({ mode, initialWord, initialTranslation, onSubmit, onDelete }) => {
  const [word, setWord] = useState(initialWord ?? '')
  const [translation, setTranslation] = useState(initialTranslation ?? '')

  const handleTranslate = () => {
    const url = `https://translate.google.com/?sl=auto&tl=uk&text=${encodeURIComponent(word)}&op=translate`
    window.open(url, '_blank')
  }

  const isFormValid = word.trim() !== '' && translation.trim() !== ''

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 pt-16">
      <Card className="w-full max-w-[500px] shadow-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-bold">
            {mode === 'add' ? 'Додати нове слово' : 'Редагувати слово'}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="word-field">Слово</Label>
            <Input
              id="word-field"
              value={word}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWord(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="translation-field">Переклад</Label>
            <Input
              id="translation-field"
              value={translation}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTranslation(e.target.value)}
            />
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <Button type="button" variant="outline" onClick={handleTranslate}>
              Перекласти
            </Button>
            <div className="flex flex-wrap items-center gap-2">
              {mode === 'edit' && onDelete && (
                <Button type="button" variant="destructive" onClick={onDelete}>
                  Видалити
                </Button>
              )}
              <Button
                type="button"
                variant={mode === 'add' ? 'secondary' : 'default'}
                onClick={() => {
                  onSubmit(word, translation)
                  if (mode === 'add') {
                    setWord('')
                    setTranslation('')
                  }
                }}
                disabled={!isFormValid}
              >
                {mode === 'add' ? 'Додати' : 'Оновити'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default WordForm
