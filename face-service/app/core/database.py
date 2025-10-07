import asyncpg
import logging
from app.config import settings

logger = logging.getLogger(__name__)

_pool = None


async def init_db():
    """Initialize database connection pool"""
    global _pool
    
    try:
        _pool = await asyncpg.create_pool(
            host=settings.POSTGRES_HOST,
            port=settings.POSTGRES_PORT,
            database=settings.POSTGRES_DB,
            user=settings.POSTGRES_USER,
            password=settings.POSTGRES_PASSWORD,
            min_size=5,
            max_size=20
        )
        logger.info("✅ Database connection pool created")
    except Exception as e:
        logger.error(f"❌ Error creating database pool: {e}")
        raise


async def get_db_pool():
    """Get database pool instance"""
    global _pool
    if _pool is None:
        await init_db()
    return _pool


async def close_db():
    """Close database connection pool"""
    global _pool
    if _pool:
        await _pool.close()
        logger.info("Database pool closed")