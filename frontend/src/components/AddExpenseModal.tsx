import { useMemo, useState } from 'react'
import { DollarSign, Receipt, UserRound, Users } from 'lucide-react'
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
  onAddExpense: (expenseData: {
    description: string
    amount: number
    expenseDate: string
    paidById: string
    splitBetweenIds: string[]
  }) => void | Promise<void>
  members: Member[]
  isSubmitting?: boolean
}

export function AddExpenseModal({ open, onClose, onAddExpense, members, isSubmitting = false }: AddExpenseModalProps) {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [paidById, setPaidById] = useState(members[0]?.id ?? '')
  const [splitBetweenIds, setSplitBetweenIds] = useState<string[]>(() => members.map((member) => member.id))

  const memberIds = useMemo(() => members.map((member) => member.id), [members])

  if (!open) {
    return null
  }

  const reset = () => {
    setDescription('')
    setAmount('')
    setExpenseDate(new Date().toISOString().slice(0, 10))
    setPaidById(members[0]?.id ?? '')
    setSplitBetweenIds(memberIds)
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
            <span>Add an expense</span>
          </div>
          <h2>Track a shared cost</h2>
          <p className="form-copy">Capture what was paid, who covered it, and who should split it.</p>
        </CardHeader>

        <CardContent>
          <form
            className="auth-form"
            onSubmit={async (event) => {
              event.preventDefault()
              await onAddExpense({
                description,
                amount: Number(amount),
                expenseDate,
                paidById,
                splitBetweenIds: splitBetweenIds.length > 0 ? splitBetweenIds : memberIds,
              })
              handleClose()
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
                  disabled={isSubmitting}
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
                    disabled={isSubmitting}
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
                  disabled={isSubmitting}
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
                    disabled={isSubmitting}
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
                      disabled={isSubmitting}
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <Button type="button" variant="ghost" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Adding...' : 'Add Expense'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
