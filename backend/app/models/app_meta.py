from sqlalchemy import Column, String, Text

from ..database import Base


class AppMeta(Base):
    """Tiny key/value store for pipeline bookkeeping (last crawl time etc.)."""

    __tablename__ = "app_meta"

    key = Column(String(64), primary_key=True)
    value = Column(Text)
