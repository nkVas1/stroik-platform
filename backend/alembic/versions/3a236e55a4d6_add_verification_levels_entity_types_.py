"""Add verification levels, entity types, and legal filters

Revision ID: 3a236e55a4d6
Revises: 32b48a2c1c31
Create Date: 2026-04-26 22:40:28.832244
"""
from alembic import op
import sqlalchemy as sa

revision = '3a236e55a4d6'
down_revision = '32b48a2c1c31'
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table('profiles') as batch_op:
        batch_op.add_column(sa.Column(
            'verification_level',
            sa.Enum('0', '1', '2', '3', name='verificationlevel'),
            nullable=True,
        ))
        batch_op.add_column(sa.Column(
            'entity_type',
            sa.Enum('physical', 'legal', 'unknown', name='entitytype'),
            nullable=True,
        ))
        batch_op.add_column(sa.Column('company_name',          sa.String(), nullable=True))
        batch_op.add_column(sa.Column('fio',                   sa.String(), nullable=True))
        batch_op.add_column(sa.Column('location',              sa.String(), nullable=True))
        batch_op.add_column(sa.Column('email',                 sa.String(), nullable=True))
        batch_op.add_column(sa.Column('phone',                 sa.String(), nullable=True))
        batch_op.add_column(sa.Column('language_proficiency',  sa.String(), nullable=True))
        batch_op.add_column(sa.Column('work_authorization',    sa.String(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('profiles') as batch_op:
        batch_op.drop_column('work_authorization')
        batch_op.drop_column('language_proficiency')
        batch_op.drop_column('phone')
        batch_op.drop_column('email')
        batch_op.drop_column('location')
        batch_op.drop_column('fio')
        batch_op.drop_column('company_name')
        batch_op.drop_column('entity_type')
        batch_op.drop_column('verification_level')
