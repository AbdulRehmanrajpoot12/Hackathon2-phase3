from sqlmodel import create_engine, Session, SQLModel
from sqlalchemy.pool import QueuePool
from typing import Generator
import os
import sys
from dotenv import load_dotenv

# Force UTF-8 encoding for stdout/stderr (fixes Windows charmap issues)
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')
if sys.stderr.encoding != 'utf-8':
    sys.stderr.reconfigure(encoding='utf-8')

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Create engine with connection pooling for Neon serverless
# Configuration optimized for serverless PostgreSQL with SSL
engine = create_engine(
    DATABASE_URL,
    echo=True,  # Keep debug logging
    poolclass=QueuePool,
    pool_size=5,  # Number of connections to keep open
    max_overflow=10,  # Additional connections when pool is full
    pool_pre_ping=True,  # Test connections before using (critical for serverless)
    pool_recycle=3600,  # Recycle connections after 1 hour (before Neon timeout)
    connect_args={
        "connect_timeout": 10,  # Connection timeout in seconds
        "keepalives": 1,  # Enable TCP keepalives
        "keepalives_idle": 30,  # Seconds before sending keepalive
        "keepalives_interval": 10,  # Seconds between keepalives
        "keepalives_count": 5,  # Number of keepalives before giving up
        "client_encoding": "utf8",  # Force UTF-8 encoding for PostgreSQL
    }
)

def get_session() -> Generator[Session, None, None]:
    """Dependency for getting database session"""
    with Session(engine) as session:
        yield session

def create_db_and_tables():
    """Create all database tables"""
    # Import all models to ensure they are registered with SQLModel
    from models.task import Task
    from models.conversation import Conversation
    from models.message import Message

    SQLModel.metadata.create_all(engine)
