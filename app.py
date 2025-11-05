import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date, time

class Paciente(BaseModel):
    id: int
    nome: str
    tutor: str
    especie: str
    raca: str
    status: str = Field(..., description="Ex: 'Ativo' ou 'Inativo'")

class Consulta(BaseModel):
    id: Optional[int] = None
    paciente_id: int
    veterinario: str # Baseado no seu form (Dr. Ana Silva)
    data: date
    hora: time
    motivo: str

# Iniciando a aplicação
app = FastAPI(
    title="VetSys API",
    description="Backend para o sistema de gerenciamento veterinário VetSys.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", tags=["Root"])
def read_root():
    """ Endpoint inicial para verificar se a API está online. """
    return {"Sistema": "VetSys API", "Status": "Online"}

# --- Pacientes ---

@app.get("/api/pacientes", response_model=List[Paciente], tags=["Pacientes"])
def get_pacientes():
    """ Busca a lista de todos os pacientes. """
    # no banco de dados substituir as informações simuladas abaixo pelas do db
    mock_pacientes = [
        Paciente(id=1, nome="Max", tutor="Dr. Ana Silva", especie="Canino", raca="Golden Retriever", status="Ativo"),
        Paciente(id=2, nome="Mia", tutor="João Santos", especie="Felino", raca="Siamês", status="Ativo"),
        Paciente(id=3, nome="Pipo", tutor="Carla Mendes", especie="Canino", raca="Bulldog Francês", status="Inativo")
    ]
    return mock_pacientes

@app.post("/api/pacientes", response_model=Paciente, status_code=201, tags=["Pacientes"])
def create_paciente(paciente: Paciente):
    """ Cria um novo paciente no sistema. """
    print(f"Recebido novo paciente: {paciente.nome}")
    paciente_criado = paciente.copy(update={"id": 123}) 
    return paciente_criado


@app.post("/api/consultas", response_model=Consulta, status_code=201, tags=["Consultas"])
def create_consulta(consulta: Consulta):
    """ Agenda (cria) uma nova consulta. """
    print(f"Recebida nova consulta para data: {consulta.data}")
    consulta_criada = consulta.copy(update={"id": 456}) 
    return consulta_criada

if __name__ == "__main__":
    """
    Inicia o servidor da API usando Uvicorn.
    """
    uvicorn.run(
        "app:app", 
        host="127.0.0.1", 
        port=8000, 
        reload=True
    )
