"use client"

import * as React from "react"

interface TabsProps {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
}

interface TabsListProps {
  className?: string
  children: React.ReactNode
}

interface TabsTriggerProps {
  value: string
  className?: string
  children: React.ReactNode
}

interface TabsContentProps {
  value: string
  className?: string
  children: React.ReactNode
}

const TabsContext = React.createContext<{
  value: string
  onValueChange: (value: string) => void
} | null>(null)

const Tabs = ({ value, onValueChange, children }: TabsProps) => {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div>{children}</div>
    </TabsContext.Provider>
  )
}

const TabsList = ({ className, children }: TabsListProps) => (
  <div className={`inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500 ${className || ''}`}>
    {children}
  </div>
)

const TabsTrigger = ({ value, className, children }: TabsTriggerProps) => {
  const context = React.useContext(TabsContext)
  if (!context) throw new Error('TabsTrigger must be used within Tabs')
  
  const isActive = context.value === value
  
  return (
    <button
      onClick={() => context.onValueChange(value)}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${
        isActive 
          ? 'bg-white text-gray-900 shadow-sm' 
          : 'hover:bg-gray-50 hover:text-gray-900'
      } ${className || ''}`}
    >
      {children}
    </button>
  )
}

const TabsContent = ({ value, className, children }: TabsContentProps) => {
  const context = React.useContext(TabsContext)
  if (!context) throw new Error('TabsContent must be used within Tabs')
  
  if (context.value !== value) return null
  
  return (
    <div className={`mt-2 ${className || ''}`}>
      {children}
    </div>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
