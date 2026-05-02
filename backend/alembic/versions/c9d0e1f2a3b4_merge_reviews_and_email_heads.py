"""no-op: legacy merge stub kept for DB compatibility.

Revision ID: c9d0e1f2a3b4
Revises: b7e8f9a0b1c2
Create Date: 2026-05-02
"""
from alembic import op

revision = 'c9d0e1f2a3b4'
down_revision = 'b7e8f9a0b1c2'
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
