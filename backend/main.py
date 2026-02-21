from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime
from database import engine, get_db, Base
import models, schemas
from auth import get_current_user
from routers import auth, expenses, goals
from routers import commitments, income

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Proprio Finance API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://budget.raresiulian.cloud", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(expenses.router)
app.include_router(commitments.router)
app.include_router(goals.router)
app.include_router(income.router)

@app.get("/api/health")
def health():
    return {"status": "ok", "time": datetime.utcnow().isoformat()}

@app.get("/api/dashboard", response_model=schemas.DashboardStats)
def dashboard(
    month: str = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    if not month:
        month = datetime.utcnow().strftime("%Y-%m")

    # All-time totals
    all_income    = db.query(models.Income).filter(models.Income.user_id == user.id).all()
    all_expenses  = db.query(models.Expense).filter(models.Expense.user_id == user.id).all()
    total_income_all  = sum(i.amount for i in all_income)
    total_expense_all = sum(e.amount for e in all_expenses)
    total_balance     = round(total_income_all - total_expense_all, 2)

    # This month
    month_income   = [i for i in all_income   if i.date.startswith(month)]
    month_expenses = [e for e in all_expenses if e.date.startswith(month)]
    income_mo  = sum(i.amount for i in month_income)
    expense_mo = sum(e.amount for e in month_expenses)

    month_allocs = db.query(models.GoalAllocation).filter(
        models.GoalAllocation.user_id == user.id,
        models.GoalAllocation.date.startswith(month)
    ).all()
    funded_mo = sum(a.amount for a in month_allocs)
    free_cash = round(income_mo - expense_mo - funded_mo, 2)

    # Categories
    by_category: dict = {}
    for e in month_expenses:
        by_category[e.category] = by_category.get(e.category, 0) + e.amount

    # Commitments
    all_commitments = db.query(models.Commitment).filter(models.Commitment.user_id == user.id).all()
    commitment_summaries = []
    total_committed = 0.0
    for c in all_commitments:
        spent = sum(
            e.amount for e in month_expenses if e.commitment_id == c.id
        )
        pct = round(spent / c.monthly_budget * 100, 1) if c.monthly_budget > 0 else 0.0
        commitment_summaries.append(schemas.CommitmentSummary(
            id=c.id, name=c.name, icon=c.icon,
            monthly_budget=c.monthly_budget,
            spent_this_month=round(spent, 2),
            pct_used=pct,
        ))
        total_committed += c.monthly_budget

    # Goals
    goals_list = db.query(models.Goal).filter(models.Goal.user_id == user.id).all()
    avg_progress = 0.0
    if goals_list:
        avg_progress = round(sum(
            (g.saved / g.target * 100) for g in goals_list if g.target > 0
        ) / len(goals_list), 1)

    return schemas.DashboardStats(
        total_balance=total_balance,
        total_income_all_time=round(total_income_all, 2),
        total_expenses_all_time=round(total_expense_all, 2),
        income_this_month=round(income_mo, 2),
        expenses_this_month=round(expense_mo, 2),
        goals_funded_this_month=round(funded_mo, 2),
        free_cash_this_month=free_cash,
        total_committed_monthly=round(total_committed, 2),
        commitments=commitment_summaries,
        by_category={k: round(v, 2) for k, v in by_category.items()},
        goals_avg_progress=avg_progress,
    )
