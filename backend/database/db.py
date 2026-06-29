import os
import logging
from sqlalchemy import create_engine, Column, Integer, String, Text, ForeignKey, UniqueConstraint, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from sqlalchemy.types import JSON as CommonJSON
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector

logger = logging.getLogger(__name__)

# Fallback setup strictly gracefully degrading if the DATABASE_URL fails to provide proper PG params!
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "users.sqlite")
    DATABASE_URL = f"sqlite:///{db_path}"
    logger.warning(f"No Postgres DATABASE_URL specified. Mapping securely to fallback SQLite mapping at: {DATABASE_URL}")

engine_args = {}
if DATABASE_URL.startswith("sqlite"):
    engine_args["connect_args"] = {"check_same_thread": False}
else:
    engine_args.update({
        "pool_size": 10,
        "max_overflow": 20,
        "pool_timeout": 30,
        "pool_recycle": 1800,
    })

try:
    engine = create_engine(DATABASE_URL, **engine_args)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
except Exception as e:
    logger.error(f"SQLAlchemy Engine binding logically failed: {e}")
    raise

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=True)
    name = Column(String, nullable=True)
    profile = relationship("Profile", back_populates="user", uselist=False)

class Profile(Base):
    __tablename__ = 'profiles'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete="CASCADE"), index=True)
    experience = Column(Text, default="")
    target_career = Column(String, default="")
    army_role = Column(String, default="")
    embedding = Column(Vector(384), nullable=True)
    
    user = relationship("User", back_populates="profile")
    skills = relationship("Skill", back_populates="profile", cascade="all, delete-orphan")
    resume_data = relationship("ResumeData", back_populates="profile", uselist=False, cascade="all, delete-orphan")
    
    applications = relationship("ApplicationHistory", back_populates="profile", cascade="all, delete-orphan")
    roadmaps = relationship("LearningRoadmap", back_populates="profile", cascade="all, delete-orphan")
    chats = relationship("ChatHistory", back_populates="profile", cascade="all, delete-orphan")

class Skill(Base):
    __tablename__ = 'skills'
    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey('profiles.id', ondelete="CASCADE"), index=True)
    name = Column(String, index=True)
    
    profile = relationship("Profile", back_populates="skills")
    
    __table_args__ = (
        UniqueConstraint('profile_id', 'name', name='unique_profile_skill'),
    )

class ResumeData(Base):
    __tablename__ = 'resume_data'
    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey('profiles.id', ondelete="CASCADE"), index=True)
    data = Column(CommonJSON, default=dict)
    
    profile = relationship("Profile", back_populates="resume_data")

class Job(Base):
    __tablename__ = "jobs"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    company = Column(String, nullable=False)
    location = Column(String, nullable=False)
    role = Column(String, index=True, nullable=True)
    link = Column(String, nullable=True)
    salary = Column(String, nullable=True)
    source = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    
    __table_args__ = (
        UniqueConstraint('title', 'company', 'location', name='unique_job_tcl'),
    )

class ApplicationHistory(Base):
    __tablename__ = "application_history"
    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey('profiles.id', ondelete="CASCADE"), index=True)
    job_id = Column(Integer, ForeignKey('jobs.id', ondelete="SET NULL"), nullable=True)
    applied_at = Column(DateTime, server_default=func.now())
    status = Column(String, default="applied")
    
    profile = relationship("Profile", back_populates="applications")
    job = relationship("Job")

class LearningRoadmap(Base):
    __tablename__ = "learning_roadmaps"
    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey('profiles.id', ondelete="CASCADE"), index=True)
    target_role = Column(String, nullable=False)
    roadmap_data = Column(CommonJSON, default=dict)
    created_at = Column(DateTime, server_default=func.now())
    
    profile = relationship("Profile", back_populates="roadmaps")

class ChatHistory(Base):
    __tablename__ = "chat_history"
    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey('profiles.id', ondelete="CASCADE"), index=True)
    message = Column(Text, nullable=False)
    response = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    
    profile = relationship("Profile", back_populates="chats")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    try:
        # If using Postgres, try to create pgvector extension first
        if not DATABASE_URL.startswith("sqlite"):
            from sqlalchemy import text
            with engine.connect() as conn:
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
                conn.commit()
                logger.info("pgvector extension verified/created in PostgreSQL.")
    except Exception as ext_err:
        logger.warning(f"Could not create pgvector extension: {ext_err}. Proceeding anyway.")

    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database schemas initialized successfully (Base.metadata.create_all completed).")
        
        # Add army_role column to profiles table safely if it doesn't exist
        from sqlalchemy import text
        with engine.connect() as conn:
            try:
                conn.execute(text("ALTER TABLE profiles ADD COLUMN army_role VARCHAR(255) DEFAULT '';"))
                conn.commit()
                logger.info("Database schemas upgraded: army_role column verified in profiles table.")
            except Exception:
                pass
    except Exception as e:
        logger.error(f"Database generation mapping failed unexpectedly: {e}")
