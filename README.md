# Project Analyzer API

Project Analyzer API is an offline-capable AI codebase analyzer and modification platform that allows you to upload entire code repositories for deep parsing, embedding, and AI-assisted conversational querying. It is built as a complete full-stack web application consisting of a FastAPI + ChromaDB backend and a Next.js + React frontend.

## 🚀 Features

*   **Offline Codebase Ingestion:** Upload repositories as `.zip` files.
*   **AST Code Parsing:** Deep inspection using `tree-sitter` to chunk code logically by functions, classes, and methods, making it robust against large files.
*   **Vector Search powered by ChromaDB:** Semantic search runs directly locally, embedding your parsed syntax trees into a lightweight embedded database.
*   **Full Stack UI:** A sleek Next.js interface to browse the uploaded code tree, read files intuitively, and use an interactive AI chat window to reason over your codebase.

## 📁 System Architecture

The project contains two main module systems:

### 1. Backend (`/backend`)
*   **Server:** FastAPI + Uvicorn
*   **Database:** ChromaDB (persistent local edge vector store running in `.chroma/`)
*   **Internal Services:**
    *   **Upload Pipeline (`routes.py`):** Handles ZIP processing and extraction.
    *   **AST Extractor (`ast_parser.py`):** Uses `tree-sitter-languages` to detect file extensions and break codebase syntax structures intelligently into chunks to avoid losing context in LLM token windows.
    *   **Vector Embeddings (`vector_store.py`):** Embeds syntax blocks safely using `all-MiniLM-L6-v2`.
    *   **LLM Provider (`llm.py`):** Streams conversational responses utilizing RAG contexts from Chroma.

### 2. Frontend (`/frontend`)
*   **Framework:** Next.js (React 19)
*   **Styling:** Tailwind CSS + Framer Motion for premium aesthetics.
*   **Components:** Offers an Explorer panel (to mirror the codebase structure), an embedded Monaco Editor instance (for file viewing), and a robust standard `AIChat.tsx` implementation interfacing with the `/analyze` stream.

## 🔍 How it Analyzes Repositories (Will it analyze the "full" repo?)

No, the platform does **not** blindly index the *entire* repository. It takes a surgical approach to avoid overwhelming the vector context window. Here is exactly how the parsing mechanism treats your uploads:

1.  **Ignored System/Build Paths:** During the ZIP extraction sequence, it actively skips folders such as `node_modules`, `venv`, `__pycache__`, `.git`, `.next`, `dist`, and `build`. Additionally, generic lockfiles/configs (`package-lock.json`, `.env`) are ignored to optimize speed and enhance security.
2.  **Strict Language Constraints:** The core AST engine will **only embed contents of code files** explicitly registered in its mapping array. The currently supported languages are:
    *   Python (`.py`)
    *   JavaScript (`.js`, `.jsx`)
    *   TypeScript (`.ts`, `.tsx`)
    *   Go (`.go`), Java (`.java`), C/C++ (`.c`, `.cpp`), C# (`.cs`), and Rust (`.rs`)
3.  **Bypassed Document Types:** Essential documentation and configuration files like Markdown (`.md`), HTML (`.html`), JSON (`.json`), YAML/TOML, and CSS (`.css`) are intentionally **bypassed** by the embedding step. They will populate realistically inside the UI file-tree as readable structures, but they will not be indexed by ChromaDB, meaning the AI will not be able to "search" into them during chat interactions unless modified.
4.  **AST Chunking Engine:** For valid code files, it runs a syntax tree search tailored specifically for declarations, functions, classes, and methods. In the scenario where block-level structures aren't identified but the file fits an extension mapping, it resorts to logging the module fallback (the entire file text) to guarantee inclusion.

## 💻 Getting Started

### Prerequisites
*   Node.js (v18+)
*   Python (3.9+)
*   **Ollama** (for local LLM inference)

### 🧠 Model Setup
The project uses **Ollama** to run models locally. Before starting the backend, ensure Ollama is installed and the required model is pulled:

1.  **Install Ollama:** Download it from [ollama.com](https://ollama.com/).
2.  **Pull the Model:** Open your terminal and run:
    ```bash
    ollama pull qwen2.5-coder
    ```
    *Note: You can change the model in `backend/services/llm.py` if you prefer a different one.*

### Backend Setup
1. Launch the backend environments:
```bash
cd backend
python -m venv venv
```
2. Activate your Virtual Environment:
```bash
# Windows
venv\Scripts\activate
# Mac / Linux
source venv/bin/activate
```
3. Initialize the server:
```bash
pip install -r requirements.txt
uvicorn main:app --reload
```
*The backend API runs on `http://127.0.0.1:8000`*

### Frontend Setup
1. Download NPM dependencies:
```bash
cd frontend
npm install
```
2. Spin up the application locally:
```bash
npm run dev
```
*The UI panel will compile & host beautifully on `http://localhost:3000`*
