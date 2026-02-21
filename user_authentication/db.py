from databases import Database
from sqlalchemy import create_engine, MetaData

DATABASE_URL = "sqlite:///./users.db"

# Fixed: databases library
database = Database(DATABASE_URL)
# Fixed: MetaData capitalization
metadata = MetaData()
engine = create_engine(DATABASE_URL)