"""Add bids table for project bidding system

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
    op.create_table(
        'bids',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=False),
        sa.Column('worker_id', sa.Integer(), nullable=False),
        sa.Column('cover_letter', sa.String(), nullable=True),
        sa.Column('price_offer', sa.Integer(), nullable=True),
        sa.Column(
            'status',
            sa.Enum('pending', 'accepted', 'rejected', name='bidstatus'),
            nullable=True,
            server_default='pending',
        ),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('(CURRENT_TIMESTAMP)'),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['worker_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_bids_id', 'bids', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_bids_id', table_name='bids')
    op.drop_table('bids')
