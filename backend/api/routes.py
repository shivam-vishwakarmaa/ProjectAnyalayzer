import os
import zipfile
import shutil
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from backend.services.ast_parser import get_language_for_file, parse_code_chunks
from backend.services.vector_store import add_code_chunks, search_code_chunks
from backend.services.llm import stream_llm_response

router = APIRouter()

UPLOAD_DIR = os.path.join(os.getcwd(), "uploaded_projects")
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

IGNORED_DIRS = {".git", "node_modules", "venv", "__pycache__", ".next", "dist", "build"}
IGNORED_FILES = {".env", "package-lock.json", "yarn.lock"}

def process_directory(extract_path: str):
    chunks = []
    for root, dirs, files in os.walk(extract_path):
        # Exclude ignored directories
        dirs[:] = [d for d in dirs if d not in IGNORED_DIRS]
        
        for file in files:
            if file in IGNORED_FILES:
                continue
                
            file_path = os.path.join(root, file)
            lang = get_language_for_file(file)
            if not lang:
                continue # Skip unknown files
            
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                
                # We need relative path for display
                rel_path = os.path.relpath(file_path, extract_path)
                file_chunks = parse_code_chunks(content, lang, rel_path)
                chunks.extend(file_chunks)
            except Exception as e:
                print(f"Error reading file {file_path}: {e}")
                
    return chunks

@router.post("/upload-project")
async def upload_project(file: UploadFile = File(...)):
    if not file.filename.endswith('.zip'):
        # For simplicity, if they upload a file, we treat it as zip in this MVP.
        # But wait, FastAPI direct folder upload isn't native via single File(...).
        # We expect a zip upload from frontend.
        pass
    
    # Save the uploaded file
    zip_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(zip_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    extract_path = os.path.join(UPLOAD_DIR, file.filename.replace('.zip', ''))
    
    try:
        # Extract zip
        if file.filename.endswith('.zip'):
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(extract_path)
            os.remove(zip_path) # cleanup
        
        # Parse and embed
        chunks = process_directory(extract_path)
        add_code_chunks(chunks)
        
        return {
            "status": "success", 
            "message": f"Successfully ingested {len(chunks)} chunks.",
            "file_count": len(chunks)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class AnalyzeRequest(BaseModel):
    query: str

@router.post("/analyze")
async def analyze_code(req: AnalyzeRequest):
    # Retrieve top 5 chunks
    docs = search_code_chunks(req.query, n_results=5)
    
    # Send to LLM in streaming fashion
    return StreamingResponse(stream_llm_response(req.query, docs), media_type="text/plain")
