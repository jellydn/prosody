from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.models import get_db, User, SessionResult

router = APIRouter(prefix="/api/v1", tags=["progress"])


class UserCreateRequest(BaseModel):
    native_language: str
    english_level: str
    goal: str


class UserCreateResponse(BaseModel):
    user_id: int


class ProgressCreateRequest(BaseModel):
    user_id: int
    day: int
    exercises_completed: int
    rhythm_score: float
    stress_score: float
    pacing_score: float
    intonation_score: float


class ProgressResponse(BaseModel):
    id: int
    user_id: int
    day: int
    exercises_completed: int
    rhythm_score: float
    stress_score: float
    pacing_score: float
    intonation_score: float
    completed_at: datetime


class ProgressSummary(BaseModel):
    streak: int
    averages: dict[str, float]
    total_sessions: int
    trend: str


@router.post(
    "/users", response_model=UserCreateResponse, status_code=status.HTTP_201_CREATED
)
async def create_user(request: UserCreateRequest, db: Session = Depends(get_db)):
    user = User(
        native_language=request.native_language,
        english_level=request.english_level,
        goal=request.goal,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserCreateResponse(user_id=user.id)


@router.post("/progress", status_code=status.HTTP_201_CREATED)
async def create_progress(
    request: ProgressCreateRequest, db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    session_result = SessionResult(
        user_id=request.user_id,
        day=request.day,
        exercises_completed=request.exercises_completed,
        rhythm_score=request.rhythm_score,
        stress_score=request.stress_score,
        pacing_score=request.pacing_score,
        intonation_score=request.intonation_score,
    )
    db.add(session_result)
    db.commit()
    db.refresh(session_result)
    return {"message": "Progress saved successfully", "id": session_result.id}


@router.get("/progress/{user_id}", response_model=List[ProgressResponse])
async def get_progress(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    sessions = (
        db.query(SessionResult)
        .filter(SessionResult.user_id == user_id)
        .order_by(SessionResult.completed_at)
        .all()
    )
    return sessions


@router.get("/progress/{user_id}/summary", response_model=ProgressSummary)
async def get_progress_summary(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    sessions = (
        db.query(SessionResult)
        .filter(SessionResult.user_id == user_id)
        .order_by(SessionResult.day)
        .all()
    )

    if not sessions:
        return ProgressSummary(streak=0, averages={}, total_sessions=0, trend="No data")

    total_sessions = len(sessions)

    averages = {
        "rhythm": sum(s.rhythm_score for s in sessions) / total_sessions,
        "stress": sum(s.stress_score for s in sessions) / total_sessions,
        "pacing": sum(s.pacing_score for s in sessions) / total_sessions,
        "intonation": sum(s.intonation_score for s in sessions) / total_sessions,
    }

    streak = 0
    if sessions:
        expected_day = sessions[-1].day
        for session in reversed(sessions):
            if session.day == expected_day:
                streak += 1
                expected_day -= 1
            else:
                break

    if total_sessions >= 2:
        recent_sessions = sessions[-5:]
        recent_avg = sum(
            s.rhythm_score + s.stress_score + s.pacing_score + s.intonation_score
            for s in recent_sessions
        ) / (len(recent_sessions) * 4)
        overall_avg = sum(
            s.rhythm_score + s.stress_score + s.pacing_score + s.intonation_score
            for s in sessions
        ) / (total_sessions * 4)
        if recent_avg > overall_avg + 0.1:
            trend = "Improving"
        elif recent_avg < overall_avg - 0.1:
            trend = "Declining"
        else:
            trend = "Stable"
    else:
        trend = "Insufficient data"

    return ProgressSummary(
        streak=streak,
        averages=averages,
        total_sessions=total_sessions,
        trend=trend,
    )
