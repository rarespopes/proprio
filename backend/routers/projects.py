from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models, schemas
from auth import get_current_user

router = APIRouter(prefix="/api/projects", tags=["projects"])

def enrich(project: models.Project) -> schemas.ProjectOut:
    out = schemas.ProjectOut.model_validate(project)
    out.spent = sum(e.amount for e in project.expenses)
    return out

@router.get("", response_model=List[schemas.ProjectOut])
def list_projects(db: Session = Depends(get_db), user=Depends(get_current_user)):
    projects = db.query(models.Project).filter(models.Project.user_id == user.id).all()
    return [enrich(p) for p in projects]

@router.post("", response_model=schemas.ProjectOut, status_code=201)
def create_project(payload: schemas.ProjectCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    project = models.Project(**payload.model_dump(), user_id=user.id)
    db.add(project); db.commit(); db.refresh(project)
    return enrich(project)

@router.put("/{project_id}", response_model=schemas.ProjectOut)
def update_project(project_id: int, payload: schemas.ProjectCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.user_id == user.id).first()
    if not project: raise HTTPException(status_code=404, detail="Not found")
    for k, v in payload.model_dump().items(): setattr(project, k, v)
    db.commit(); db.refresh(project)
    return enrich(project)

@router.delete("/{project_id}", status_code=204)
def delete_project(project_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.user_id == user.id).first()
    if not project: raise HTTPException(status_code=404, detail="Not found")
    db.delete(project); db.commit()
