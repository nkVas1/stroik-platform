"""REPLACED — no-op stub for databases that already applied this revision.

Revision ID: 88a719b0ac0c
Revises: 3a236e55a4d6
Create Date: 2026-04-29
"""
from alembic import op
import sqlalchemy as sa

revision = '88a719b0ac0c'
down_revision = '3a236e55a4d6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing = inspector.get_table_names()

    if 'projects' not in existing:
        op.create_table(
            'projects',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('employer_id', sa.Integer(), nullable=True),
            sa.Column('title', sa.String(), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('budget', sa.Integer(), nullable=True),
            sa.Column('required_specialization', sa.String(), nullable=True),
            sa.Column('status', sa.String(32), nullable=True, server_default='open'),
            sa.Column('created_at', sa.DateTime(timezone=True),
                      server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
            sa.ForeignKeyConstraint(['employer_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
        )
        op.create_index('ix_projects_id', 'projects', ['id'], unique=False)


def downgrade() -> None:
    pass
