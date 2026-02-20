from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"
    id               = Column(Integer, primary_key=True, index=True)
    name             = Column(String, nullable=False)
    email            = Column(String, unique=True, index=True, nullable=False)
    hashed_password  = Column(String, nullable=False)
    monthly_income   = Column(Float, default=0.0)
    created_at       = Column(DateTime(timezone=True), server_default=func.now())

    expenses         = relationship("Expense",         back_populates="owner",      cascade="all, delete")
    commitments      = relationship("Commitment",      back_populates="owner",      cascade="all, delete")
    goals            = relationship("Goal",            back_populates="owner",      cascade="all, delete")
    incomes          = relationship("Income",          back_populates="owner",      cascade="all, delete")
    goal_allocations = relationship("GoalAllocation",  back_populates="owner",      cascade="all, delete")


class Commitment(Base):
    __tablename__ = "commitments"
    id             = Column(Integer, primary_key=True, index=True)
    name           = Column(String, nullable=False)
    icon           = Column(String, default="📁")
    monthly_budget = Column(Float, default=0.0)
    user_id        = Column(Integer, ForeignKey("users.id"))
    created_at     = Column(DateTime(timezone=True), server_default=func.now())

    owner    = relationship("User",    back_populates="commitments")
    expenses = relationship("Expense", back_populates="commitment")


class Expense(Base):
    __tablename__ = "expenses"
    id            = Column(Integer, primary_key=True, index=True)
    description   = Column(String, nullable=False)
    amount        = Column(Float, nullable=False)
    category      = Column(String, default="Uncategorized")
    date          = Column(String, nullable=False)
    notes         = Column(Text, default="")
    user_id       = Column(Integer, ForeignKey("users.id"))
    commitment_id = Column("project_id", Integer, ForeignKey("commitments.id"), nullable=True)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())

    owner      = relationship("User",       back_populates="expenses")
    commitment = relationship("Commitment", back_populates="expenses")


class Goal(Base):
    __tablename__ = "goals"
    id             = Column(Integer, primary_key=True, index=True)
    name           = Column(String, nullable=False)
    target         = Column(Float, nullable=False)
    saved          = Column(Float, default=0.0)
    deadline       = Column(String, default="")
    monthly_target = Column(Float, default=0.0)
    user_id        = Column(Integer, ForeignKey("users.id"))
    created_at     = Column(DateTime(timezone=True), server_default=func.now())

    owner       = relationship("User",            back_populates="goals")
    allocations = relationship("GoalAllocation",  back_populates="goal", cascade="all, delete")


class Income(Base):
    __tablename__ = "incomes"
    id          = Column(Integer, primary_key=True, index=True)
    amount      = Column(Float, nullable=False)
    source      = Column(String, default="Salary")
    description = Column(String, nullable=False)
    date        = Column(String, nullable=False)
    user_id     = Column(Integer, ForeignKey("users.id"))
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    owner       = relationship("User",           back_populates="incomes")
    allocations = relationship("GoalAllocation", back_populates="income")


class GoalAllocation(Base):
    __tablename__ = "goal_allocations"
    id        = Column(Integer, primary_key=True, index=True)
    amount    = Column(Float, nullable=False)
    date      = Column(String, nullable=False)
    note      = Column(String, default="")
    goal_id   = Column(Integer, ForeignKey("goals.id"))
    income_id = Column(Integer, ForeignKey("incomes.id"), nullable=True)
    user_id   = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner  = relationship("User",   back_populates="goal_allocations")
    goal   = relationship("Goal",   back_populates="allocations")
    income = relationship("Income", back_populates="allocations")
