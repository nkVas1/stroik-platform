import asyncio
from logging.config import fileConfig
import sys
from os.path import abspath, dirname

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# Add backend directory to path for imports
sys.path.insert(0, dirname(dirname(abspath(__file__))))

from app.core.config import settings
from app.core.database import Base, _resolve_db_url
from app.models.db_models import User, Profile  # noqa: F401  (registered with metadata)

# this is the Alembic Config object
config = context.config

# Resolve the DB URL: converts plain postgresql:// -> postgresql+asyncpg://
# This is required when Render injects DATABASE_URL without the +asyncpg scheme.
_db_url = _resolve_db_url(settings.database_url)
config.set_main_option("sqlalchemy.url", _db_url)

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Model metadata for autogenerate support
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode (no live DB connection)."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    # render_as_batch=True enables batch-mode for SQLite ALTER TABLE compat.
    # PostgreSQL ignores it (ALTER works natively).
    is_sqlite = _db_url.startswith("sqlite")
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        render_as_batch=is_sqlite,
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Create async engine and run migrations online."""
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
