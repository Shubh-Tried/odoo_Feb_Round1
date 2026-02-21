"""
FleetFlow - PostgreSQL Database Module
Handles all database operations for user management.
"""
import psycopg2
import psycopg2.extras
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL")

def get_connection():
    """Get a database connection from the DATABASE_URL."""
    if not DATABASE_URL:
        # Prevent silent failures, fail fast if the URI isn't provided
        raise ValueError("DATABASE_URL environment variable is not set. Please set it to an online PostgreSQL database URI.")
    return psycopg2.connect(DATABASE_URL)


def init_db():
    """Create tables and seed default users if the table is empty."""
    if not DATABASE_URL:
        print("Skipping DB init: DATABASE_URL not set.")
        return

    conn = get_connection()
    conn.autocommit = True
    cursor = conn.cursor()

    # Enums (We must use DO $$ blocks because CREATE TYPE IF NOT EXISTS doesn't exist)
    cursor.execute("""
    DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
            CREATE TYPE user_role AS ENUM ('admin', 'manager', 'dispatcher', 'safety', 'finance');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vehicle_status') THEN
            CREATE TYPE vehicle_status AS ENUM ('Available', 'On Trip', 'In Shop', 'Retired', 'Active', 'En Route');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'driver_status') THEN
            CREATE TYPE driver_status AS ENUM ('On Duty', 'Off Duty', 'Suspended', 'On Trip');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trip_status') THEN
            CREATE TYPE trip_status AS ENUM ('Draft', 'Dispatched', 'Completed', 'Cancelled');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vehicle_type_enum') THEN
            CREATE TYPE vehicle_type_enum AS ENUM ('Truck', 'Van', 'Bike');
        END IF;
    END $$;
    """)

    # Tables based on user schema (augmented with frontend requirements)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(150) UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role user_role NOT NULL,
            status TEXT DEFAULT 'active',
            avatar TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS vehicles (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            vehicle_id TEXT UNIQUE NOT NULL,
            make TEXT NOT NULL DEFAULT '',
            model TEXT NOT NULL DEFAULT '',
            year INTEGER NOT NULL DEFAULT 2020,
            license_plate VARCHAR(20) UNIQUE NOT NULL,
            vehicle_type vehicle_type_enum NOT NULL,
            vehicle_class TEXT NOT NULL DEFAULT 'Class 8',
            max_capacity NUMERIC(10,2) NOT NULL DEFAULT 5000 CHECK (max_capacity > 0),
            odometer NUMERIC(12,2) DEFAULT 0 CHECK (odometer >= 0),
            acquisition_cost NUMERIC(12,2) DEFAULT 0 CHECK (acquisition_cost >= 0),
            status vehicle_status DEFAULT 'Available',
            vin TEXT NOT NULL DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS drivers (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            license_number VARCHAR(50) UNIQUE NOT NULL,
            license_category VARCHAR(50) NOT NULL,
            license_expiry_date DATE NOT NULL,
            status driver_status DEFAULT 'On Duty',
            safety_score NUMERIC(5,2) DEFAULT 100 CHECK (safety_score >= 0),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS trips (
            id SERIAL PRIMARY KEY,
            vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
            driver_id INTEGER NOT NULL REFERENCES drivers(id) ON DELETE RESTRICT,
            cargo_weight NUMERIC(10,2) NOT NULL CHECK (cargo_weight > 0),
            origin VARCHAR(150) NOT NULL,
            destination VARCHAR(150) NOT NULL,
            status trip_status DEFAULT 'Draft',
            start_odometer NUMERIC(12,2),
            end_odometer NUMERIC(12,2),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP
        );
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS maintenance_logs (
            id SERIAL PRIMARY KEY,
            vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
            description TEXT NOT NULL,
            cost NUMERIC(12,2) NOT NULL CHECK (cost >= 0),
            service_date DATE DEFAULT CURRENT_DATE
        );
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS fuel_logs (
            id SERIAL PRIMARY KEY,
            vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
            trip_id INTEGER REFERENCES trips(id) ON DELETE SET NULL,
            liters NUMERIC(10,2) NOT NULL CHECK (liters > 0),
            cost NUMERIC(12,2) NOT NULL CHECK (cost >= 0),
            date DATE DEFAULT CURRENT_DATE
        );
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS trip_revenue (
            id SERIAL PRIMARY KEY,
            trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
            revenue_amount NUMERIC(12,2) NOT NULL CHECK (revenue_amount >= 0)
        );
    """)

    # Indexes
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_vehicle_status ON vehicles(status);
        CREATE INDEX IF NOT EXISTS idx_driver_status ON drivers(status);
        CREATE INDEX IF NOT EXISTS idx_trip_status ON trips(status);
        CREATE INDEX IF NOT EXISTS idx_trip_vehicle ON trips(vehicle_id);
        CREATE INDEX IF NOT EXISTS idx_trip_driver ON trips(driver_id);
    """)

    # Check to seed users
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        seed_users = [
            ("Admin User",     "admin@fleetflow.com",    "admin123", "admin",     "active", "https://i.pravatar.cc/150?img=11"),
            ("Jim Halpert",    "jim@fleetflow.com",      "", "dispatcher", "active", "https://i.pravatar.cc/150?img=33"),
            ("Dwight Schrute", "dwight@fleetflow.com",   "", "safety",     "active", "https://i.pravatar.cc/150?img=12"),
            ("Oscar Martinez", "oscar@fleetflow.com",    "", "finance",    "active", "https://i.pravatar.cc/150?img=14"),
            ("Michael Scott",  "michael@fleetflow.com",  "", "manager",    "active", "https://i.pravatar.cc/150?img=15"),
            ("Pam Beesly",     "pam@fleetflow.com",      "", "dispatcher", "inactive", "https://i.pravatar.cc/150?img=5"),
            ("Meer",           "saudtopiwala@gmail.com", "", "dispatcher", "active", "https://i.pravatar.cc/150?img=60"),
            ("Mahir",          "mahir@gmail.com",        "", "safety",     "active", "https://i.pravatar.cc/150?img=61"),
        ]
        psycopg2.extras.execute_values(cursor, 
            "INSERT INTO users (name, email, password_hash, role, status, avatar) VALUES %s", 
            seed_users
        )

    # Check to seed vehicles
    cursor.execute("SELECT COUNT(*) FROM vehicles")
    if cursor.fetchone()[0] == 0:
        seed_vehicles = [
            ("Volvo VNL", "TRK-8492", "Volvo", "VNL 860", 2022, "IL-48921", "Truck", "Class 8", 12000.00, 142500, 150000, "Active", "1FUJA6CG5CLBX1234"),
            ("Ford Transit", "VAN-1044", "Ford", "Transit", 2023, "NY-10442", "Van", "Class 2", 3000.00, 28400, 45000, "In Shop", "1FTBW2CM6MKA56789"),
            ("Freightliner Cascadia", "TRK-7731", "Freightliner", "Cascadia", 2021, "TX-77312", "Truck", "Class 8", 12000.00, 210000, 140000, "En Route", "3AKJHHDR1MSMX9876"),
        ]
        psycopg2.extras.execute_values(cursor,
            "INSERT INTO vehicles (name, vehicle_id, make, model, year, license_plate, vehicle_type, vehicle_class, max_capacity, odometer, acquisition_cost, status, vin) VALUES %s",
            seed_vehicles
        )

    conn.close()


# ---------------------------------------------------------------------------
# User CRUD Operations
# ---------------------------------------------------------------------------

def get_all_users():
    """Return all users as a list of dicts."""
    conn = get_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cursor.execute("SELECT * FROM users ORDER BY id")
    rows = cursor.fetchall()
    conn.close()
    return rows


def get_user_by_id(user_id: int):
    """Return a single user dict, or None."""
    conn = get_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
    row = cursor.fetchone()
    conn.close()
    return row


def create_user(name: str, email: str, role: str, password: str = ""):
    """Insert a new user and return it as a dict."""
    conn = get_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    avatar = f"https://i.pravatar.cc/150?img={abs(hash(email)) % 70}"
    cursor.execute(
        "INSERT INTO users (name, email, role, status, avatar, password_hash) VALUES (%s, %s, %s, 'active', %s, %s) RETURNING id",
        (name, email, role, avatar, password),
    )
    new_id = cursor.fetchone()['id']
    conn.commit()
    conn.close()
    return get_user_by_id(new_id)


def update_user_role(user_id: int, new_role: str):
    """Update a user's role. Returns the updated user or None."""
    conn = get_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cursor.execute("UPDATE users SET role = %s WHERE id = %s", (new_role, user_id))
    conn.commit()
    conn.close()
    return get_user_by_id(user_id)


def delete_user(user_id: int):
    """Delete a user by id. Returns True if a row was affected."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
    affected = cursor.rowcount
    conn.commit()
    conn.close()
    return affected > 0


# ---------------------------------------------------------------------------
# Vehicle CRUD Operations
# ---------------------------------------------------------------------------

def get_all_vehicles():
    """Return all vehicles as a list of dicts."""
    conn = get_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cursor.execute("SELECT * FROM vehicles ORDER BY id")
    rows = cursor.fetchall()
    conn.close()
    # Map 'odometer' back to 'mileage' for frontend UI compatibility
    for r in rows:
        r['mileage'] = r.get('odometer', 0)
    return rows


def get_vehicle_by_id(vehicle_id: int):
    """Return a single vehicle dict, or None."""
    conn = get_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cursor.execute("SELECT * FROM vehicles WHERE id = %s", (vehicle_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        row['mileage'] = row.get('odometer', 0)
    return row


def create_vehicle(vehicle_id: str, make: str, model: str, year: int,
                   vehicle_type: str, vehicle_class: str, mileage: int,
                   vin: str, license_plate: str):
    """Insert a new vehicle and return it as a dict."""
    conn = get_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    name = f"{make} {model}"
    
    # Map frontend type string back to DB Enums
    v_type = "Truck" if vehicle_type == "Heavy Duty" else "Van" if vehicle_type == "Cargo Van" else "Truck"
    
    cursor.execute(
        """INSERT INTO vehicles 
           (name, vehicle_id, make, model, year, vehicle_type, vehicle_class, odometer, max_capacity, status, vin, license_plate) 
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 1000, 'Active', %s, %s) RETURNING id""",
        (name, vehicle_id, make, model, year, v_type, vehicle_class, mileage, vin, license_plate),
    )
    new_id = cursor.fetchone()['id']
    conn.commit()
    conn.close()
    return get_vehicle_by_id(new_id)


def delete_vehicle(vehicle_db_id: int):
    """Delete a vehicle by database id. Returns True if a row was affected."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM vehicles WHERE id = %s", (vehicle_db_id,))
    affected = cursor.rowcount
    conn.commit()
    conn.close()
    return affected > 0


# ---------------------------------------------------------------------------
# Auth Helpers
# ---------------------------------------------------------------------------

def get_user_by_email(email: str):
    """Return a single user dict looked up by email, or None."""
    conn = get_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
    row = cursor.fetchone()
    conn.close()
    return row


def verify_login(email: str, password: str):
    """Verify email + password. Returns user dict if valid, None otherwise."""
    user = get_user_by_email(email)
    if not user:
        return None
    stored_pw = user.get("password_hash", "")
    # Seed users with no password — allow them through
    if not stored_pw:
        return user
    # Plaintext comparison
    if password == stored_pw:
        return user
    return None
