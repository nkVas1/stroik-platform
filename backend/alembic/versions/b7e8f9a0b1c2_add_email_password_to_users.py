"""REPLACED — no-op stub for databases that already applied this revision.

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
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_cols = {c['name'] for c in inspector.get_columns('users')}

    with op.batch_alter_table('users') as batch_op:
        if 'email' not in existing_cols:
            batch_op.add_column(sa.Column('email', sa.String(), nullable=True))
        if 'password_hash' not in existing_cols:
            batch_op.add_column(sa.Column('password_hash', sa.String(), nullable=True))

    # Add unique index if not present
    conn2 = op.get_bind()
    existing_idx = {i['name'] for i in sa.inspect(conn2).get_indexes('users')}
    if 'ix_users_email' not in existing_idx:
        op.create_index('ix_users_email', 'users', ['email'], unique=True)


def downgrade() -> None:
    pass
