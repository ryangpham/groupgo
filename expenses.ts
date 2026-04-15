export type SplitCreate = {
    user_id: number;
    owed_amount: number;
    paid_amount: number;
  };
  
  export type ExpenseCreate = {
    trip_id: number;
    amount: number;
    expense_date: string;
    splits: SplitCreate[];
  };
  
  export type SplitResponse = {
    expense_id: number;
    user_id: number;
    trip_id: number;
    owed_amount: string;
    paid_amount: string;
  };
  
  export type ExpenseResponse = {
    expense_id: number;
    trip_id: number;
    amount: string;
    expense_date: string;
  };
  
  export type ExpenseWithSplitsResponse = {
    expense: ExpenseResponse;
    splits: SplitResponse[];
  };
  
  export type UserBudgetSummary = {
    user_id: number;
    total_owed: string;
    total_paid: string;
    balance: string;
  };
  
  export type TripBudgetSummary = {
    trip_id: number;
    total_expenses: string;
    total_owed: string;
    total_paid: string;
    members: UserBudgetSummary[];
  };
  
  const API_BASE = "http://localhost:8000";
  
  export async function createExpense(payload: ExpenseCreate) {
    const res = await fetch(`${API_BASE}/expenses/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || "Failed to create expense");
    }
  
    return res.json() as Promise<ExpenseWithSplitsResponse>;
  }
  
  export async function getTripExpenses(tripId: number) {
    const res = await fetch(`${API_BASE}/expenses/trip/${tripId}`);
    if (!res.ok) throw new Error("Failed to fetch trip expenses");
    return res.json() as Promise<ExpenseWithSplitsResponse[]>;
  }
  
  export async function getTripSummary(tripId: number) {
    const res = await fetch(`${API_BASE}/expenses/summary/${tripId}`);
    if (!res.ok) throw new Error("Failed to fetch budget summary");
    return res.json() as Promise<TripBudgetSummary>;
  }
  
  export async function updatePayment(
    expenseId: number,
    userId: number,
    paidAmount: number
  ) {
    const res = await fetch(
      `${API_BASE}/expenses/${expenseId}/users/${userId}/payment`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paid_amount: paidAmount }),
      }
    );
  
    if (!res.ok) throw new Error("Failed to update payment");
    return res.json() as Promise<SplitResponse>;
  }