import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from 'react'

type TabsContextValue = {
  value: string
  setValue: (value: string) => void
}

const TabsContext = createContext<TabsContextValue | null>(null)

function useTabsContext() {
  const context = useContext(TabsContext)

  if (!context) {
    throw new Error('Tabs components must be used within Tabs.')
  }

  return context
}

export function Tabs({
  children,
  defaultValue,
  className = '',
}: {
  children: ReactNode
  defaultValue: string
  className?: string
}) {
  const [value, setValue] = useState(defaultValue)
  const contextValue = useMemo(() => ({ value, setValue }), [value])

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={['ui-tabs', className].filter(Boolean).join(' ')}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={['ui-tabs-list', className].filter(Boolean).join(' ')} {...props} />
}

type TabsTriggerProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  value: string
}

export function TabsTrigger({ value, className = '', children, ...props }: TabsTriggerProps) {
  const { value: currentValue, setValue } = useTabsContext()
  const isActive = currentValue === value

  return (
    <button
      type="button"
      className={['ui-tabs-trigger', isActive ? 'is-active' : '', className].filter(Boolean).join(' ')}
      data-state={isActive ? 'active' : 'inactive'}
      aria-selected={isActive}
      onClick={() => setValue(value)}
      {...props}
    >
      {children}
    </button>
  )
}

type TabsContentProps = HTMLAttributes<HTMLDivElement> & {
  value: string
}

export function TabsContent({ value, className = '', children, ...props }: TabsContentProps) {
  const { value: currentValue } = useTabsContext()

  if (currentValue !== value) {
    return null
  }

  return (
    <div className={['ui-tabs-content', className].filter(Boolean).join(' ')} {...props}>
      {children}
    </div>
  )
}
