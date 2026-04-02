import { PiggyBank, Receipt, Wallet } from 'lucide-react'
import { TabSection } from './TabSection'

type Member = {
  id: string
  name: string
  initials: string
}

export default function ExpensesTab({ members }: { members: Member[] }) {
  return (
    <TabSection
      eyebrow="Expenses"
      title="Prepare the budget and split flow"
      description="Expense creation, categories, and settlements can plug in next. This tab already reserves the space for that workflow."
    >
      <div className="trip-placeholder-grid">
        <article className="trip-placeholder-card">
          <Wallet size={18} />
          <h3>Shared spend</h3>
          <p>Track who paid and what still needs to be settled across the group.</p>
        </article>
        <article className="trip-placeholder-card">
          <PiggyBank size={18} />
          <h3>Budget outlook</h3>
          <p>{members.length} travelers can be included in future split calculations.</p>
        </article>
        <article className="trip-placeholder-card">
          <Receipt size={18} />
          <h3>Receipts</h3>
          <p>Receipt uploads and categorized expenses can attach here later.</p>
        </article>
      </div>
    </TabSection>
  )
}
