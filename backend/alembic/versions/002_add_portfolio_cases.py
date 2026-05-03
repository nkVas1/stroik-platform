"""add portfolio_cases table

Revision ID: 002_portfolio_cases
Revises: d1e2f3a4b5c6
Create Date: 2026-05-03
"""
from alembic import op
import sqlalchemy as sa

revision = '002_portfolio_cases'
down_revision = 'd1e2f3a4b5c6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = set(inspector.get_table_names())

    if 'portfolio_cases' not in existing_tables:
        op.create_table(
            'portfolio_cases',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('worker_id', sa.Integer(), nullable=False),
            sa.Column('title', sa.String(length=200), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('work_type', sa.String(length=100), nullable=True),
            sa.Column('city', sa.String(length=100), nullable=True),
            sa.Column('year_completed', sa.Integer(), nullable=True),
            sa.Column('budget', sa.String(length=50), nullable=True),
            sa.Column('client_name', sa.String(length=200), nullable=True),
            sa.Column('photo_urls', sa.JSON(), nullable=True),
            sa.Column('contract_url', sa.String(length=500), nullable=True),
            sa.Column(
                'is_verified', sa.Boolean(), nullable=False,
                server_default=sa.false()
            ),
            sa.Column(
                'created_at', sa.DateTime(timezone=True),
                server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False
            ),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(
                ['worker_id'], ['users.id'], ondelete='CASCADE'
            ),
            sa.PrimaryKeyConstraint('id'),
        )
        op.create_index(
            'ix_portfolio_cases_id', 'portfolio_cases', ['id'], unique=False
        )
        op.create_index(
            'ix_portfolio_cases_worker_id', 'portfolio_cases',
            ['worker_id'], unique=False
        )


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if 'portfolio_cases' in set(inspector.get_table_names()):
        op.drop_index('ix_portfolio_cases_worker_id',
                      table_name='portfolio_cases')
        op.drop_index('ix_portfolio_cases_id',
                      table_name='portfolio_cases')
        op.drop_table('portfolio_cases')
