"""add email and password_hash to users table

Revision ID: b7e8f9a0b1c2
Revises: a1b2c3d4e5f6
Create Date: 2026-05-02
"""
from alembic import op
import sqlalchemy as sa

revision = 'b7e8f9a0b1c2'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # SQLite не поддерживает ADD COLUMN UNIQUE напрямую,
    # поэтому добавляем без UNIQUE-констрейнта, создаём индекс отдельно
    with op.batch_alter_table('users') as batch_op:
        batch_op.add_column(sa.Column('email', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('password_hash', sa.String(), nullable=True))
        batch_op.create_index('ix_users_email', ['email'], unique=True)


def downgrade() -> None:
    with op.batch_alter_table('users') as batch_op:
        batch_op.drop_index('ix_users_email')
        batch_op.drop_column('password_hash')
        batch_op.drop_column('email')
