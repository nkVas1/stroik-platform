"""Initial SQLite schema

Revision ID: 32b48a2c1c31
Revises:
Create Date: 2026-04-26 18:16:09.381600
"""
from alembic import op
import sqlalchemy as sa

revision = '32b48a2c1c31'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'users',
        sa.Column('id',          sa.Integer(),  nullable=False),
        sa.Column('phone',       sa.String(),   nullable=True),
        sa.Column('is_verified', sa.Boolean(),  nullable=True),
        sa.Column('created_at',  sa.DateTime(timezone=True),
                  server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_users_id',    'users', ['id'],    unique=False)
    op.create_index('ix_users_phone', 'users', ['phone'], unique=True)

    op.create_table(
        'profiles',
        sa.Column('id',          sa.Integer(), nullable=False),
        sa.Column('user_id',     sa.Integer(), nullable=True),
        sa.Column(
            'role',
            sa.Enum('worker', 'employer', 'unknown', name='userrole'),
            nullable=True,
        ),
        sa.Column('specialization',  sa.String(),  nullable=True),
        sa.Column('experience_years', sa.Integer(), nullable=True),
        sa.Column('project_scope',   sa.String(),  nullable=True),
        sa.Column('raw_data',        sa.JSON(),    nullable=True),
        sa.Column('created_at',      sa.DateTime(timezone=True),
                  server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.Column('updated_at',      sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id'),
    )
    op.create_index('ix_profiles_id', 'profiles', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_profiles_id', table_name='profiles')
    op.drop_table('profiles')
    op.drop_index('ix_users_phone', table_name='users')
    op.drop_index('ix_users_id',    table_name='users')
    op.drop_table('users')
