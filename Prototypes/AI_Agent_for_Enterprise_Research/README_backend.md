# AI Research Assistant API (Agno)

This project provides a FastAPI-based AI Research Assistant that answers user prompts by leveraging both uploaded documents and real-time web search. It features a multi-agent architecture that simulates a "Plan / Execute / Report" workflow using the Agno framework.

## Features

*   **AI-Powered Research:** Answers questions using a combination of private documents and web search.
*   **Multi-Agent Workflow:** Utilizes a chain of `agno.Agent` instances to first create a plan, then execute it with tools, and finally synthesize a report.
*   **Modular Architecture:** Code is organized into `main.py` for the API and core logic, and `tools.py` for tool definitions.
*   **Cloud-based Vector Store:** Uses Pinecone for document indexing, with a unique namespace created for each uploaded document to ensure data isolation.
*   **Modern Tech Stack:** Integrates LlamaParse for document parsing, NVIDIA for both the agent models and embeddings, and Exa for web search.

## Architecture

The project is structured into the following modules:

*   `main.py`: The main FastAPI application entry point. It handles the `/upload` and `/query` endpoints and orchestrates the multi-agent workflow.
*   `tools.py`: Defines helper functions that create the custom tools used by the Executor agent, including the Pinecone document retriever and the Exa web search tool.

The workflow for a query is as follows:
1.  A **Planner Agent** receives the user prompt and creates a step-by-step plan.
2.  An **Executor Agent** receives the plan and the prompt, and uses the available tools (document search, web search) to gather the necessary information.
3.  A **Reporter Agent** receives the original prompt, the plan, and the execution results, and synthesizes them into a final, comprehensive report.

## Setup

### Prerequisites

*   Python 3.9+
*   An environment with your API keys (see below).

### Installation

1.  **Install Python dependencies:**
    ```bash
    pip install fastapi uvicorn python-dotenv "agno[nvidia]" langchain-nvidia-ai-endpoints llama-parse pinecone
    ```

### Environment Variables

Create a `.env` file in the project's root directory (`C:\Users\Shreya Sharma\Desktop\3d`) and populate it with your API keys:

```dotenv
# NVIDIA API Key for the agent model and embeddings
NVIDIA_API_KEY="your_nvidia_api_key"

# LlamaParse API Key for document parsing
LLAMA_CLOUD_API_KEY="your_llama_cloud_api_key"

# Exa API Key for web search
EXA_API_KEY="your_exa_api_key"

# Pinecone credentials for vector storage
PINECONE_API_KEY="your_pinecone_api_key"
PINECONE_ENVIRONMENT="your_pinecone_environment_name" # e.g., us-west1-gcp
PINECONE_INDEX_NAME="ai-research"
```

## Usage

### Running the Application

To run the FastAPI application, navigate to the `Ai_Agents` directory in your terminal and execute:

```bash
uvicorn main:app --reload
```

### Interacting with the API

Once the server is running (usually at `http://127.0.0.1:8000`):

1.  **Access the API Documentation:** Open your web browser and go to `http://127.0.0.1:8000/docs`.

2.  **Step 1: Upload a Document**
    *   Use the `/upload/` endpoint.
    *   Upload a file (e.g., a PDF).
    *   The API will process the file and return a unique `namespace` for it. Copy this value.

3.  **Step 2: Ask a Question**
    *   Use the `/query/` endpoint.
    *   Provide a `prompt` (your research question).
    *   Paste the `namespace` you received from the upload step.
    *   The multi-agent system will generate and return a report.
