import os
import zipfile
import shutil
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from services.ast_parser import get_language_for_file, parse_code_chunks
from services.vector_store import add_code_chunks, search_code_chunks
from services.llm import stream_llm_response

router = APIRouter()

UPLOAD_DIR = os.path.join(os.getcwd(), "uploaded_projects")
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

IGNORED_DIRS = {".git", "node_modules", "venv", "__pycache__", ".next", "dist", "build"}
IGNORED_FILES = {".env", "package-lock.json", "yarn.lock"}

def process_directory(extract_path: str, root_name: str):
    chunks = []
    
    def build_node(current_path, name):
        node = {"name": name, "type": "folder", "children": []}
        try:
            entries = os.listdir(current_path)
        except Exception:
            return node
            
        for entry in entries:
            if entry in IGNORED_DIRS or entry in IGNORED_FILES:
                continue
            
            full_path = os.path.join(current_path, entry)
            if os.path.isdir(full_path):
                child_node = build_node(full_path, entry)
                node["children"].append(child_node)
            else:
                lang = get_language_for_file(entry)
                content = ""
                try:
                    # Attempt to read all files as text for display in the IDE
                    with open(full_path, "r", encoding="utf-8") as f:
                        content = f.read()
                        
                    if lang:
                        rel_path = os.path.relpath(full_path, extract_path)
                        file_chunks = parse_code_chunks(content, lang, rel_path)
                        chunks.extend(file_chunks)
                except Exception as e:
                    # Ignore binary files or unreadable text files
                    pass
                        
                node["children"].append({
                    "name": entry,
                    "type": "file",
                    "content": content
                })
        
        node["children"].sort(key=lambda x: (x["type"] == "file", x["name"]))
        return node
        
    tree = build_node(extract_path, root_name)
    return chunks, [tree]

@router.post("/upload-project")
async def upload_project(file: UploadFile = File(...)):
    if not file.filename.endswith('.zip'):
        pass
    
    zip_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(zip_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    extract_path = os.path.join(UPLOAD_DIR, file.filename.replace('.zip', ''))
    
    try:
        if file.filename.endswith('.zip'):
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(extract_path)
            os.remove(zip_path)
        
        # Parse and embed
        chunks, tree_data = process_directory(extract_path, file.filename.replace('.zip', ''))
        add_code_chunks(chunks)
        
        return {
            "status": "success", 
            "message": f"Successfully ingested {len(chunks)} chunks.",
            "file_count": len(chunks),
            "tree_data": tree_data
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
