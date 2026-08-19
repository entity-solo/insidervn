from sqlalchemy import Column, Float, Integer, String, Text

from ..database import Base


class Winrate(Base):
    __tablename__ = "winrates"

    person = Column(String, primary_key=True)
    wr = Column(Float, index=True)
    wins = Column(Integer)
    losses = Column(Integer)
    total_trades = Column(Integer)
    pnl = Column(Float)
    total = Column(Float)
    tickers = Column(Text)  # JSON list
