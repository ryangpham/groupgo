import { useMemo, useState } from 'react'
import { DollarSign, Plus } from 'lucide-react'
import { AddExpenseModal } from '../AddExpenseModal'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'

type Member = {
  id: string
  name: string
  initials: string
}

export default function ExpensesTab({ members }: { members: Member[] }) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [expenses, setExpenses] = useState([
    {
      id: '1',
      description: 'Flight tickets',
      amount: 1800,
      paidBy: members[0],
      splitBetween: [members[0], members[1] ?? members[0], members[2] ?? members[0]],
    },
    {
      id: '2',
      description: 'Hotel accommodation',
      amount: 1200,
      paidBy: members[1] ?? members[0],
      splitBetween: [members[0], members[1] ?? members[0], members[2] ?? members[0]],
    },
    {
      id: '3',
      description: 'Dinner at restaurant',
      amount: 245,
      paidBy: members[2] ?? members[0],
      splitBetween: [members[0], members[1] ?? members[0], members[2] ?? members[0]],
    },
  ])

  const totalExpenses = useMemo(() => expenses.reduce((sum, expense) => sum + expense.amount, 0), [expenses])

  const handleAddExpense = (expenseData: {
    description: string
    amount: number
    paidById: string
    splitBetweenIds: string[]
  }) => {
    const paidBy = members.find((member) => member.id === expenseData.paidById) ?? members[0]
    const splitBetween = members.filter((member) => expenseData.splitBetweenIds.includes(member.id))

    setExpenses((current) => [
      ...current,
      {
        id: String(current.length + 1),
        description: expenseData.description,
        amount: expenseData.amount,
        paidBy,
        splitBetween: splitBetween.length > 0 ? splitBetween : [members[0]],
      },
    ])
  }

  return (
    <section className="trip-tab-section trip-functional-tab">
      <div className="trip-functional-header">
        <div className="trip-tab-intro">
          <p className="dashboard-kicker">Expenses</p>
          <h2>Track shared expenses and splits</h2>
          <p>Keep a lightweight local budget view until the real budget and split logic is ready.</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus size={18} />
          <span>Add Expense</span>
        </Button>
      </div>

      <Card className="expense-summary-card">
        <CardContent className="expense-summary-content">
          <div className="expense-summary-icon">
            <DollarSign size={28} />
          </div>
          <div>
            <p className="expense-summary-label">Total Expenses</p>
            <p className="expense-summary-value">${totalExpenses.toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>

      {expenses.length > 0 ? (
        <div className="expense-list-shell">
          {expenses.map((expense) => (
            <Card key={expense.id} className="expense-card">
              <CardContent className="expense-card-content">
                <div className="expense-card-top">
                  <div className="expense-card-copy">
                    <h3>{expense.description}</h3>
                    <div className="expense-paid-by">
                      <span>Paid by</span>
                      <Avatar className="expense-paid-avatar">
                        <AvatarFallback>{expense.paidBy.initials}</AvatarFallback>
                      </Avatar>
                      <span>{expense.paidBy.name}</span>
                    </div>
                  </div>
                  <div className="expense-amount-block">
                    <p className="expense-amount-value">${expense.amount}</p>
                    <p className="expense-amount-meta">
                      ${(expense.amount / expense.splitBetween.length).toFixed(2)} per person
                    </p>
                  </div>
                </div>
                <div className="expense-split-row">
                  <span>Split between:</span>
                  <div className="expense-member-stack">
                    {expense.splitBetween.map((member) => (
                      <Avatar key={member.id} className="expense-split-avatar">
                        <AvatarFallback>{member.initials}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  <span>{expense.splitBetween.map((member) => member.name).join(', ')}</span>
                </div>
              </CardContent>
            </Card>
          ))}
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
      />
    </section>
  )
}
