import { useCallback, useEffect, useMemo, useState } from 'react'
import { DollarSign, Pencil, Plus } from 'lucide-react'
import { AddExpenseModal, type ExpenseFormData, type ExpenseInitialValues } from '../AddExpenseModal'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { useAuth } from '../../hooks/useAuth'
import { ApiError, createExpense, deleteExpense, getTripExpenseSummary, getTripExpenses, updateExpense } from '../../lib/api'
import { parseDateOnly } from '../../lib/date'

type Member = {
  id: string
  name: string
  initials: string
}

type ExpenseSplit = {
  userId: string
  userName: string
  owedAmount: number
  paidAmount: number
}

type ExpenseItem = {
  id: string
  description: string
  amount: number
  date: string
  paidById: string
  paidByName: string
  splitBetween: ExpenseSplit[]
}

type SummaryMember = {
  userId: string
  userName: string
  totalOwed: number
  totalPaid: number
  balance: number
}

type ExpenseSummary = {
  totalExpenses: number
  totalOwed: number
  totalPaid: number
  members: SummaryMember[]
}

function formatCurrency(value: number) {
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function ExpensesTab({ members, tripId }: { members: Member[]; tripId: string }) {
  const { token } = useAuth()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<ExpenseItem | null>(null)
  const [expenses, setExpenses] = useState<ExpenseItem[]>([])
  const [summary, setSummary] = useState<ExpenseSummary>({ totalExpenses: 0, totalOwed: 0, totalPaid: 0, members: [] })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const memberLookup = useMemo(
    () => Object.fromEntries(members.map((member) => [member.id, member])),
    [members],
  )

  const loadExpenses = useCallback(async () => {
    if (!token) {
      return
    }

    setIsLoading(true)
    setError('')

    const [expenseRows, summaryRow] = await Promise.all([getTripExpenses(token, tripId), getTripExpenseSummary(token, tripId)])

    setExpenses(
      expenseRows.map((row) => {
        const expense = (row.expense ?? {}) as Record<string, unknown>
        const splits = Array.isArray(row.splits) ? row.splits : []

        return {
          id: String(expense.expense_id),
          description: typeof expense.description === 'string' ? expense.description : 'Untitled expense',
          amount: Number(expense.amount ?? 0),
          date: typeof expense.expense_date === 'string' ? expense.expense_date : '',
          paidById: String(expense.paid_by_user_id ?? ''),
          paidByName: typeof expense.paid_by_name === 'string' ? expense.paid_by_name : 'Unknown',
          splitBetween: splits.map((split) => {
            const splitRow = split as Record<string, unknown>
            return {
              userId: String(splitRow.user_id),
              userName: typeof splitRow.user_name === 'string' ? splitRow.user_name : 'Unknown',
              owedAmount: Number(splitRow.owed_amount ?? 0),
              paidAmount: Number(splitRow.paid_amount ?? 0),
            }
          }),
        }
      }),
    )

    const summaryMembers = Array.isArray(summaryRow.members) ? summaryRow.members : []
    setSummary({
      totalExpenses: Number(summaryRow.total_expenses ?? 0),
      totalOwed: Number(summaryRow.total_owed ?? 0),
      totalPaid: Number(summaryRow.total_paid ?? 0),
      members: summaryMembers.map((memberRow) => ({
        userId: String(memberRow.user_id),
        userName: typeof memberRow.user_name === 'string' ? memberRow.user_name : 'Unknown',
        totalOwed: Number(memberRow.total_owed ?? 0),
        totalPaid: Number(memberRow.total_paid ?? 0),
        balance: Number(memberRow.balance ?? 0),
      })),
    })
  }, [token, tripId])

  useEffect(() => {
    if (!token) {
      return
    }

    let cancelled = false

    loadExpenses()
      .catch((apiError) => {
        if (!cancelled) {
          setError(apiError instanceof ApiError ? apiError.message : 'Unable to load expenses')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [loadExpenses, token])

  const closeModal = () => {
    setSelectedExpense(null)
    setIsAddModalOpen(false)
  }

  const openCreateModal = () => {
    setSelectedExpense(null)
    setIsAddModalOpen(true)
  }

  const openEditModal = (expense: ExpenseItem) => {
    setSelectedExpense(expense)
    setIsAddModalOpen(true)
  }

  const handleSubmitExpense = async (expenseData: ExpenseFormData) => {
    if (!token) {
      return
    }

    const splits = expenseData.splits.map((split) => {
      return {
        user_id: Number(split.userId),
        owed_amount: split.owedAmount,
        paid_amount: split.userId === expenseData.paidById ? expenseData.amount : 0,
      }
    })

    try {
      setIsSubmitting(true)
      setError('')

      if (selectedExpense) {
        await updateExpense(token, selectedExpense.id, {
          trip_id: Number(tripId),
          description: expenseData.description.trim(),
          amount: expenseData.amount,
          expense_date: expenseData.expenseDate,
          paid_by_user_id: Number(expenseData.paidById),
          splits,
        })
      } else {
        await createExpense(token, {
          trip_id: Number(tripId),
          description: expenseData.description.trim(),
          amount: expenseData.amount,
          expense_date: expenseData.expenseDate,
          paid_by_user_id: Number(expenseData.paidById),
          splits,
        })
      }

      await loadExpenses()
      closeModal()
    } catch (apiError) {
      setError(apiError instanceof ApiError ? apiError.message : 'Unable to save expense')
      throw apiError
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteExpense = async () => {
    if (!token || !selectedExpense) {
      return
    }

    try {
      setIsDeleting(true)
      setError('')
      await deleteExpense(token, selectedExpense.id)
      await loadExpenses()
      closeModal()
    } catch (apiError) {
      setError(apiError instanceof ApiError ? apiError.message : 'Unable to delete expense')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <section className="trip-tab-section trip-functional-tab">
      <div className="trip-functional-header">
        <div className="trip-tab-intro">
          <p className="dashboard-kicker">Expenses</p>
          <h2>Track shared expenses and balances</h2>
          <p>Capture trip costs, split them across members, and keep a live shared budget summary.</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus size={18} />
          <span>Add Expense</span>
        </Button>
      </div>

      {error ? <p className="form-message form-message-error">{error}</p> : null}

      <div className="overview-stats-grid">
        <Card className="expense-summary-card">
          <CardContent className="expense-summary-content">
            <div className="expense-summary-icon">
              <DollarSign size={28} />
            </div>
            <div>
              <p className="expense-summary-label">Total Expenses</p>
              <p className="expense-summary-value">${formatCurrency(summary.totalExpenses)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="expense-summary-card">
          <CardContent className="expense-summary-content">
            <div className="expense-summary-icon">
              <DollarSign size={28} />
            </div>
            <div>
              <p className="expense-summary-label">Total Paid</p>
              <p className="expense-summary-value">${formatCurrency(summary.totalPaid)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="expense-summary-card">
          <CardContent className="expense-summary-content">
            <div className="expense-summary-icon">
              <DollarSign size={28} />
            </div>
            <div>
              <p className="expense-summary-label">Total Owed</p>
              <p className="expense-summary-value">${formatCurrency(summary.totalOwed)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {summary.members.length > 0 ? (
        <div className="expense-list-shell">
          {summary.members.map((member) => (
            <Card key={member.userId} className="expense-card">
              <CardContent className="expense-card-content">
                <div className="expense-card-top">
                  <div className="expense-card-copy">
                    <h3>{member.userName}</h3>
                    <div className="expense-paid-by">
                      <span>Owes ${formatCurrency(member.totalOwed)}</span>
                    </div>
                  </div>
                  <div className="expense-amount-block">
                    <p className="expense-amount-value">{member.balance >= 0 ? '+' : '-'}${formatCurrency(Math.abs(member.balance))}</p>
                    <p className="expense-amount-meta">Paid ${formatCurrency(member.totalPaid)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {isLoading ? (
        <div className="reservation-empty-state">
          <DollarSign size={40} />
          <p>Loading expenses...</p>
        </div>
      ) : expenses.length > 0 ? (
        <div className="expense-list-shell">
          {expenses.map((expense) => {
            const paidByMember = memberLookup[expense.paidById]

            return (
              <Card key={expense.id} className="expense-card">
                <CardContent className="expense-card-content">
                  <div className="expense-card-top">
                    <div className="expense-card-copy">
                      <h3>{expense.description}</h3>
                      <div className="expense-paid-by">
                        <span>Paid by</span>
                        <Avatar className="expense-paid-avatar">
                          <AvatarFallback>{paidByMember?.initials ?? expense.paidByName.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span>{expense.paidByName}</span>
                        <span>{parseDateOnly(expense.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="expense-amount-block">
                      <p className="expense-amount-value">${formatCurrency(expense.amount)}</p>
                      <p className="expense-amount-meta">
                        ${formatCurrency(expense.amount / Math.max(expense.splitBetween.length, 1))} per person
                      </p>
                    </div>
                  </div>
                  <div className="expense-split-row">
                    <span>Split between:</span>
                    <div className="expense-member-stack">
                      {expense.splitBetween.map((split) => {
                        const member = memberLookup[split.userId]

                        return (
                          <Avatar key={`${expense.id}-${split.userId}`} className="expense-split-avatar">
                            <AvatarFallback>{member?.initials ?? split.userName.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                        )
                      })}
                    </div>
                    <span>
                      {expense.splitBetween.map((split) => `${split.userName} ($${formatCurrency(split.owedAmount)})`).join(', ')}
                    </span>
                    <Button
                      variant="ghost"
                      onClick={() => openEditModal(expense)}
                      aria-label={`Edit ${expense.description}`}
                      style={{ marginLeft: 'auto', flexShrink: 0 }}
                    >
                      <Pencil size={16} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="reservation-empty-state">
          <DollarSign size={40} />
          <p>No expenses yet. Add your first expense to start tracking.</p>
        </div>
      )}

      <AddExpenseModal
        key={selectedExpense ? `edit-${selectedExpense.id}` : 'create-expense'}
        open={isAddModalOpen}
        onClose={closeModal}
        onSubmitExpense={handleSubmitExpense}
        members={members}
        initialValues={selectedExpense ? {
          description: selectedExpense.description,
          amount: selectedExpense.amount,
          expenseDate: selectedExpense.date,
          paidById: selectedExpense.paidById,
          splits: selectedExpense.splitBetween.map((split) => ({ userId: split.userId, owedAmount: split.owedAmount })),
        } satisfies ExpenseInitialValues : undefined}
        mode={selectedExpense ? 'edit' : 'create'}
        onDeleteExpense={selectedExpense ? handleDeleteExpense : undefined}
        isSubmitting={isSubmitting}
        isDeleting={isDeleting}
      />
    </section>
  )
}
