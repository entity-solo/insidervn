from sqlalchemy import Column, Float, Integer, String, Text

from ..database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True)
    ticker = Column(String(20), index=True)
    company = Column(Text)
    exchange = Column(String(10), index=True)
    person = Column(Text, index=True)
    role = Column(Text)
    role_key = Column(String(20), index=True)
    type = Column(String(20), index=True)
    shares = Column(Integer)
    executed = Column(Integer, index=True)
    p_from = Column(Float)
    p_to = Column(Float)
    date_reg = Column(String(10), index=True)
    date_from = Column(String(10))
    date_to = Column(String(10))
    source = Column(String(20))
    event_id = Column(Integer, index=True)
    status = Column(String(20))
    type_name = Column(Text)
    relationship = Column(Text)
    vol_before = Column(Integer)
    vol_after = Column(Integer)
    perf_1w = Column(Float)
    perf_1m = Column(Float)
    dip = Column(Float)
