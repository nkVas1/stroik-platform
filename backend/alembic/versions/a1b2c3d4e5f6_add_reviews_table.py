"""REPLACED — no-op stub for databases that already applied this revision.

Revision ID: a1b2c3d4e5f6
Revises: 4b347f66e5e7
Create Date: 2026-05-02
"""
from alembic import op
import sqlalchemy as sa

revision = 'a1b2c3d4e5f6'
down_revision = '4b347f66e5e7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing = inspector.get_table_names()

    if 'reviews' not in existing:
        op.create_table(
            'reviews',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('project_id', sa.Integer(), nullable=False),
            sa.Column('reviewer_id', sa.Integer(), nullable=False),
            sa.Column('worker_id', sa.Integer(), nullable=False),
            sa.Column('rating', sa.Float(), nullable=False),
            sa.Column('text', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True),
                      server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
            sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['reviewer_id'], ['users.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['worker_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('project_id'),
        )
        op.create_index('ix_reviews_worker_id', 'reviews', ['worker_id'], unique=False)


def downgrade() -> None:
    pass
