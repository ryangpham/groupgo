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

type AddExpenseModalProps = {
  open: boolean
  onClose: () => void
  onSubmitExpense: (expenseData: {
    description: string
    amount: number
    expenseDate: string
    paidById: string
    splitBetweenIds: string[]
  }) => void | Promise<void>
  members: Member[]
  initialValues?: {
    description: string
    amount: number
    expenseDate: string
    paidById: string
    splitBetweenIds: string[]
  }
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
    splitBetweenIds: memberIds,
  }

  const [description, setDescription] = useState(defaultValues.description)
  const [amount, setAmount] = useState(defaultValues.amount ? String(defaultValues.amount) : '')
  const [expenseDate, setExpenseDate] = useState(defaultValues.expenseDate)
  const [paidById, setPaidById] = useState(defaultValues.paidById)
  const [splitBetweenIds, setSplitBetweenIds] = useState<string[]>(
    defaultValues.splitBetweenIds.length > 0 ? defaultValues.splitBetweenIds : memberIds,
  )

  if (!open) {
    return null
  }

  const reset = () => {
    setDescription(defaultValues.description)
    setAmount(defaultValues.amount ? String(defaultValues.amount) : '')
    setExpenseDate(defaultValues.expenseDate)
    setPaidById(defaultValues.paidById)
    setSplitBetweenIds(defaultValues.splitBetweenIds.length > 0 ? defaultValues.splitBetweenIds : memberIds)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const toggleSplitMember = (memberId: string) => {
    setSplitBetweenIds((current) =>
      current.includes(memberId) ? current.filter((id) => id !== memberId) : [...current, memberId],
    )
  }

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
              await onSubmitExpense({
                description,
                amount: Number(amount),
                expenseDate,
                paidById,
                splitBetweenIds: splitBetweenIds.length > 0 ? splitBetweenIds : memberIds,
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
                    onChange={(event) => setAmount(event.target.value)}
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
                  <label key={member.id} className="multi-select-row">
                    <div className="multi-select-info">
                      <Users size={16} />
                      <span>{member.name}</span>
                    </div>
                    <Checkbox
                      checked={splitBetweenIds.includes(member.id)}
                      onChange={() => toggleSplitMember(member.id)}
                      disabled={isSubmitting || isDeleting}
                    />
                  </label>
                ))}
              </div>
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
