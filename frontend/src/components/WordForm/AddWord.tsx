import { ADD_WORD_URL } from '../../consts'
import WordForm from './WordForm'

const AddWord = () => {
  return (
    <WordForm
      mode='add'
      onSubmit={async (word, translation) => {
        try {
          const response = await fetch(
            `${ADD_WORD_URL}&word=${word}&translation=${translation}`
          )
          if (!response.ok) throw new Error('Помилка при додаванні')
          console.log(response.json())
          alert('Слово додано!')
        } catch (error) {
          alert('Не вдалося додати слово. Спробуйте ще раз.')
        }
      }}
    />
  )
}

export default AddWord
