from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.models.models import User, Transaction, TransactionType, TransactionStatus

router = APIRouter()


@router.get("/leaderboard")
async def get_leaderboard(db: AsyncSession = Depends(get_db)):
    # Top users by total spent
    result = await db.execute(
        select(
            User.id,
            User.username,
            User.telegram_id,
            func.sum(Transaction.amount).label("total_spent")
        )
        .join(Transaction, Transaction.user_id == User.id)
        .where(Transaction.status == TransactionStatus.paid)
        .group_by(User.id)
        .order_by(func.sum(Transaction.amount).desc())
        .limit(20)
    )
    rows = result.all()

    return [
        {
            "rank": i + 1,
            "username": row.username or f"User#{row.telegram_id}",
            "total_spent": float(row.total_spent),
        }
        for i, row in enumerate(rows)
    ]
