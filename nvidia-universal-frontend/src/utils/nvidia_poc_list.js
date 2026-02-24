const pocData = [
  {
    id: 'poc-001',
    title: 'Deepfake Detection System',
    description:
      'Robust deepfake detection service using Hive Deepfake Detection Model via NVIDIA API. Features FastAPI backend with secure image processing, facial analysis for digital alteration detection, confidence scoring, and bounding box coordinates. Supports PNG, JPEG, and JPG formats with stateless secure asset handling.',
    category: 'Computer Vision',
    status: 'Active',
    models: ['Hive Deepfake Detection', 'EfficientNet-B4', 'YOLOv8'],
    owner: 'AI Security Team',
    lastUpdated: 'Sept 24 , 2025',
    demoUrl: '/demo/deepfake',
    route_to: '/deep-fake'
  },
  {
    id: 'poc-002',
    title: 'Protein Structure Prediction',
    description:
      'AI-powered bioinformatics model predicting 3D protein structures from amino acid sequences using deep neural networks inspired by AlphaFold.',
    category: 'Bioinformatics',
    status: 'Active',
    models: ['AlphaFold2', 'BioNeMo'],
    owner: 'Computational Biology Team',
    lastUpdated: 'Oct 3, 2025',
    demoUrl: '/demo/protein-structure',
    route_to: '/protien-structure'
  },
  {
    id: 'poc-003',
    title: 'Research Knowledge Agent',
    description:
      'FastAPI-based AI Research Assistant using Agno framework with multi-agent workflow. Features Plan/Execute/Report architecture with specialized agents (Planner, Executor, Reporter). Leverages uploaded documents via Pinecone vector storage, real-time web search via Exa, and document parsing via LlamaParse. Uses NVIDIA models for agent intelligence.',
    category: 'LLM',
    status: 'Active',
    models: ['NVIDIA NIM', 'LlamaParse', 'Pinecone', 'Exa'],
    owner: 'Research AI Team',
    lastUpdated: 'Oct 7, 2025',
    demoUrl: '/demo/research-agent',
    route_to: '/research-knowledge-agent'
  },
  {
    id: 'poc-004',
    title: 'Nvidia AI Blog Creator',
    description:
      'FastAPI-powered blog generation system using Agno framework multi-agent architecture. Features specialized agents (Outliner, Researcher, Writer, Critic) for comprehensive blog creation. Implements RAG pipeline with Pinecone vector storage, LlamaParse document parsing, and NVIDIA NIM models for content generation.',
    category: 'Generative AI',
    status: 'Active',
    models: ['NVIDIA NIM', 'LlamaParse', 'Pinecone', 'Agno', 'Nvidia Embeddings'],
    owner: 'Content AI Team',
    lastUpdated: 'Oct 13, 2024',
    demoUrl: '/demo/blog-creator',
    route_to: '/ai-blog-creator'
  },
  {
    id: 'poc-005',
    title: 'Virtual AI Assistant',
    description:
      'Comprehensive AI assistant platform with React frontend and FastAPI backend. Features admin panel for management, chat interface for user interaction, and landing page for user onboarding. Includes schema analysis, traditional tool integration, and multi-agent orchestration capabilities for scheduling, reminders, and email management.',
    category: 'LLM + Automation',
    status: 'Active',
    models: ['NVIDIA NIM', 'LlamaParse', 'Multi-Agent Framework', 'PineCone'],
    owner: 'Automation AI Team',
    lastUpdated: 'Oct 24, 2024',
    demoUrl: '/demo/virtual-assistant',
    route_to: '/ai-virtual-assistant'
  },
  {
    id: 'poc-006',
    title: 'Agentic RAG with voice-based output',
    description:
      'Document Q&A system with voice output using Agentic RAG architecture. Features document ingestion from URLs/files via LlamaParse, Pinecone vector storage with NVIDIA embeddings, Agno framework with NVIDIA Qwen 3 for question answering, and ElevenLabs TTS for audio responses. Provides both text and voice answers to user queries about ingested documents.',
    category: 'LLM + RAG',
    status: 'Active',
    models: ['NVIDIA Qwen 3', 'Agno Framework', 'ElevenLabs TTS', 'LlamaParse', 'Pinecone'],
    owner: 'Content AI Team',
    lastUpdated: 'Nov 3, 2024',
    demoUrl: '/demo/pdf-to-podcast',
    route_to: '/ai-pdf-to-podcast'
  },
  {
    id: 'poc-007',
    title: 'PDF To Podcast',
    description:
      'FastAPI-powered podcast generation service using microservice architecture. Features dedicated docling_service for PDF to Markdown conversion, 9-step multi-agent workflow via Agno framework, and text-to-speech via OpenAI TTS. Supports both monologue and two-person dialogue podcasts with audio streaming capabilities.',
    category: 'LLM + Audio Generation',
    status: 'Active',
    models: ['NVIDIA NIM', 'Agno', 'OpenAI TTS', 'Docling Service'],
    owner: 'Content AI Team',
    lastUpdated: 'Nov 12, 2025',
    demoUrl: '/demo/ai-podcast-generator',
    route_to: '/podcastgenerator'
  }

];

export default pocData;
