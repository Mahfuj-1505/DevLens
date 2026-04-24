"""MongoDB connection helpers."""

from pymongo import MongoClient, ASCENDING
from app.config.settings import get_settings

settings = get_settings()
_mongo_client = None
_index_created = False


def get_mongo_client() -> MongoClient:
    global _mongo_client
    if _mongo_client is None:
        if not settings.MONGODB_URI:
            raise RuntimeError("MONGODB_URI is not configured")
        _mongo_client = MongoClient(settings.MONGODB_URI)
    return _mongo_client


def get_reports_collection():
    global _index_created
    db = get_mongo_client()[settings.DATABASE_NAME]
    collection = db["reports"]
    if not _index_created:
        collection.create_index(
            [("user_email", ASCENDING), ("repository", ASCENDING)],
            unique=True,
            name="uniq_user_repository",
        )
        _index_created = True
    return collection
