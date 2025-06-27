from typing import Annotated
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
from uuid import uuid4
import os, shutil, pandas as pd
import time

from fastapi import FastAPI, UploadFile, File, Form, status
from fastapi.middleware.cors import CORSMiddleware

data_folder = "./data"
chunk_size = 1000
chunk_overlap = 50

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class State(TypedDict):
    messages: Annotated[list, add_messages]
    file_type: str | None
    next: str | None

state = {"messages":[],"file_type":None,"next":None}

llm = ChatOllama(model="llama3.2", temperature=0)
embeddings = OllamaEmbeddings(model="mxbai-embed-large")

vector_space = Chroma(
    collection_name="documents",
    embedding_function=embeddings,
    persist_directory="./db/chroma_langchain_db"
)

def router(state:State):
    if state.get("file_type")=="pdf":
        return{"next":"pdf_RAG"}
    return{"next":"csv_RAG"}


def pdf_RAG(state: State):
    query = state["messages"][-1].content

    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a helpful assistant. Answer the question based only on the provided context."),
        ("human", "Question: {input}\nContext: {context}")
    ])

    retriever = vector_space.as_retriever(search_kwargs={"k": 10})
    combine_docs_chain = create_stuff_documents_chain(llm, prompt)
    retrieval_chain = create_retrieval_chain(retriever, combine_docs_chain)
    result = retrieval_chain.invoke({"input": query})

    return {"messages": [AIMessage(content=result["answer"])]}

def csv_RAG(state:State):
    query = state["messages"][-1].content
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a helpful assistant. Answer the question based only on the provided context."),
        ("human", "Question: {input}\nContext: {context}")
    ])

    retriever = vector_space.as_retriever(search_kwargs={"k": 10})
    combine_docs_chain = create_stuff_documents_chain(llm, prompt)
    retrieval_chain = create_retrieval_chain(retriever, combine_docs_chain)
    context = retriever.invoke(query)
    result = retrieval_chain.invoke({"input": query,"context":context})
    return {"messages": [AIMessage(content=result["answer"])]}

graph_builder = StateGraph(State)
graph_builder.add_node("router", router)
graph_builder.add_node("pdf_RAG", pdf_RAG)
graph_builder.add_node("csv_RAG", csv_RAG)
graph_builder.add_edge(START, "router")
graph_builder.add_conditional_edges(
    "router",
    lambda state: state.get("next"),
    { "pdf_RAG": "pdf_RAG","csv_RAG": "csv_RAG"}
)
graph_builder.add_edge("pdf_RAG", END)
graph_builder.add_edge("csv_RAG", END)
graph = graph_builder.compile()

@app.post("/upload-file", status_code=status.HTTP_201_CREATED)
async def upload_file(file: UploadFile = File(...)):

    # if(os.path.exists(data_folder)):
    #     for filename in os.listdir(data_folder):
    #         file_path = os.path.join(data_folder,filename)
    #         os.remove(file_path)

    # db_folder = "./db"
    # if(os.path.exists( db_folder)):
    #     shutil.rmtree(db_folder)

    file_location = os.path.join(data_folder, file.filename)
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"message": "File saved", "filename": file.filename, "filetype": file.content_type}

@app.post("/create-vector-database", status_code=status.HTTP_201_CREATED)
async def create_vector_database():
    global state
    global vector_space

    vector_space = Chroma(
    collection_name="documents",
    embedding_function=embeddings,
    persist_directory="./db/chroma_langchain_db"
)

    for filename in os.listdir(data_folder):
        path = os.path.join(data_folder, filename)
        if filename.endswith(".pdf"):
            loader = PyPDFLoader(path)
            docs = loader.load()
            text_splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
            documents = text_splitter.split_documents(docs)
            ids = [str(uuid4()) for _ in range(len(documents))]
            vector_space.add_documents(documents=documents, ids=ids)
            state["file_type"]="pdf"
        elif filename.endswith(".csv"):
            df = pd.read_csv(path)
            documents = []
            ids = []
            for i, row in df.iterrows():
                document = Document(
                page_content=row["Title"] + " " + row["Review"],
                metadata={"rating": row["Rating"], "date": row["Date"]},
                id=str(i)
            )
                documents.append(document)
                ids.append(str(i))
            vector_space.add_documents(documents=documents, ids=ids)
            state["file_type"]="csv"
    return {"message": "Vector database created"}

@app.post("/query", status_code=status.HTTP_200_OK)
async def query(query: str = Form(...)):
    global state
    state = graph.invoke({"messages": [HumanMessage(content=query)],"file_type":state.get("file_type"),"next":None})
    return {"message": state["messages"][-1].content}