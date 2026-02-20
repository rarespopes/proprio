from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
import models, schemas
from auth import get_current_user

router = APIRouter(prefix="/api/income", tags=["income"])

def enrich(inc: models.Income, db: Session) -> schemas.IncomeOut:
    out = schemas.IncomeOut.model_validate(inc)
    allocs = db.query(models.GoalAllocation).filter(models.GoalAllocation.income_id == inc.id).all()
    out.allocations = [enrich_alloc(a) for a in allocs]
    return out

def enrich_alloc(a: models.GoalAllocation) -> schemas.GoalAllocationOut:
    out = schemas.GoalAllocationOut.model_validate(a)
    out.goal_name = a.goal.name if a.goal else None
    return out

@router.get("", response_model=List[schemas.IncomeOut])
def list_income(
    month: Optional[str] = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    q = db.query(models.Income).filter(models.Income.user_id == user.id)
    if month: q = q.filter(models.Income.date.startswith(month))
    return [enrich(i, db) for i in q.order_by(models.Income.date.desc()).all()]

@router.post("", response_model=schemas.IncomeOut, status_code=201)
def create_income(payload: schemas.IncomeCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    # Create income record
    income_data = payload.model_dump(exclude={"allocations"})
    income = models.Income(**income_data, user_id=user.id)
    db.add(income); db.commit(); db.refresh(income)

    # Process allocations
    total_allocated = sum(a.amount for a in (payload.allocations or []))
    if total_allocated > payload.amount:
        raise HTTPException(status_code=400, detail="Total allocations exceed income amount")

    for alloc in (payload.allocations or []):
        goal = db.query(models.Goal).filter(
            models.Goal.id == alloc.goal_id,
            models.Goal.user_id == user.id
        ).first()
        if not goal:
            continue
        ga = models.GoalAllocation(
            amount=alloc.amount, date=payload.date,
            note=alloc.note or "", goal_id=alloc.goal_id,
            income_id=income.id, user_id=user.id
        )
        db.add(ga)
        goal.saved = (goal.saved or 0) + alloc.amount

    db.commit(); db.refresh(income)
    return enrich(income, db)

@router.put("/{income_id}", response_model=schemas.IncomeOut)
def update_income(income_id: int, payload: schemas.IncomeUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    income = db.query(models.Income).filter(models.Income.id == income_id, models.Income.user_id == user.id).first()
    if not income: raise HTTPException(status_code=404, detail="Not found")
    for k, v in payload.model_dump(exclude_unset=True).items(): setattr(income, k, v)
    db.commit(); db.refresh(income)
    return enrich(income, db)

@router.delete("/{income_id}", status_code=204)
def delete_income(income_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    income = db.query(models.Income).filter(models.Income.id == income_id, models.Income.user_id == user.id).first()
    if not income: raise HTTPException(status_code=404, detail="Not found")
    db.delete(income); db.commit()
