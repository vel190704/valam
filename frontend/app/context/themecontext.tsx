'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'

type ThemeContextType = {
  dark: boolean
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  dark: false,
  toggleTheme: () => {},
})

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode
}) {
const [dark, setDark] = useState(false)
const [mounted, setMounted] = useState(false)

useEffect(() => {
  const saved = localStorage.getItem('theme') === 'dark'

  document.body.classList.toggle('dark', saved)

  // Delay state updates to next tick
  queueMicrotask(() => {
    setDark(saved)
    setMounted(true)
  })
}, [])

  useEffect(() => {

    if (!mounted) return

    document.body.classList.toggle('dark', dark)

    localStorage.setItem(
      'theme',
      dark ? 'dark' : 'light'
    )

  }, [dark, mounted])

  const toggleTheme = () => {
    setDark(prev => !prev)
  }

  return (
    <ThemeContext.Provider
      value={{
        dark,
        toggleTheme
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)