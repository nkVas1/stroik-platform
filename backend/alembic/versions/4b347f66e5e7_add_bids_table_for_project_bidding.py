"""REPLACED — no-op stub for databases that already applied this revision.

Revision ID: 4b347f66e5e7
Revises: 88a719b0ac0c
Create Date: 2026-04-28
"""
from alembic import op
import sqlalchemy as sa

revision = '4b347f66e5e7'
down_revision = '88a719b0ac0c'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing = inspector.get_table_names()

    if 'bids' not in existing:
        op.create_table(
            'bids',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('project_id', sa.Integer(), nullable=False),
            sa.Column('worker_id', sa.Integer(), nullable=False),
            sa.Column('cover_letter', sa.String(), nullable=True),
            sa.Column('price_offer', sa.Integer(), nullable=True),
            sa.Column('status', sa.String(32), nullable=True, server_default='pending'),
            sa.Column('created_at', sa.DateTime(timezone=True),
                      server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
            sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['worker_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
        )
        op.create_index('ix_bids_id', 'bids', ['id'], unique=False)


def downgrade() -> None:
    pass
