"""REPLACED — no-op stub for databases that already applied this revision.

Revision ID: 3a236e55a4d6
Revises: 32b48a2c1c31
Create Date: 2026-04-26
"""
from alembic import op
import sqlalchemy as sa

revision = '3a236e55a4d6'
down_revision = '32b48a2c1c31'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_cols = {c['name'] for c in inspector.get_columns('profiles')}

    new_cols = [
        ('verification_level', sa.Integer(), {'server_default': '0'}),
        ('entity_type', sa.String(32), {'server_default': 'unknown'}),
        ('company_name', sa.String(), {}),
        ('fio', sa.String(), {}),
        ('location', sa.String(), {}),
        ('email', sa.String(), {}),
        ('phone', sa.String(), {}),
        ('language_proficiency', sa.String(), {}),
        ('work_authorization', sa.String(), {}),
    ]
    with op.batch_alter_table('profiles') as batch_op:
        for col_name, col_type, kwargs in new_cols:
            if col_name not in existing_cols:
                batch_op.add_column(sa.Column(col_name, col_type, nullable=True, **kwargs))


def downgrade() -> None:
    pass
