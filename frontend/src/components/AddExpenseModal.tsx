import { useMemo, useState } from 'react'
import { DollarSign, Receipt, Trash2, UserRound, Users } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader } from './ui/card'
import { Checkbox } from './ui/checkbox'
import { Input } from './ui/input'
import { Label } from './ui/label'

type Member = {
  id: string
  name: string
  initials: string
}

export type ExpenseFormSplit = {
  userId: string
  owedAmount: number
}

export type ExpenseFormData = {
  description: string
  amount: number
  expenseDate: string
  paidById: string
  splits: ExpenseFormSplit[]
}

export type ExpenseInitialValues = {
  description: string
  amount: number
  expenseDate: string
  paidById: string
  splits: ExpenseFormSplit[]
}

function roundToCents(value: number) {
  return Math.round(value * 100) / 100
}

function formatMoneyInput(value: number) {
  return roundToCents(value).toFixed(2)
}

function buildEvenSplitAmounts(amount: number, selectedMemberIds: string[]) {
  if (selectedMemberIds.length === 0) {
    return {} as Record<string, string>
  }

  const normalizedAmount = roundToCents(amount)
  const evenShare = roundToCents(normalizedAmount / selectedMemberIds.length)

  return Object.fromEntries(
    selectedMemberIds.map((memberId, index) => {
      const allocated = evenShare * selectedMemberIds.length
      const owedAmount =
        index === selectedMemberIds.length - 1 ? roundToCents(normalizedAmount - (allocated - evenShare)) : evenShare
      return [memberId, formatMoneyInput(owedAmount)]
    }),
  )
}

function parseMoney(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? roundToCents(parsed) : 0
}

type AddExpenseModalProps = {
  open: boolean
  onClose: () => void
  onSubmitExpense: (expenseData: ExpenseFormData) => void | Promise<void>
  members: Member[]
  initialValues?: ExpenseInitialValues
  mode?: 'create' | 'edit'
  onDeleteExpense?: () => void | Promise<void>
  isSubmitting?: boolean
  isDeleting?: boolean
}

export function AddExpenseModal({
  open,
  onClose,
  onSubmitExpense,
  members,
  initialValues,
  mode = 'create',
  onDeleteExpense,
  isSubmitting = false,
  isDeleting = false,
}: AddExpenseModalProps) {
  const memberIds = useMemo(() => members.map((member) => member.id), [members])
  const defaultValues = initialValues ?? {
    description: '',
    amount: 0,
    expenseDate: new Date().toISOString().slice(0, 10),
    paidById: members[0]?.id ?? '',
    splits: memberIds.map((memberId) => ({ userId: memberId, owedAmount: 0 })),
  }
  const defaultSelectedMemberIds = defaultValues.splits.length > 0 ? defaultValues.splits.map((split) => split.userId) : memberIds
  const defaultAmount = defaultValues.amount ? String(defaultValues.amount) : ''
  const defaultSplitAmounts =
    initialValues && initialValues.splits.length > 0
      ? Object.fromEntries(initialValues.splits.map((split) => [split.userId, formatMoneyInput(split.owedAmount)]))
      : buildEvenSplitAmounts(defaultValues.amount, defaultSelectedMemberIds)

  const [description, setDescription] = useState(defaultValues.description)
  const [amount, setAmount] = useState(defaultAmount)
  const [expenseDate, setExpenseDate] = useState(defaultValues.expenseDate)
  const [paidById, setPaidById] = useState(defaultValues.paidById)
  const [splitBetweenIds, setSplitBetweenIds] = useState<string[]>(defaultSelectedMemberIds)
  const [splitAmounts, setSplitAmounts] = useState<Record<string, string>>(defaultSplitAmounts)
  const [hasManualSplitChanges, setHasManualSplitChanges] = useState(Boolean(initialValues))
  const [submitError, setSubmitError] = useState('')

  if (!open) {
    return null
  }

  const reset = () => {
    setDescription(defaultValues.description)
    setAmount(defaultAmount)
    setExpenseDate(defaultValues.expenseDate)
    setPaidById(defaultValues.paidById)
    setSplitBetweenIds(defaultSelectedMemberIds)
    setSplitAmounts(defaultSplitAmounts)
    setHasManualSplitChanges(Boolean(initialValues))
    setSubmitError('')
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const toggleSplitMember = (memberId: string) => {
    setSubmitError('')
    setSplitBetweenIds((current) => {
      const nextIds = current.includes(memberId) ? current.filter((id) => id !== memberId) : [...current, memberId]

      setSplitAmounts((currentAmounts) => {
        if (!hasManualSplitChanges) {
          return buildEvenSplitAmounts(parseMoney(amount), nextIds)
        }

        return nextIds.reduce<Record<string, string>>((nextAmounts, id) => {
          nextAmounts[id] = currentAmounts[id] ?? formatMoneyInput(nextIds.length > 0 ? parseMoney(amount) / nextIds.length : 0)
          return nextAmounts
        }, {})
      })

      return nextIds
    })
  }

  const handleAmountChange = (nextAmount: string) => {
    setAmount(nextAmount)
    setSubmitError('')

    if (!hasManualSplitChanges) {
      setSplitAmounts(buildEvenSplitAmounts(parseMoney(nextAmount), splitBetweenIds))
    }
  }

  const handleSplitAmountChange = (memberId: string, nextAmount: string) => {
    setHasManualSplitChanges(true)
    setSubmitError('')
    setSplitAmounts((current) => ({ ...current, [memberId]: nextAmount }))
  }

  const selectedSplits = splitBetweenIds.map((memberId) => ({
    userId: memberId,
    owedAmount: parseMoney(splitAmounts[memberId] ?? '0'),
  }))
  const selectedSplitTotal = roundToCents(selectedSplits.reduce((sum, split) => sum + split.owedAmount, 0))
  const totalAmount = parseMoney(amount)
  const splitDifference = roundToCents(totalAmount - selectedSplitTotal)

  return (
    <div className="modal-backdrop" onClick={handleClose} role="presentation">
      <Card className="modal-card" onClick={(event) => event.stopPropagation()}>
        <CardHeader className="modal-header">
          <div className="modal-kicker">
            <Receipt size={16} />
            <span>{mode === 'edit' ? 'Edit expense' : 'Add an expense'}</span>
          </div>
          <h2>{mode === 'edit' ? 'Update shared cost' : 'Track a shared cost'}</h2>
          <p className="form-copy">Capture what was paid, who covered it, and who should split it.</p>
        </CardHeader>

        <CardContent>
          <form
            className="auth-form"
            onSubmit={async (event) => {
              event.preventDefault()

               if (splitBetweenIds.length === 0) {
                setSubmitError('Select at least one member in the split.')
                return
              }

              if (!splitBetweenIds.includes(paidById)) {
                setSubmitError('The payer must also be included in the split.')
                return
              }

              if (splitDifference !== 0) {
                setSubmitError('Split amounts must add up to the total expense.')
                return
              }

              await onSubmitExpense({
                description,
                amount: totalAmount,
                expenseDate,
                paidById,
                splits: selectedSplits,
              })
            }}
          >
            <div className="field-group">
              <Label htmlFor="expense-description">Description</Label>
              <div className="input-icon-wrap">
                <Receipt size={18} />
                <Input
                  id="expense-description"
                  type="text"
                  placeholder="Flight tickets"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  required
                  disabled={isSubmitting || isDeleting}
                />
              </div>
            </div>

            <div className="date-grid">
              <div className="field-group">
                <Label htmlFor="expense-amount">Amount</Label>
                <div className="input-icon-wrap">
                  <DollarSign size={18} />
                  <Input
                    id="expense-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="1200"
                    value={amount}
                    onChange={(event) => handleAmountChange(event.target.value)}
                    required
                    disabled={isSubmitting || isDeleting}
                  />
                </div>
              </div>

              <div className="field-group">
                <Label htmlFor="expense-date">Date</Label>
                <Input
                  id="expense-date"
                  type="date"
                  value={expenseDate}
                  onChange={(event) => setExpenseDate(event.target.value)}
                  required
                  disabled={isSubmitting || isDeleting}
                />
              </div>

              <div className="field-group">
                <Label htmlFor="expense-paid-by">Paid by</Label>
                <div className="input-icon-wrap input-select-wrap">
                  <UserRound size={18} />
                  <select
                    id="expense-paid-by"
                    className="ui-select"
                    value={paidById}
                    onChange={(event) => setPaidById(event.target.value)}
                    required
                    disabled={isSubmitting || isDeleting}
                  >
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="field-group">
              <Label>Split between</Label>
              <div className="multi-select-shell">
                {members.map((member) => (
                  <div key={member.id} className="multi-select-row">
                    <div className="multi-select-info">
                      <Users size={16} />
                      <span>{member.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className="input-icon-wrap" style={{ width: '9.5rem' }}>
                        <DollarSign size={18} />
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={splitAmounts[member.id] ?? ''}
                          onChange={(event) => handleSplitAmountChange(member.id, event.target.value)}
                          disabled={!splitBetweenIds.includes(member.id) || isSubmitting || isDeleting}
                        />
                      </div>
                      <Checkbox
                        checked={splitBetweenIds.includes(member.id)}
                        onChange={() => toggleSplitMember(member.id)}
                        disabled={isSubmitting || isDeleting}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="form-copy">
                Default split is even. You can override any selected member amount as long as the total stays at ${formatMoneyInput(totalAmount)}.
              </p>
              <p className={`form-message ${splitDifference === 0 ? '' : 'form-message-error'}`}>
                Split total: ${formatMoneyInput(selectedSplitTotal)}
                {splitDifference === 0 ? ' (matches total)' : ` (${splitDifference > 0 ? '$' : '-$'}${formatMoneyInput(Math.abs(splitDifference))} remaining)`}
              </p>
              {submitError ? <p className="form-message form-message-error">{submitError}</p> : null}
            </div>

            <div className="modal-actions modal-actions-split">
              {mode === 'edit' && onDeleteExpense ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="ui-button-danger"
                  onClick={async () => await onDeleteExpense()}
                  disabled={isSubmitting || isDeleting}
                >
                  <Trash2 size={16} />
                  <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
                </Button>
              ) : null}

              <div className="modal-actions-cluster">
                <Button type="button" variant="ghost" onClick={handleClose} disabled={isSubmitting || isDeleting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || isDeleting}>
                  {isSubmitting ? (mode === 'edit' ? 'Saving...' : 'Adding...') : mode === 'edit' ? 'Save Changes' : 'Add Expense'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
