<<<<<<< HEAD
from databases import Database
from sqlalchemy import create_engine, MetaData

DATABASE_URL = "sqlite:///./users.db"

# Fixed: databases library
database = Database(DATABASE_URL)
# Fixed: MetaData capitalization
metadata = MetaData()
=======
from databases import Database
from sqlalchemy import create_engine, MetaData

DATABASE_URL = "sqlite:///./users.db"

# Fixed: databases library
database = Database(DATABASE_URL)
# Fixed: MetaData capitalization
metadata = MetaData()
>>>>>>> 77970be2dc6760e5e0d90184cfbb7c737b07cfae
engine = create_engine(DATABASE_URL)