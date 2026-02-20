from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from database import get_db
import models, schemas
from auth import get_current_user

router = APIRouter(prefix="/api/goals", tags=["goals"])

def months_between(deadline_str: str) -> int:
    try:
        deadline = datetime.strptime(deadline_str, "%Y-%m-%d")
        now = datetime.utcnow()
        return max(1, (deadline.year - now.year) * 12 + (deadline.month - now.month))
    except:
        return 0

def enrich(goal: models.Goal, db: Session, user_id: int) -> schemas.GoalOut:
    out = schemas.GoalOut.model_validate(goal)
    out.progress_pct = round((goal.saved / goal.target * 100), 1) if goal.target > 0 else 0.0

    # Funded this month
    month = datetime.utcnow().strftime("%Y-%m")
    allocs = db.query(models.GoalAllocation).filter(
        models.GoalAllocation.goal_id == goal.id,
        models.GoalAllocation.date.startswith(month)
    ).all()
    out.funded_this_month = sum(a.amount for a in allocs)

    # Auto monthly target
    if goal.deadline:
        mo = months_between(goal.deadline)
        remaining = max(goal.target - goal.saved, 0)
        out.auto_monthly_target = round(remaining / mo, 2) if mo > 0 else remaining
        out.months_remaining = mo
    else:
        out.auto_monthly_target = goal.monthly_target or 0.0
        out.months_remaining = None

    return out

@router.get("", response_model=List[schemas.GoalOut])
def list_goals(db: Session = Depends(get_db), user=Depends(get_current_user)):
    goals = db.query(models.Goal).filter(models.Goal.user_id == user.id).all()
    return [enrich(g, db, user.id) for g in goals]

@router.post("", response_model=schemas.GoalOut, status_code=201)
def create_goal(payload: schemas.GoalCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    goal = models.Goal(**payload.model_dump(), user_id=user.id)
    db.add(goal); db.commit(); db.refresh(goal)
    return enrich(goal, db, user.id)

@router.patch("/{goal_id}", response_model=schemas.GoalOut)
def update_goal(goal_id: int, payload: schemas.GoalUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    goal = db.query(models.Goal).filter(models.Goal.id == goal_id, models.Goal.user_id == user.id).first()
    if not goal: raise HTTPException(status_code=404, detail="Not found")
    for k, v in payload.model_dump(exclude_unset=True).items(): setattr(goal, k, v)
    db.commit(); db.refresh(goal)
    return enrich(goal, db, user.id)

@router.delete("/{goal_id}", status_code=204)
def delete_goal(goal_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    goal = db.query(models.Goal).filter(models.Goal.id == goal_id, models.Goal.user_id == user.id).first()
    if not goal: raise HTTPException(status_code=404, detail="Not found")
    db.delete(goal); db.commit()

@router.post("/{goal_id}/allocate", response_model=schemas.GoalAllocationOut, status_code=201)
def allocate_to_goal(goal_id: int, payload: schemas.GoalAllocationCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    goal = db.query(models.Goal).filter(models.Goal.id == goal_id, models.Goal.user_id == user.id).first()
    if not goal: raise HTTPException(status_code=404, detail="Goal not found")
    ga = models.GoalAllocation(
        amount=payload.amount, date=payload.date,
        note=payload.note or "", goal_id=goal_id,
        income_id=payload.income_id, user_id=user.id
    )
    db.add(ga)
    goal.saved = (goal.saved or 0) + payload.amount
    db.commit(); db.refresh(ga)
    out = schemas.GoalAllocationOut.model_validate(ga)
    out.goal_name = goal.name
    return out
