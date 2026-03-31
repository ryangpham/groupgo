import {
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from 'react'

type DropdownContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
}

const DropdownContext = createContext<DropdownContextValue | null>(null)

function useDropdownContext() {
  const context = useContext(DropdownContext)

  if (!context) {
    throw new Error('Dropdown menu components must be used within DropdownMenu.')
  }

  return context
}

export function DropdownMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const value = useMemo(() => ({ open, setOpen }), [open])

  useEffect(() => {
    function handlePointerDown(event: MouseEvent | globalThis.MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  return (
    <DropdownContext.Provider value={value}>
      <div className="ui-dropdown" ref={ref}>
        {children}
      </div>
    </DropdownContext.Provider>
  )
}

type DropdownMenuTriggerProps = {
  children: ReactElement<{
    onClick?: (event: MouseEvent<HTMLElement>) => void
    'aria-expanded'?: boolean
    'aria-haspopup'?: 'menu'
  }>
  asChild?: boolean
}

export function DropdownMenuTrigger({ children, asChild }: DropdownMenuTriggerProps) {
  const { open, setOpen } = useDropdownContext()

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    children.props.onClick?.(event)
    setOpen(!open)
  }

  if (asChild && isValidElement(children)) {
    return cloneElement(children, {
      onClick: handleClick,
      'aria-expanded': open,
      'aria-haspopup': 'menu',
    })
  }

  return (
    <button
      type="button"
      className="ui-dropdown-trigger"
      onClick={handleClick}
      aria-expanded={open}
      aria-haspopup="menu"
    >
      {children}
    </button>
  )
}

type DropdownMenuContentProps = HTMLAttributes<HTMLDivElement> & {
  align?: 'start' | 'end'
}

export function DropdownMenuContent({
  align = 'start',
  className = '',
  children,
  ...props
}: DropdownMenuContentProps) {
  const { open } = useDropdownContext()

  if (!open) {
    return null
  }

  const classes = ['ui-dropdown-content', `is-${align}`, className].filter(Boolean).join(' ')

  return (
    <div className={classes} role="menu" {...props}>
      {children}
    </div>
  )
}

type DropdownMenuItemProps = ButtonHTMLAttributes<HTMLButtonElement>

export function DropdownMenuItem({ className = '', onClick, ...props }: DropdownMenuItemProps) {
  const { setOpen } = useDropdownContext()
  const classes = ['ui-dropdown-item', className].filter(Boolean).join(' ')

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event)
    setOpen(false)
  }

  return <button type="button" className={classes} role="menuitem" onClick={handleClick} {...props} />
}
