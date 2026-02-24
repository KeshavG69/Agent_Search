from agno.agent import Agent

def get_pinecone_retriever_tool(pinecone_client, embedder, index_name: str, namespace: str):
    """Creates a document retrieval tool for a specific Pinecone namespace."""
    def retrieve_from_pinecone(query: str, agent: Agent, **kwargs):
        print(f"Searching Pinecone (namespace: {namespace}) for: '{query[:60]}...'")
        try:
            index = pinecone_client.Index(index_name)
            query_vector = embedder.embed_query(query)
            results = index.query(
                namespace=namespace,
                vector=query_vector,
                top_k=5,
                include_metadata=True
            )
            context = "\n".join([match.metadata.get('text', '') for match in results.matches])
            if not context:
                return "No information found in the document for this query."
            return f"Information from the document:\n{context}"
        except Exception as e:
            return f"Error retrieving from document: {e}"
    
    retrieve_from_pinecone.__doc__ = "Searches for information in the user-provided document."
    return retrieve_from_pinecone
