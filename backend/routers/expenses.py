from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
import models, schemas
from auth import get_current_user

router = APIRouter(prefix="/api/expenses", tags=["expenses"])

def enrich(expense: models.Expense) -> schemas.ExpenseOut:
    out = schemas.ExpenseOut.model_validate(expense)
    out.commitment_name = expense.commitment.name if expense.commitment else None
    return out

@router.get("", response_model=List[schemas.ExpenseOut])
def list_expenses(
    category: Optional[str] = None,
    commitment_id: Optional[int] = None,
    month: Optional[str] = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    q = db.query(models.Expense).filter(models.Expense.user_id == user.id)
    if category:      q = q.filter(models.Expense.category == category)
    if commitment_id: q = q.filter(models.Expense.commitment_id == commitment_id)
    if month:         q = q.filter(models.Expense.date.startswith(month))
    return [enrich(e) for e in q.order_by(models.Expense.date.desc()).all()]

@router.post("", response_model=schemas.ExpenseOut, status_code=201)
def create_expense(payload: schemas.ExpenseCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    expense = models.Expense(**payload.model_dump(), user_id=user.id)
    db.add(expense); db.commit(); db.refresh(expense)
    return enrich(expense)

@router.put("/{expense_id}", response_model=schemas.ExpenseOut)
def update_expense(expense_id: int, payload: schemas.ExpenseCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    expense = db.query(models.Expense).filter(models.Expense.id == expense_id, models.Expense.user_id == user.id).first()
    if not expense: raise HTTPException(status_code=404, detail="Not found")
    for k, v in payload.model_dump().items(): setattr(expense, k, v)
    db.commit(); db.refresh(expense)
    return enrich(expense)

@router.delete("/{expense_id}", status_code=204)
def delete_expense(expense_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    expense = db.query(models.Expense).filter(models.Expense.id == expense_id, models.Expense.user_id == user.id).first()
    if not expense: raise HTTPException(status_code=404, detail="Not found")
    db.delete(expense); db.commit()
