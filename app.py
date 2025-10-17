from typing import Annotated
from uuid import uuid4
import os
import shutil
import pandas as pd
import json

from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from typing_extensions import TypedDict
from langchain_ollama import ChatOllama, OllamaEmbeddings
from langchain_core.messages import HumanMessage, AIMessage
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.chains import create_retrieval_chain
from langchain_community.retrievers import BM25Retriever
from langchain.retrievers import EnsembleRetriever
from sklearn.feature_extraction.text import TfidfVectorizer

from fastapi import FastAPI, UploadFile, File, Form, status
from fastapi.middleware.cors import CORSMiddleware

data_folder = "./data"
os.makedirs(data_folder, exist_ok=True)
chunk_size = 1000
chunk_overlap = 50

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class State(TypedDict):
    messages: Annotated[list, add_messages]
    file_type: str | None
    next: str | None


state = {"messages": [], "file_type": None, "next": None}

llm = ChatOllama(model="llama3.2", temperature=0, base_url="http://ollama:11434")
embeddings = OllamaEmbeddings(model="mxbai-embed-large", base_url="http://ollama:11434")

vector_space = Chroma(
    collection_name="documents",
    embedding_function=embeddings,
)

all_documents = []


def router(state: State):
    if state.get("file_type") == "pdf":
        return {"next": "pdf_RAG"}
    return {"next": "csv_RAG"}


def pdf_RAG(state: State):
    global all_documents
    query = state["messages"][-1].content

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "You are a helpful assistant. Answer the question based only on the provided context.",
            ),
            ("human", "Question: {input}\nContext: {context}"),
        ]
    )

    dense_retriever = vector_space.as_retriever(search_kwargs={"k": 10})
    bm25_retriever = BM25Retriever.from_documents(all_documents)
    bm25_retriever.k = 10

    ensemble_retriever = EnsembleRetriever(
        retrievers=[dense_retriever, bm25_retriever], weights=[0.5, 0.5]
    )

    combine_docs_chain = create_stuff_documents_chain(llm, prompt)
    retrieval_chain = create_retrieval_chain(ensemble_retriever, combine_docs_chain)
    # Logging for hybrid RAG testing
    print("[PDF RAG] Query:", query)
    dense_docs = dense_retriever.get_relevant_documents(query)
    bm25_docs = bm25_retriever.get_relevant_documents(query)
    print(
        "[PDF RAG] Dense top doc:",
        dense_docs[0].page_content[:200] if dense_docs else "None",
    )
    print(
        "[PDF RAG] BM25 top doc:",
        bm25_docs[0].page_content[:200] if bm25_docs else "None",
    )
    result = retrieval_chain.invoke({"input": query})
    print("[PDF RAG] Final answer:", result["answer"])
    return {"messages": [AIMessage(content=result["answer"])]}


def csv_RAG(state: State):
    query = state["messages"][-1].content
    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "You are a helpful assistant. Answer the question based only on the provided context.",
            ),
            ("human", "Question: {input}\nContext: {context}"),
        ]
    )

    dense_retriever = vector_space.as_retriever(search_kwargs={"k": 10})
    bm25_retriever = BM25Retriever.from_documents(all_documents)
    bm25_retriever.k = 10

    ensemble_retriever = EnsembleRetriever(
        retrievers=[dense_retriever, bm25_retriever], weights=[0.5, 0.5]
    )
    combine_docs_chain = create_stuff_documents_chain(llm, prompt)
    retrieval_chain = create_retrieval_chain(ensemble_retriever, combine_docs_chain)
    # Logging for hybrid RAG testing
    print("[CSV RAG] Query:", query)
    dense_docs = dense_retriever.get_relevant_documents(query)
    bm25_docs = bm25_retriever.get_relevant_documents(query)
    print(
        "[CSV RAG] Dense top doc:",
        dense_docs[0].page_content[:200] if dense_docs else "None",
    )
    print(
        "[CSV RAG] BM25 top doc:",
        bm25_docs[0].page_content[:200] if bm25_docs else "None",
    )
    context = ensemble_retriever.invoke(query)
    result = retrieval_chain.invoke({"input": query, "context": context})
    print("[CSV RAG] Final answer:", result["answer"])
    return {"messages": [AIMessage(content=result["answer"])]}


graph_builder = StateGraph(State)
graph_builder.add_node("router", router)
graph_builder.add_node("pdf_RAG", pdf_RAG)
graph_builder.add_node("csv_RAG", csv_RAG)
graph_builder.add_edge(START, "router")
graph_builder.add_conditional_edges(
    "router",
    lambda state: state.get("next"),
    {"pdf_RAG": "pdf_RAG", "csv_RAG": "csv_RAG"},
)
graph_builder.add_edge("pdf_RAG", END)
graph_builder.add_edge("csv_RAG", END)
graph = graph_builder.compile()


@app.post("/upload-file", status_code=status.HTTP_201_CREATED)
async def upload_file(files: list[UploadFile] = File(...)):
    os.makedirs(data_folder, exist_ok=True)
    for filename in os.listdir(data_folder):
        file_path = os.path.join(data_folder, filename)
        os.remove(file_path)

    # db_folder = "./db"
    # if(os.path.exists( db_folder)):
    #     shutil.rmtree(db_folder)

    for file in files:
        file_location = os.path.join(data_folder, file.filename)
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

    uploaded_csvs = []

    for filename in os.listdir(data_folder):
        path = os.path.join(data_folder, filename)
        if filename.endswith(".csv"):
            df = pd.read_csv(path)
            columns = df.columns.tolist()
            uploaded_csvs.append(
                {
                    "filename": filename,
                    "columns": columns,
                }
            )

    if uploaded_csvs:
        return {
            "message": "Files saved",
            "csv_files": uploaded_csvs,
        }

    return {
        "message": "Files saved",
    }


parsed_columns = []
parsed_page_content = []
parsed_metadata = []

# Store per-CSV column selection
parsed_csv_column_map = {}


@app.post("/set-columns", status_code=status.HTTP_200_OK)
async def set_columns(csv_column_map: str = Form(...)):
    global parsed_csv_column_map
    # csv_column_map: { filename: {"content": [...], "metadata": [...]}, ... }
    parsed_csv_column_map = json.loads(csv_column_map)


@app.post("/create-vector-database", status_code=status.HTTP_201_CREATED)
async def create_vector_database():
    global state, vector_space, all_documents, parsed_csv_column_map
    all_documents = []

    vector_space = Chroma(
        collection_name="documents",
        embedding_function=embeddings,
    )

    for filename in os.listdir(data_folder):
        path = os.path.join(data_folder, filename)
        if filename.endswith(".pdf"):
            loader = PyPDFLoader(path)
            docs = loader.load()
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=chunk_size, chunk_overlap=chunk_overlap
            )
            documents = text_splitter.split_documents(docs)
            ids = [str(uuid4()) for _ in range(len(documents))]

            texts = [doc.page_content for doc in documents]
            vectorizer = TfidfVectorizer()
            sparse_matrix = vectorizer.fit_transform(texts)
            sparse_vectors = [vec.toarray().flatten().tolist() for vec in sparse_matrix]

            vector_space.add_documents(
                documents=documents, ids=ids, sparse_vectors=sparse_vectors
            )
            all_documents.extend(documents)
            state["file_type"] = "pdf"

        elif filename.endswith(".csv"):
            df = pd.read_csv(path)
            documents = []
            ids = []
            # Use per-CSV column selection if available
            colmap = parsed_csv_column_map.get(filename, {})
            content_cols = colmap.get("content", list(df.columns))
            metadata_cols = colmap.get(
                "metadata", [col for col in df.columns if col not in content_cols]
            )
            for i, row in df.iterrows():
                content_parts = [str(row[col]) for col in content_cols]
                page_content = " ".join(content_parts).strip()
                metadata = {col: row[col] for col in metadata_cols}
                document = Document(
                    page_content=page_content, metadata=metadata, id=str(i)
                )
                documents.append(document)
                ids.append(str(i))
            texts = [doc.page_content for doc in documents]
            vectorizer = TfidfVectorizer()
            sparse_matrix = vectorizer.fit_transform(texts)
            sparse_vectors = [vec.toarray().flatten().tolist() for vec in sparse_matrix]
            all_documents.extend(documents)
            vector_space.add_documents(
                documents=documents, ids=ids, sparse_vectors=sparse_vectors
            )
            state["file_type"] = "csv"
    return {"message": "Vector database created"}


@app.post("/query", status_code=status.HTTP_200_OK)
async def query(query: str = Form(...)):
    global state
    state = graph.invoke(
        {
            "messages": [HumanMessage(content=query)],
            "file_type": state.get("file_type"),
            "next": None,
        }
    )
    return {"message": state["messages"][-1].content}
