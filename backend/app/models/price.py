from sqlalchemy import Column, String, Text

from ..database import Base


class Price(Base):
    __tablename__ = "prices"

    ticker = Column(String(20), primary_key=True)
    dates = Column(Text)  # JSON array of weekly dates (aligned axis)
    values = Column(Text)  # JSON array of close prices aligned to dates (null where missing)
