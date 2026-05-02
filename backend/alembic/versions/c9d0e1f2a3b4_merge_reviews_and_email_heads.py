"""OBSOLETE — this merge migration is no longer needed.

The migration chain is now fully linear:
  32b48a2c1c31 → 3a236e55a4d6 → 88a719b0ac0c → 4b347f66e5e7 → a1b2c3d4e5f6 → b7e8f9a0b1c2

This file is kept to avoid breaking existing databases that already
applied it. It is a no-op in both directions.

Revision ID: c9d0e1f2a3b4
Revises: b7e8f9a0b1c2
Create Date: 2026-05-02
"""
from alembic import op
import sqlalchemy as sa

revision = 'c9d0e1f2a3b4'
down_revision = 'b7e8f9a0b1c2'
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass  # no-op: migration chain is linear, no merge needed


def downgrade() -> None:
    pass
