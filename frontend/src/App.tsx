import Header from './components/Header'
import { Route, Routes } from 'react-router'
import Dictionary from './components/Dictionary'
import AddWord from './components/WordForm/AddWord'
import Statistics from './components/Statistics'
import UpdateWord from './components/WordForm/UpdateWord'
import PracticeSelector from './components/Practise/PractiseSelector'
import Practice from './components/Practise/Practise'

function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path='/' element={<Dictionary />} />
        <Route path='/add-word' element={<AddWord />} />
        <Route path='/update-word' element={<UpdateWord />} />
        <Route path='/practice' element={<PracticeSelector />} />
        <Route path="/practice/:direction" element={<Practice />} />
        <Route path='/statistics' element={<Statistics />} />
      </Routes>
    </>
  )
}

export default App
