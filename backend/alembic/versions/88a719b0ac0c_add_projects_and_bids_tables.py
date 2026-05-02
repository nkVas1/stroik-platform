"""Add projects table

Revision ID: 88a719b0ac0c
Revises: 3a236e55a4d6
Create Date: 2026-04-29

Note: down_revision fixed from '4b347f66e5e7' to '3a236e55a4d6'.
Projects must exist before bids (FK constraint).
"""
from alembic import op
import sqlalchemy as sa

revision = '88a719b0ac0c'
down_revision = '3a236e55a4d6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'projects',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('employer_id', sa.Integer(), nullable=True),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('budget', sa.Integer(), nullable=True),
        sa.Column('required_specialization', sa.String(), nullable=True),
        sa.Column(
            'status',
            sa.Enum('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', name='projectstatus'),
            nullable=True,
        ),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('(CURRENT_TIMESTAMP)'),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(['employer_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_projects_id', 'projects', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_projects_id', table_name='projects')
    op.drop_table('projects')
