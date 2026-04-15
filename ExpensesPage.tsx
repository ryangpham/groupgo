import { useEffect, useState } from "react";
import {
  createExpense,
  getTripExpenses,
  getTripSummary,
  updatePayment,
  ExpenseWithSplitsResponse,
  TripBudgetSummary,
} from "../api/expenses";

type Props = {
  tripId: number;
};

export default function ExpensesPage({ tripId }: Props) {
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [splits, setSplits] = useState([
    { user_id: "", owed_amount: "", paid_amount: "0" },
  ]);

  const [expenses, setExpenses] = useState<ExpenseWithSplitsResponse[]>([]);
  const [summary, setSummary] = useState<TripBudgetSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadData() {
    try {
      const [expensesData, summaryData] = await Promise.all([
        getTripExpenses(tripId),
        getTripSummary(tripId),
      ]);
      setExpenses(expensesData);
      setSummary(summaryData);
    } catch (err) {
      console.error(err);
      setMessage("Could not load expense data.");
    }
  }

  useEffect(() => {
    loadData();
  }, [tripId]);

  const addSplitRow = () => {
    setSplits([
      ...splits,
      { user_id: "", owed_amount: "", paid_amount: "0" },
    ]);
  };

  const updateSplitRow = (
    index: number,
    field: "user_id" | "owed_amount" | "paid_amount",
    value: string
  ) => {
    const next = [...splits];
    next[index][field] = value;
    setSplits(next);
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await createExpense({
        trip_id: tripId,
        amount: Number(amount),
        expense_date: expenseDate,
        splits: splits.map((s) => ({
          user_id: Number(s.user_id),
          owed_amount: Number(s.owed_amount),
          paid_amount: Number(s.paid_amount),
        })),
      });

      setAmount("");
      setExpenseDate("");
      setSplits([{ user_id: "", owed_amount: "", paid_amount: "0" }]);
      setMessage("Expense added successfully.");
      await loadData();
    } catch (err: any) {
      setMessage(err.message || "Failed to create expense.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePayment = async (
    expenseId: number,
    userId: number,
    currentPaidAmount: string
  ) => {
    const nextValue = prompt(
      `Enter new paid amount for user ${userId}`,
      currentPaidAmount
    );

    if (nextValue === null) return;

    try {
      await updatePayment(expenseId, userId, Number(nextValue));
      setMessage("Payment updated.");
      await loadData();
    } catch (err) {
      setMessage("Failed to update payment.");
    }
  };

  return (
    <div style={{ padding: "24px" }}>
      <h1>Expense & Budget Management</h1>

      {message && <p>{message}</p>}

      <form onSubmit={handleCreateExpense} style={{ marginBottom: "32px" }}>
        <h2>Add Expense</h2>

        <div>
          <label>Amount: </label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Expense Date: </label>
          <input
            type="date"
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            required
          />
        </div>

        <h3>Splits</h3>
        {splits.map((split, index) => (
          <div
            key={index}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "8px",
              marginBottom: "8px",
              maxWidth: "600px",
            }}
          >
            <input
              type="number"
              placeholder="User ID"
              value={split.user_id}
              onChange={(e) => updateSplitRow(index, "user_id", e.target.value)}
              required
            />
            <input
              type="number"
              step="0.01"
              placeholder="Owed Amount"
              value={split.owed_amount}
              onChange={(e) =>
                updateSplitRow(index, "owed_amount", e.target.value)
              }
              required
            />
            <input
              type="number"
              step="0.01"
              placeholder="Paid Amount"
              value={split.paid_amount}
              onChange={(e) =>
                updateSplitRow(index, "paid_amount", e.target.value)
              }
              required
            />
          </div>
        ))}

        <button type="button" onClick={addSplitRow} style={{ marginRight: "8px" }}>
          Add Another Split
        </button>
        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Create Expense"}
        </button>
      </form>

      <section style={{ marginBottom: "32px" }}>
        <h2>Trip Budget Summary</h2>
        {summary ? (
          <div>
            <p><strong>Total Expenses:</strong> ${summary.total_expenses}</p>
            <p><strong>Total Owed:</strong> ${summary.total_owed}</p>
            <p><strong>Total Paid:</strong> ${summary.total_paid}</p>

            <h3>Per User</h3>
            <table border={1} cellPadding={8}>
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Total Owed</th>
                  <th>Total Paid</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                {summary.members.map((member) => (
                  <tr key={member.user_id}>
                    <td>{member.user_id}</td>
                    <td>${member.total_owed}</td>
                    <td>${member.total_paid}</td>
                    <td>${member.balance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No summary yet.</p>
        )}
      </section>

      <section>
        <h2>All Expenses</h2>
        {expenses.length === 0 ? (
          <p>No expenses found.</p>
        ) : (
          expenses.map((item) => (
            <div
              key={item.expense.expense_id}
              style={{
                border: "1px solid #ccc",
                padding: "12px",
                marginBottom: "16px",
              }}
            >
              <p><strong>Expense ID:</strong> {item.expense.expense_id}</p>
              <p><strong>Amount:</strong> ${item.expense.amount}</p>
              <p><strong>Date:</strong> {item.expense.expense_date}</p>

              <table border={1} cellPadding={8}>
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Owed Amount</th>
                    <th>Paid Amount</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {item.splits.map((split) => (
                    <tr key={`${split.expense_id}-${split.user_id}`}>
                      <td>{split.user_id}</td>
                      <td>${split.owed_amount}</td>
                      <td>${split.paid_amount}</td>
                      <td>
                        <button
                          onClick={() =>
                            handleUpdatePayment(
                              split.expense_id,
                              split.user_id,
                              split.paid_amount
                            )
                          }
                        >
                          Update Payment
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
      </section>
    </div>
  );
}