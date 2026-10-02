"""Add per-user progress submission keys, preserving legacy rows."""

from alembic import op
import sqlalchemy as sa

revision = "8a01_progress_submission_id"
down_revision = "39a907f5b8ea"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "session_results", sa.Column("submission_id", sa.String(36), nullable=True)
    )
    op.create_index(
        "uq_progress_user_submission",
        "session_results",
        ["user_id", "submission_id"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("uq_progress_user_submission", table_name="session_results")
    op.drop_column("session_results", "submission_id")
