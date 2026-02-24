import os
import traceback
import uuid
import json
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
 
from llama_parse import LlamaParse
from langchain_core.documents import Document as LangchainDocument
from langchain.text_splitter import RecursiveCharacterTextSplitter
 
import time
 
# Agno framework components
from agno.models.nvidia import Nvidia
from agno.agent import Agent
from agno.run.response import RunEvent
from agno.tools.reasoning import ReasoningTools
from agno.tools.exa import ExaTools
 
# Core components and custom tools
from pinecone import Pinecone as PineconeClient, PodSpec
from langchain_nvidia_ai_endpoints import NVIDIAEmbeddings
from tools import get_pinecone_retriever_tool
 
import logging
logging.basicConfig(level=logging.INFO)
 
# Load environment variables
load_dotenv()
 
# --- Configuration & Initialization ---
# API Keys Validation
for key in ["NVIDIA_API_KEY", "LLAMA_CLOUD_API_KEY", "EXA_API_KEY", "PINECONE_API_KEY", "PINECONE_ENVIRONMENT", "PINECONE_INDEX_NAME"]:
    if not os.getenv(key):
        raise ValueError(f"{key} not found in .env file. Please add it.")
 
# Service Clients
pinecone_client = PineconeClient(api_key=os.getenv("PINECONE_API_KEY"))
embedder = NVIDIAEmbeddings(model="nvidia/nv-embed-v1")
 
# Constants
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME")
 
# --- FastAPI App ---
app = FastAPI(
    title="AI Research Assistant (Agno + NVIDIA/Pinecone/Exa)",
    description="A multi-file agent using Agno with Pinecone, Exa, and NVIDIA embeddings."
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)
 
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
 
@app.on_event("startup")
async def startup_event():
    """Ensures the Pinecone index exists on startup."""
    pinecone_env = os.getenv("PINECONE_ENVIRONMENT")
    print(f"Checking for Pinecone index: {PINECONE_INDEX_NAME}")
 
    # Get a list of index names from the index description objects
    existing_indexes = [index.name for index in pinecone_client.list_indexes()]
 
    if PINECONE_INDEX_NAME not in existing_indexes:
        print(f"Index does not exist. Creating new index: {PINECONE_INDEX_NAME}")
        pinecone_client.create_index(
            name=PINECONE_INDEX_NAME,
            dimension=4096,  # NVIDIA embedding dimension
            metric="cosine",
            spec=PodSpec(environment=pinecone_env)
        )
        print(f"Index '{PINECONE_INDEX_NAME}' created and is ready.")
    else:
        print(f"Index '{PINECONE_INDEX_NAME}' already exists. Proceeding.")
 
# --- API Endpoints ---
 
@app.post("/upload/")
async def upload_file(file: UploadFile = File(...)):
    """Uploads and processes a file, storing it in Pinecone under a new namespace."""
    try:
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
        parser = LlamaParse(api_key=os.getenv("LLAMA_CLOUD_API_KEY"))
 
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as f:
            f.write(await file.read())
       
        print(f"Parsing document: {file.filename}")
        parsed_docs = await parser.aload_data([file_path])
        langchain_docs = [LangchainDocument(page_content=doc.text, metadata=doc.metadata) for doc in parsed_docs]
        docs = text_splitter.split_documents(langchain_docs)
 
        if not docs:
            return JSONResponse(status_code=400, content={"error": "Could not extract text."})
 
        namespace = str(uuid.uuid4())
        print(f"Uploading {len(docs)} chunks to Pinecone namespace: {namespace}")
 
        index = pinecone_client.Index(PINECONE_INDEX_NAME)
        vectors_to_upsert = []
        for i, doc in enumerate(docs):
            vector = embedder.embed_query(doc.page_content)
            vectors_to_upsert.append({
                "id": f"vec-{i}",
                "values": vector,
                "metadata": {"text": doc.page_content}
            })
       
        for i in range(0, len(vectors_to_upsert), 100):
            batch = vectors_to_upsert[i:i+100]
            index.upsert(vectors=batch, namespace=namespace)
 
        return JSONResponse(content={"filename": file.filename, "namespace": namespace})
 
    except Exception as e:
        tb = traceback.format_exc()
        return JSONResponse(status_code=500, content={"error": str(e), "traceback": tb})
 
 
@app.post("/query/")
async def query(prompt: str = Form(...), namespace: str = Form(...)):
    """Queries the agent against a specific document namespace using a Plan-Execute-Report chain."""
    try:
        # 1. PLANNER AGENT: Creates a plan to answer the query.
        print("--- 1. Running Planner Agent ---")
        planner_agent = Agent(
            model=Nvidia(id="nvidia/llama-3.3-nemotron-super-49b-v1.5", api_key=os.getenv("NVIDIA_API_KEY")),
            instructions=[
                "You are a planning assistant. Your goal is to create a step-by-step plan to answer the user's query.",
                f"The user's query is: '{prompt}'.",
                "The available tools are a document search tool (`document_tool`) and a web search tool (`ExaTools`).",
                "Your plan should prioritize using the document search tool first. Only plan to use the web search tool if the document is unlikely to contain the answer.",
                "Respond with only the plan, nothing else."
            ]
        )
        plan = planner_agent.run(prompt).content
        print(f"Generated Plan: {plan}")
 
        # 2. EXECUTOR AGENT: Executes the plan using tools.
        print("--- 2. Running Executor Agent ---")
        document_tool = get_pinecone_retriever_tool(pinecone_client, embedder, PINECONE_INDEX_NAME, namespace)
        executor_agent = Agent(
            model=Nvidia(id="nvidia/llama-3.3-nemotron-super-49b-v1.5", api_key=os.getenv("NVIDIA_API_KEY")),
            tools=[
                ReasoningTools(add_instructions=True),
                document_tool,
                ExaTools(api_key=os.getenv("EXA_API_KEY"))
            ],
            instructions=[
                "You are an execution agent. Your job is to follow a plan and use tools to gather information.",
                f"The original user query is: '{prompt}'",
                f"The plan to follow is: '{plan}'",
                "Execute the plan and provide the raw output from the tools."
            ]
        )
        execution_results = executor_agent.run(prompt).content
        print(f"Execution Results: {execution_results}")
 
        # 3. REPORTER AGENT: Synthesizes the final report.
        print("--- 3. Running Reporter Agent ---")
        reporter_agent = Agent(
            model=Nvidia(id="nvidia/llama-3.3-nemotron-super-49b-v1.5", api_key=os.getenv("NVIDIA_API_KEY")),
            instructions=[
                "You are a reporting assistant.",
                f"Your task is to write a final, comprehensive report for the user based on their original query, the plan that was followed, and the information that was gathered.",
                f"Original Query: '{prompt}'",
                f"Plan: '{plan}'",
                f"Gathered Information: '{execution_results}'",
                "Synthesize all of this information into a clear and well-structured report. Cite your sources (document or web). If the gathered information is insufficient, state that clearly."
            ]
        )
        final_report = reporter_agent.run(prompt).content
 
        return JSONResponse(content={"report": final_report})
 
    except Exception as e:
        tb = traceback.format_exc()
        return JSONResponse(status_code=500, content={"error": str(e), "traceback": tb})


@app.options("/query-stream/")
async def query_stream_options():
    """Handle OPTIONS preflight request for streaming endpoint."""
    return JSONResponse(content={"status": "ok"})


@app.post("/query-stream/")
async def query_stream(prompt: str = Form(...), namespace: str = Form(...)):
    """Streams the query execution progress and agent responses token-by-token using Server-Sent Events."""

    async def event_generator():
        try:
            # Step 1: Planning - Send progress update
            yield f"data: {json.dumps({'type': 'progress', 'progress': 10, 'step': 'Analyzing uploaded document...', 'step_index': 0})}\n\n"

            print("--- 1. Running Planner Agent ---")
            planner_agent = Agent(
                model=Nvidia(id="nvidia/llama-3.3-nemotron-super-49b-v1.5", api_key=os.getenv("NVIDIA_API_KEY")),
                instructions=[
                    "You are a planning assistant. Your goal is to create a step-by-step plan to answer the user's query.",
                    f"The user's query is: '{prompt}'.",
                    "The available tools are a document search tool (`document_tool`) and a web search tool (`ExaTools`).",
                    "Your plan should prioritize using the document search tool first. Only plan to use the web search tool if the document is unlikely to contain the answer.",
                    "Respond with only the plan, nothing else."
                ]
            )

            # Stream planner agent response
            plan_parts = []
            stream = await planner_agent.arun(prompt, stream=True)
            async for chunk in stream:
                if hasattr(chunk, 'event') and chunk.event == RunEvent.run_response_content.value:
                    content = chunk.content if hasattr(chunk, 'content') else str(chunk)
                    if isinstance(content, dict) and 'text' in content:
                        content = content['text']
                    elif not isinstance(content, str):
                        content = str(content)
                    plan_parts.append(content)
                    # Stream the plan content to the frontend
                    yield f"data: {json.dumps({'type': 'agent_content', 'content': content, 'agent': 'planner'})}\n\n"

            plan = ''.join(plan_parts)
            print(f"Generated Plan: {plan}")

            # Step 2: Planning Complete
            yield f"data: {json.dumps({'type': 'progress', 'progress': 30, 'step': 'Creating execution plan...', 'step_index': 1})}\n\n"

            # Step 3: Execution - Send progress update
            yield f"data: {json.dumps({'type': 'progress', 'progress': 50, 'step': 'Searching document content...', 'step_index': 2})}\n\n"

            print("--- 2. Running Executor Agent ---")
            document_tool = get_pinecone_retriever_tool(pinecone_client, embedder, PINECONE_INDEX_NAME, namespace)
            executor_agent = Agent(
                model=Nvidia(id="nvidia/llama-3.3-nemotron-super-49b-v1.5", api_key=os.getenv("NVIDIA_API_KEY")),
                tools=[
                    ReasoningTools(add_instructions=True),
                    document_tool,
                    ExaTools(api_key=os.getenv("EXA_API_KEY"))
                ],
                debug_mode=True,
                instructions=[
                    "You are an execution agent. Your job is to follow a plan and use tools to gather information.",
                    f"The original user query is: '{prompt}'",
                    f"The plan to follow is: '{plan}'",
                    "Execute the plan and provide the raw output from the tools."
                ]
            )

            # Stream executor agent response
            execution_parts = []
            stream = await executor_agent.arun(prompt, stream=True)
            async for chunk in stream:
                if hasattr(chunk, 'event') and chunk.event == RunEvent.run_response_content.value:
                    content = chunk.content if hasattr(chunk, 'content') else str(chunk)
                    if isinstance(content, dict) and 'text' in content:
                        content = content['text']
                    elif not isinstance(content, str):
                        content = str(content)
                    execution_parts.append(content)
                    # Stream the execution content to the frontend
                    yield f"data: {json.dumps({'type': 'agent_content', 'content': content, 'agent': 'executor'})}\n\n"

            execution_results = ''.join(execution_parts)
            print(f"Execution Results: {execution_results}")

            # Step 4: Web Search
            yield f"data: {json.dumps({'type': 'progress', 'progress': 70, 'step': 'Gathering web information...', 'step_index': 3})}\n\n"

            # Step 5: Reporting - Send progress update
            yield f"data: {json.dumps({'type': 'progress', 'progress': 85, 'step': 'Synthesizing comprehensive report...', 'step_index': 4})}\n\n"

            print("--- 3. Running Reporter Agent ---")
            reporter_agent = Agent(
                model=Nvidia(id="nvidia/llama-3.3-nemotron-super-49b-v1.5", api_key=os.getenv("NVIDIA_API_KEY")),
                instructions=[
                    "You are a reporting assistant.",
                    f"Your task is to write a final, comprehensive report for the user based on their original query, the plan that was followed, and the information that was gathered.",
                    f"Original Query: '{prompt}'",
                    f"Plan: '{plan}'",
                    f"Gathered Information: '{execution_results}'",
                    "Synthesize all of this information into a clear and well-structured report. Cite your sources (document or web). If the gathered information is insufficient, state that clearly."
                ]
            )

            # Stream reporter agent response (this is the final report)
            report_parts = []
            stream = await reporter_agent.arun(prompt, stream=True)
            async for chunk in stream:
                if hasattr(chunk, 'event') and chunk.event == RunEvent.run_response_content.value:
                    content = chunk.content if hasattr(chunk, 'content') else str(chunk)
                    if isinstance(content, dict) and 'text' in content:
                        content = content['text']
                    elif not isinstance(content, str):
                        content = str(content)
                    report_parts.append(content)
                    # Stream the report content to the frontend
                    yield f"data: {json.dumps({'type': 'report_delta', 'content': content})}\n\n"

            final_report = ''.join(report_parts)

            # Final: Complete
            yield f"data: {json.dumps({'type': 'complete', 'progress': 100, 'report': final_report})}\n\n"

        except Exception as e:
            tb = traceback.format_exc()
            print(f"Error in streaming query: {e}\n{tb}")
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


if __name__ == "__main__":
    import uvicorn
    print("Starting API server at http://0.0.0.0:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
 