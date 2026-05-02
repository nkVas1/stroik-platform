"""merge reviews and email/password migration heads

Revision ID: c9d0e1f2a3b4
Revises: a1b2c3d4e5f6, b7e8f9a0b1c2
Create Date: 2026-05-02
"""
from alembic import op
import sqlalchemy as sa

revision = 'c9d0e1f2a3b4'
down_revision = ('a1b2c3d4e5f6', 'b7e8f9a0b1c2')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass  # merge-only migration, no schema changes


def downgrade() -> None:
    pass
