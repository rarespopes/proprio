from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from database import get_db
import models, schemas
from auth import get_current_user

router = APIRouter(prefix="/api/commitments", tags=["commitments"])

def enrich(commitment: models.Commitment, db: Session, user_id: int) -> schemas.CommitmentOut:
    out = schemas.CommitmentOut.model_validate(commitment)
    month = datetime.utcnow().strftime("%Y-%m")
    spent = db.query(models.Expense).filter(
        models.Expense.commitment_id == commitment.id,
        models.Expense.date.startswith(month)
    ).all()
    out.spent_this_month = sum(e.amount for e in spent)
    return out

@router.get("", response_model=List[schemas.CommitmentOut])
def list_commitments(db: Session = Depends(get_db), user=Depends(get_current_user)):
    items = db.query(models.Commitment).filter(models.Commitment.user_id == user.id).all()
    return [enrich(c, db, user.id) for c in items]

@router.post("", response_model=schemas.CommitmentOut, status_code=201)
def create_commitment(payload: schemas.CommitmentCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    item = models.Commitment(**payload.model_dump(), user_id=user.id)
    db.add(item); db.commit(); db.refresh(item)
    return enrich(item, db, user.id)

@router.put("/{cid}", response_model=schemas.CommitmentOut)
def update_commitment(cid: int, payload: schemas.CommitmentCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    item = db.query(models.Commitment).filter(models.Commitment.id == cid, models.Commitment.user_id == user.id).first()
    if not item: raise HTTPException(status_code=404, detail="Not found")
    for k, v in payload.model_dump().items(): setattr(item, k, v)
    db.commit(); db.refresh(item)
    return enrich(item, db, user.id)

@router.delete("/{cid}", status_code=204)
def delete_commitment(cid: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    item = db.query(models.Commitment).filter(models.Commitment.id == cid, models.Commitment.user_id == user.id).first()
    if not item: raise HTTPException(status_code=404, detail="Not found")
    db.delete(item); db.commit()
