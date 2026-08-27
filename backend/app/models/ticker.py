from sqlalchemy import Column, Float, String

from app.database import Base


class Ticker(Base):
    __tablename__ = "tickers"

    ticker = Column(String(16), primary_key=True)
    outstanding_shares = Column(Float)
    updated_at = Column(String(32))
