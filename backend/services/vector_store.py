import os
import uuid
import chromadb
from chromadb.config import Settings

CHROMA_PATH = os.path.join(os.getcwd(), ".chroma")
client = chromadb.PersistentClient(path=CHROMA_PATH)

# Using default embedding function (all-MiniLM-L6-v2) for simplicity and offline capability
collection = client.get_or_create_collection(name="codebase")

def add_code_chunks(chunks):
    if not chunks:
        return
    documents = []
    metadatas = []
    ids = []
    
    for chunk in chunks:
        documents.append(chunk["content"])
        metadatas.append({
            "filepath": chunk["filepath"],
            "name": chunk["name"],
            "type": chunk["type"],
            "start_line": chunk["start_line"],
            "end_line": chunk["end_line"]
        })
        ids.append(str(uuid.uuid4()))
        
    collection.add(documents=documents, metadatas=metadatas, ids=ids)

def search_code_chunks(query: str, n_results: int = 5):
    if collection.count() == 0:
        return []

    results = collection.query(query_texts=[query], n_results=n_results)
    
    if not results["documents"] or not results["documents"][0]:
        return []
    
    docs = results["documents"][0]
    meta = results["metadatas"][0]
    
    combined = []
    for d, m in zip(docs, meta):
        combined.append({
            "content": d,
            "metadata": m
        })
    return combined

def retrieve_all_documents():
    return collection.get()
