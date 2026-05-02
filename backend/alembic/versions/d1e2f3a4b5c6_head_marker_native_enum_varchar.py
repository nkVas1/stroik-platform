"""HEAD marker — ensure single clean head after native_enum=False switch

Revision ID: d1e2f3a4b5c6
Revises: c9d0e1f2a3b4
Create Date: 2026-05-02

SQLAlchemy models now use native_enum=False (VARCHAR storage) for all
Enum columns. SQLite stores enum values as TEXT regardless, so no DDL
change is needed for existing databases. This no-op revision exists
solely to give Alembic a clean single HEAD to point to.

Full linear chain:
  32b48a2c1c31 (initial)
  → 3a236e55a4d6 (verification + entity)
  → 88a719b0ac0c (projects table)
  → 4b347f66e5e7 (bids table)
  → a1b2c3d4e5f6 (reviews table)
  → b7e8f9a0b1c2 (email + password_hash on users)
  → c9d0e1f2a3b4 (no-op tail of old merge)
  → d1e2f3a4b5c6 (this — HEAD)
"""
from alembic import op
import sqlalchemy as sa

revision = 'd1e2f3a4b5c6'
down_revision = 'c9d0e1f2a3b4'
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass  # no-op: SQLite stores all enum columns as TEXT already


def downgrade() -> None:
    pass
