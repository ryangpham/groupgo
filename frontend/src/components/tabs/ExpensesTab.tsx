import { useEffect, useMemo, useState } from 'react'
import { DollarSign, Plus } from 'lucide-react'
import { AddExpenseModal } from '../AddExpenseModal'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { useAuth } from '../../hooks/useAuth'
import { ApiError, createExpense, getTripExpenseSummary, getTripExpenses } from '../../lib/api'
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
  const [expenses, setExpenses] = useState<ExpenseItem[]>([])
  const [summary, setSummary] = useState<ExpenseSummary>({ totalExpenses: 0, totalOwed: 0, totalPaid: 0, members: [] })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const memberLookup = useMemo(
    () => Object.fromEntries(members.map((member) => [member.id, member])),
    [members],
  )

  useEffect(() => {
    if (!token) {
      return
    }

    let cancelled = false

    setIsLoading(true)
    setError('')

    Promise.all([getTripExpenses(token, tripId), getTripExpenseSummary(token, tripId)])
      .then(([expenseRows, summaryRow]) => {
        if (cancelled) {
          return
        }

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
      })
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
  }, [token, tripId])

  const handleAddExpense = async (expenseData: {
    description: string
    amount: number
    expenseDate: string
    paidById: string
    splitBetweenIds: string[]
  }) => {
    if (!token) {
      return
    }

    const selectedMemberIds = expenseData.splitBetweenIds.length > 0 ? expenseData.splitBetweenIds : members.map((member) => member.id)
    const equalShare = Number((expenseData.amount / selectedMemberIds.length).toFixed(2))
    const splits = selectedMemberIds.map((memberId, index) => {
      const runningTotal = equalShare * selectedMemberIds.length
      const adjustedOwedAmount =
        index === selectedMemberIds.length - 1
          ? Number((expenseData.amount - (runningTotal - equalShare)).toFixed(2))
          : equalShare

      return {
        user_id: Number(memberId),
        owed_amount: adjustedOwedAmount,
        paid_amount: memberId === expenseData.paidById ? expenseData.amount : 0,
      }
    })

    try {
      setIsSubmitting(true)
      setError('')

      const createdExpense = await createExpense(token, {
        trip_id: Number(tripId),
        description: expenseData.description.trim(),
        amount: expenseData.amount,
        expense_date: expenseData.expenseDate,
        paid_by_user_id: Number(expenseData.paidById),
        splits,
      })

      const expenseRow = (createdExpense.expense ?? {}) as Record<string, unknown>
      const splitRows = Array.isArray(createdExpense.splits) ? createdExpense.splits : []

      setExpenses((current) => [
        {
          id: String(expenseRow.expense_id),
          description: typeof expenseRow.description === 'string' ? expenseRow.description : expenseData.description,
          amount: Number(expenseRow.amount ?? expenseData.amount),
          date: typeof expenseRow.expense_date === 'string' ? expenseRow.expense_date : expenseData.expenseDate,
          paidById: String(expenseRow.paid_by_user_id ?? expenseData.paidById),
          paidByName:
            typeof expenseRow.paid_by_name === 'string'
              ? expenseRow.paid_by_name
              : memberLookup[expenseData.paidById]?.name ?? 'Unknown',
          splitBetween: splitRows.map((split) => {
            const splitRow = split as Record<string, unknown>
            const member = memberLookup[String(splitRow.user_id)]
            return {
              userId: String(splitRow.user_id),
              userName: typeof splitRow.user_name === 'string' ? splitRow.user_name : member?.name ?? 'Unknown',
              owedAmount: Number(splitRow.owed_amount ?? 0),
              paidAmount: Number(splitRow.paid_amount ?? 0),
            }
          }),
        },
        ...current,
      ])

      setSummary((current) => {
        const nextMembers = new Map(current.members.map((member) => [member.userId, { ...member }]))

        splits.forEach((split) => {
          const member = nextMembers.get(String(split.user_id)) ?? {
            userId: String(split.user_id),
            userName: memberLookup[String(split.user_id)]?.name ?? 'Unknown',
            totalOwed: 0,
            totalPaid: 0,
            balance: 0,
          }

          member.totalOwed += split.owed_amount
          member.totalPaid += split.paid_amount
          member.balance = member.totalPaid - member.totalOwed
          nextMembers.set(member.userId, member)
        })

        return {
          totalExpenses: current.totalExpenses + expenseData.amount,
          totalOwed: current.totalOwed + expenseData.amount,
          totalPaid: current.totalPaid + expenseData.amount,
          members: Array.from(nextMembers.values()).sort((left, right) => left.userName.localeCompare(right.userName)),
        }
      })
    } catch (apiError) {
      setError(apiError instanceof ApiError ? apiError.message : 'Unable to add expense')
      throw apiError
    } finally {
      setIsSubmitting(false)
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
        <Button onClick={() => setIsAddModalOpen(true)}>
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
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddExpense={handleAddExpense}
        members={members}
        isSubmitting={isSubmitting}
      />
    </section>
  )
}
