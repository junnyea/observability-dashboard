import { createContext, useContext, useState } from 'react'

const EnvContext = createContext()

export const useEnv = () => {
  const context = useContext(EnvContext)
  if (!context) {
    throw new Error('useEnv must be used within an EnvProvider')
  }
  return context
}

export function EnvProvider({ children }) {
  const [selectedEnv, setSelectedEnv] = useState('DEV')

  return (
    <EnvContext.Provider value={{ selectedEnv, setSelectedEnv }}>
      {children}
    </EnvContext.Provider>
  )
}
