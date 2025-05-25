import { DELETE_WORD_URL, UPDATE_WORD_URL } from '../../consts'
import WordForm from './WordForm'
import { useSearchParams } from 'react-router'

const UpdateWord = () => {
  const [searchParams] = useSearchParams();
  const prevWord = searchParams.get("word") || "";
  const prevTranslation = searchParams.get("translation") || "";

  return (
    <WordForm
      mode="edit"
      initialWord={prevWord}
      initialTranslation={prevTranslation}
      onSubmit={async (word, translation) => {
        try {
          const response = await fetch(
            `${UPDATE_WORD_URL}&key=${prevWord}&word=${word}&translation=${translation}`
          )
          if (!response.ok) throw new Error('Помилка при додаванні')
          console.log(response.json())
          alert('Слово оновлено!')
        } catch (error) {
          alert('Не вдалося оновити слово. Спробуйте ще раз.')
        }
      }}
      onDelete={async () => {
        try {
          const response = await fetch(
            `${DELETE_WORD_URL}&key=${prevWord}&word=${prevWord}&translation=${prevTranslation}`
          )
          if (!response.ok) throw new Error('Помилка при видаленні')
          console.log(response.json())
          alert('Слово видалено!')
        } catch (error) {
          alert('Не вдалося видалити слово. Спробуйте ще раз.')
        }
      }}
    />
  )
}

export default UpdateWord
