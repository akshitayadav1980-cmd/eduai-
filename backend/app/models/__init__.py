# ORM models for the vernacular_ai database.
# Import all model classes here so SQLAlchemy's mapper registry
# is fully populated before any query is executed.

from app.models.progress import LearningActivity
from app.models.user import User, UserRole
from app.models.vocabulary import Category, Dataset, Language, VocabularyEntry

__all__ = [
    "Dataset",
    "Language",
    "Category",
    "VocabularyEntry",
    "User",
    "UserRole",
    "LearningActivity",
]

