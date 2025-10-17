# Local Hybrid RAG Assistant

A local, privacy-preserving AI assistant that answers questions from your own PDF and CSV files using advanced hybrid Retrieval-Augmented Generation (RAG). Built with FastAPI, LangChain, LangGraph, Ollama, Chroma, and a modern React + TypeScript frontend.

---

## Features

- **Hybrid RAG (Dense + Sparse):** Every query uses both vector (semantic) and keyword (BM25) search, combining results for robust, accurate retrieval from all your files.
- **Multi-file, Multi-format Support:** Upload and query multiple PDF and CSV files at once.
- **Per-CSV Column Selection:** For each CSV, choose which columns to use for retrieval and which to store as metadata.
- **Local LLM:** Uses Llama 3.2 via Ollama for fast, private, on-device language understanding.
- **Modern UI:** Clean, responsive React + Tailwind CSS interface for multi-file upload, per-CSV column selection, and chat.
- **Smart Routing:** Automatically detects file type and routes queries to the correct pipeline.
- **Data Privacy:** All processing is local—no data ever leaves your computer.
- **Containerized Deployment:** Uses Docker Compose to orchestrate frontend, backend, and Ollama containers for easy setup and reproducibility.

---

## Architecture

- **Frontend:**

  - React + TypeScript, built with Vite, styled with Tailwind CSS.
  - Served by Nginx in a Docker container.
  - Provides UI for uploading files, selecting CSV columns, and chatting with the assistant.

- **Backend:**

  - Python (FastAPI), containerized.
  - Handles API requests, document ingestion, embedding, and retrieval.
  - Uses Chroma DB for vector storage and similarity search.
  - Integrates with LangChain and LangGraph for RAG pipeline.

- **Ollama Container:**

  - Runs LLMs locally (llama 3.2, mxbai-embed-large).
  - Exposes an API for inference, ensuring all data stays on-prem.

- **Data Storage:**
  - Embeddings and metadata are stored temporarily in memory or ephemeral storage during each session.
  - The vector database is reset on every backend restart; data is not persistent.
  - Uploaded files are processed locally and never leave your machine.

---

## How It Works

1. **Upload Files:**

   - Select and upload multiple PDFs and/or CSVs at once.
   - For each CSV, select which columns to use for retrieval (e.g., `product_name`, `description`) and which to store as metadata (e.g., `id`, `category`).
   - PDFs are automatically split and embedded for hybrid search.

2. **Ingest Data:**

   - Click "Create Vector Database" to ingest all selected files and columns.

3. **Ask Questions:**

   - Enter natural language queries in the chat.
   - The system retrieves relevant content using both vector and keyword search, then generates an answer using the local LLM.

4. **Hybrid Retrieval:**
   - Every query uses both dense (vector) and sparse (BM25) retrievers, combining results for best accuracy.

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- Docker & Docker Compose
- Ollama (for local LLM)
- (Optional) CUDA for GPU acceleration

### Quick Start (Docker Compose)

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Mithil-Dudam/Local-Hybrid-RAG-Assistant.git
   cd Local-Hybrid-RAG-Assistant
   ```

2. **Start all services:**

   ```bash
   docker compose up --build
   ```

3. **Access the app:**
   - Frontend: [http://localhost:5173](http://localhost:5173)
   - Backend API: [http://localhost:8000/docs](http://localhost:8000/docs) (FastAPI docs)
   - Ollama: [http://localhost:11434](http://localhost:11434) (Ollama API)

### Manual Setup (Development)

#### Backend

```bash
# Install Python dependencies
pip install -r requirements.txt

# Start the FastAPI server
uvicorn app:app --reload
```

#### Frontend

```bash
cd app_ui
npm install
npm run dev
```

### Usage

1. Open the frontend in your browser (default: http://localhost:5173).
2. Upload one or more PDF and/or CSV files.
3. For each CSV, select columns for retrieval and metadata.
4. Click "Create Vector Database" to ingest all files.
5. Ask questions in the chat interface. The system will search across all uploaded files using hybrid retrieval and generate answers using the local LLM.

---

## Example Queries & Test Data

- Example files are included for testing:
  - `products.csv`, `orders.csv`: Product and order data for cross-file queries.
  - `artists.pdf`, `solar_system.pdf`: Example PDFs for multi-format and hybrid testing.

**Sample queries:**

- "Which products were ordered in July?"
- "List all artists mentioned in the PDFs."
- "What is the description of product ID 123?"
- "Summarize the solar system."

---

## Troubleshooting / FAQ

- **Port conflicts?**  
   Default ports are 8000 (backend), 5173 (frontend), and 11434 (Ollama). Change them in `app.py`, `vite.config.ts`, or `docker-compose.yml` if needed.
- **GPU Acceleration?**  
   Install CUDA and the appropriate Ollama model for GPU support.
- **Model download stalls?**  
   Check your internet connection or try pulling the model again.

---

## Tech Stack

- **Backend:** FastAPI, LangChain, LangGraph, Chroma, BM25, TfidfVectorizer, PyPDFLoader, pandas, Ollama
- **Frontend:** React, TypeScript, Tailwind CSS, Axios, React Router
- **LLM Inference:** Ollama (llama3.2, mxbai-embed-large)
- **Containerization:** Docker, Docker Compose

---

## License

MIT
