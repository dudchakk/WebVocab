import './App.css'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import Header from './components/Header'
import { Route, Routes } from 'react-router'
import Dictionary from './components/Dictionary'
import AddWord from './components/WordForm/AddWord'
import Statistics from './components/Statistics'
import UpdateWord from './components/WordForm/UpdateWord'
import PracticeSelector from './components/Practise/PractiseSelector'
import Practice from './components/Practise/Practise'
// import { useEffect } from 'react'

const theme = createTheme({
  palette: {
    mode: 'light',
    text: {
      primary: '#000000',
      secondary: '#212121',
    },
  },
})

function App() {
  // useEffect(() => {
  //   const getData = async () => {
  //     const response = await fetch(
  //       'https://studyenglishwords.edu.eu.org/CheckWord.php?Direction=EngToUkr&id=704&action=Wrong&mode=json'
  //     )
  //     const result = await response.json()
  //     return result
  //   }
  //   console.log(getData())
  // }, [])
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Header />
      <Routes>
        <Route path='/' element={<Dictionary />} />
        <Route path='/add-word' element={<AddWord />} />
        <Route path='/update-word' element={<UpdateWord />} />
        <Route path='/practice' element={<PracticeSelector />} />
        <Route path="/practice/:direction" element={<Practice />} />
        <Route path='/statistics' element={<Statistics />} />
      </Routes>
    </ThemeProvider>
  )
}

export default App
