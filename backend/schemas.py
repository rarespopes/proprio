from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# ── Auth ──────────────────────────────────────────────
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    monthly_income: Optional[float] = 0.0

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    monthly_income: float
    created_at: datetime
    class Config: from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# ── Commitments ───────────────────────────────────────
class CommitmentCreate(BaseModel):
    name: str
    icon: Optional[str] = "📁"
    monthly_budget: Optional[float] = 0.0

class CommitmentOut(CommitmentCreate):
    id: int
    user_id: int
    created_at: datetime
    spent_this_month: float = 0.0
    class Config: from_attributes = True


# ── Expenses ──────────────────────────────────────────
class ExpenseCreate(BaseModel):
    description: str
    amount: float
    category: Optional[str] = "Uncategorized"
    date: str
    notes: Optional[str] = ""
    commitment_id: Optional[int] = None

class ExpenseOut(ExpenseCreate):
    id: int
    user_id: int
    created_at: datetime
    commitment_name: Optional[str] = None
    class Config: from_attributes = True


# ── Goals ─────────────────────────────────────────────
class GoalCreate(BaseModel):
    name: str
    target: float
    saved: Optional[float] = 0.0
    deadline: Optional[str] = ""
    monthly_target: Optional[float] = 0.0

class GoalUpdate(BaseModel):
    name: Optional[str] = None
    target: Optional[float] = None
    saved: Optional[float] = None
    deadline: Optional[str] = None
    monthly_target: Optional[float] = None

class GoalOut(GoalCreate):
    id: int
    user_id: int
    created_at: datetime
    progress_pct: float = 0.0
    funded_this_month: float = 0.0
    months_remaining: Optional[int] = None
    auto_monthly_target: float = 0.0
    class Config: from_attributes = True


# ── Goal Allocation ───────────────────────────────────
class GoalAllocationItem(BaseModel):
    goal_id: int
    amount: float
    note: Optional[str] = ""

class GoalAllocationCreate(BaseModel):
    goal_id: Optional[int] = None
    amount: float
    date: str
    note: Optional[str] = ""
    income_id: Optional[int] = None

class GoalAllocationOut(GoalAllocationCreate):
    id: int
    user_id: int
    created_at: datetime
    goal_name: Optional[str] = None
    class Config: from_attributes = True


# ── Income ────────────────────────────────────────────
INCOME_SOURCES = ["Salary", "Freelance", "Rental", "Investment", "Gift", "Other"]

class IncomeCreate(BaseModel):
    amount: float
    source: Optional[str] = "Salary"
    description: str
    date: str
    allocations: Optional[List[GoalAllocationItem]] = []

class IncomeUpdate(BaseModel):
    amount: Optional[float] = None
    source: Optional[str] = None
    description: Optional[str] = None
    date: Optional[str] = None

class IncomeOut(BaseModel):
    id: int
    amount: float
    source: str
    description: str
    date: str
    user_id: int
    created_at: datetime
    allocations: List[GoalAllocationOut] = []
    class Config: from_attributes = True


# ── Dashboard ─────────────────────────────────────────
class CommitmentSummary(BaseModel):
    id: int
    name: str
    icon: str
    monthly_budget: float
    spent_this_month: float
    pct_used: float

class DashboardStats(BaseModel):
    # Balance
    total_balance: float
    total_income_all_time: float
    total_expenses_all_time: float
    # This month
    income_this_month: float
    expenses_this_month: float
    goals_funded_this_month: float
    free_cash_this_month: float
    # Commitments
    total_committed_monthly: float
    commitments: List[CommitmentSummary]
    # Categories
    by_category: dict
    # Goals
    goals_avg_progress: float
