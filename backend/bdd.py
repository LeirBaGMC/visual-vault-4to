from sqlmodel import SQLModel, create_engine, Session

# Nombre del archivo físico que se creará en tu proyecto
sqlite_file_name = "database.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"

# Configuración del motor
connect_args = {"check_same_thread": False}
engine = create_engine(sqlite_url, echo=True, connect_args=connect_args)

# Función para crear las tablas al encender el servidor
def init_db():
    SQLModel.metadata.create_all(engine)

# Función para abrir la bóveda de datos cada vez que alguien guarde un Pin
def get_session():
    with Session(engine) as session:
        yield session