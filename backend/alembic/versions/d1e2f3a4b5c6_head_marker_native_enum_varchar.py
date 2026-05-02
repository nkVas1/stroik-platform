"""Final HEAD — ensure all columns/indexes exist for current schema.

This migration is idempotent and safe to run on any state of the database:
- Fresh install: creates everything
- Partial install: fills missing pieces
- Full install: no-op

Revision ID: d1e2f3a4b5c6
Revises: c9d0e1f2a3b4
Create Date: 2026-05-02

Full linear chain:
  32b48a2c1c31 -> 3a236e55a4d6 -> 88a719b0ac0c -> 4b347f66e5e7
  -> a1b2c3d4e5f6 -> b7e8f9a0b1c2 -> c9d0e1f2a3b4 -> d1e2f3a4b5c6 (HEAD)
"""
from alembic import op
import sqlalchemy as sa

revision = 'd1e2f3a4b5c6'
down_revision = 'c9d0e1f2a3b4'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = set(inspector.get_table_names())

    # ------------------------------------------------------------------ #
    # USERS                                                                #
    # ------------------------------------------------------------------ #
    if 'users' not in existing_tables:
        op.create_table(
            'users',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('phone', sa.String(), unique=True, nullable=True),
            sa.Column('email', sa.String(), unique=True, nullable=True),
            sa.Column('password_hash', sa.String(), nullable=True),
            sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='0'),
            sa.Column('created_at', sa.DateTime(timezone=True),
                      server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
            sa.PrimaryKeyConstraint('id'),
        )
        op.create_index('ix_users_id', 'users', ['id'], unique=False)
        op.create_index('ix_users_email', 'users', ['email'], unique=True)
        op.create_index('ix_users_phone', 'users', ['phone'], unique=True)
    else:
        # Ensure email/password_hash columns exist (added in b7e8f9a0b1c2)
        user_cols = {c['name'] for c in inspector.get_columns('users')}
        with op.batch_alter_table('users') as batch_op:
            if 'email' not in user_cols:
                batch_op.add_column(sa.Column('email', sa.String(), nullable=True))
            if 'password_hash' not in user_cols:
                batch_op.add_column(sa.Column('password_hash', sa.String(), nullable=True))
        existing_idx = {i['name'] for i in inspector.get_indexes('users')}
        if 'ix_users_email' not in existing_idx:
            op.create_index('ix_users_email', 'users', ['email'], unique=True)

    # ------------------------------------------------------------------ #
    # PROFILES                                                             #
    # ------------------------------------------------------------------ #
    if 'profiles' not in existing_tables:
        op.create_table(
            'profiles',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('role', sa.String(32), nullable=False, server_default='unknown'),
            sa.Column('verification_level', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('entity_type', sa.String(32), nullable=False, server_default='unknown'),
            sa.Column('company_name', sa.String(), nullable=True),
            sa.Column('fio', sa.String(), nullable=True),
            sa.Column('location', sa.String(), nullable=True),
            sa.Column('email', sa.String(), nullable=True),
            sa.Column('phone', sa.String(), nullable=True),
            sa.Column('language_proficiency', sa.String(), nullable=True),
            sa.Column('work_authorization', sa.String(), nullable=True),
            sa.Column('specialization', sa.String(), nullable=True),
            sa.Column('experience_years', sa.Integer(), nullable=True),
            sa.Column('project_scope', sa.String(), nullable=True),
            sa.Column('raw_data', sa.JSON(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True),
                      server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('user_id'),
        )
        op.create_index('ix_profiles_id', 'profiles', ['id'], unique=False)
    else:
        profile_cols = {c['name'] for c in inspector.get_columns('profiles')}
        with op.batch_alter_table('profiles') as batch_op:
            if 'verification_level' not in profile_cols:
                batch_op.add_column(sa.Column('verification_level', sa.Integer(),
                                               nullable=False, server_default='0'))
            if 'entity_type' not in profile_cols:
                batch_op.add_column(sa.Column('entity_type', sa.String(32),
                                               nullable=True, server_default='unknown'))
            for col in ('company_name', 'fio', 'location', 'email', 'phone',
                        'language_proficiency', 'work_authorization'):
                if col not in profile_cols:
                    batch_op.add_column(sa.Column(col, sa.String(), nullable=True))

    # ------------------------------------------------------------------ #
    # PROJECTS                                                             #
    # ------------------------------------------------------------------ #
    if 'projects' not in existing_tables:
        op.create_table(
            'projects',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('employer_id', sa.Integer(), nullable=False),
            sa.Column('title', sa.String(), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('budget', sa.Integer(), nullable=True),
            sa.Column('required_specialization', sa.String(), nullable=True),
            sa.Column('status', sa.String(32), nullable=False, server_default='open'),
            sa.Column('created_at', sa.DateTime(timezone=True),
                      server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
            sa.ForeignKeyConstraint(['employer_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
        )
        op.create_index('ix_projects_id', 'projects', ['id'], unique=False)
        op.create_index('ix_projects_employer_id', 'projects', ['employer_id'], unique=False)

    # ------------------------------------------------------------------ #
    # BIDS                                                                 #
    # ------------------------------------------------------------------ #
    if 'bids' not in existing_tables:
        op.create_table(
            'bids',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('project_id', sa.Integer(), nullable=False),
            sa.Column('worker_id', sa.Integer(), nullable=False),
            sa.Column('cover_letter', sa.String(), nullable=True),
            sa.Column('price_offer', sa.Integer(), nullable=True),
            sa.Column('status', sa.String(32), nullable=False, server_default='pending'),
            sa.Column('created_at', sa.DateTime(timezone=True),
                      server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
            sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['worker_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
        )
        op.create_index('ix_bids_id', 'bids', ['id'], unique=False)
        op.create_index('ix_bids_project_id', 'bids', ['project_id'], unique=False)
        op.create_index('ix_bids_worker_id', 'bids', ['worker_id'], unique=False)

    # ------------------------------------------------------------------ #
    # REVIEWS                                                              #
    # ------------------------------------------------------------------ #
    if 'reviews' not in existing_tables:
        op.create_table(
            'reviews',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('project_id', sa.Integer(), nullable=False),
            sa.Column('reviewer_id', sa.Integer(), nullable=False),
            sa.Column('worker_id', sa.Integer(), nullable=False),
            sa.Column('rating', sa.Float(), nullable=False),
            sa.Column('text', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True),
                      server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
            sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['reviewer_id'], ['users.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['worker_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('project_id'),
        )
        op.create_index('ix_reviews_worker_id', 'reviews', ['worker_id'], unique=False)
        op.create_index('ix_reviews_reviewer_id', 'reviews', ['reviewer_id'], unique=False)


def downgrade() -> None:
    op.drop_table('reviews')
    op.drop_table('bids')
    op.drop_table('projects')
    op.drop_table('profiles')
    op.drop_table('users')
