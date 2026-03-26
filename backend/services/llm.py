import json
from langchain_community.llms import Ollama
from langchain_core.prompts import PromptTemplate

# Initialize Ollama LLM
llm = Ollama(model="qwen2.5-coder")

prompt_template = PromptTemplate(
    input_variables=["context", "query"],
    template="""You are an expert AI coding assistant analyzing a user's local codebase.
You have been provided with some semantic code snippets retrieved from the user's uploaded project.

Retrieved Code Context:
{context}

Question:
{query}

Instructions:
1. Answer the user's question based on the provided Code Context.
2. If the user asks for a general overview (e.g., "tell me about this project"), analyze the provided Context to explain what the project seems to be built for. Make an educated guess! Do NOT refuse to answer just because you don't have the entire codebase.
3. If the context is empty, simply tell the user to upload a project or mention you don't have code context for that specific query.
4. When proposing code modifications, generate clear code blocks.

Answer:"""
)

def stream_llm_response(query: str, retrieved_docs: list):
    try:
        # Format the context
        context_str = ""
        for idx, doc in enumerate(retrieved_docs):
            meta = doc["metadata"]
            context_str += f"--- File: {meta['filepath']} (Lines: {meta['start_line']}-{meta['end_line']}) ---\n"
            context_str += f"{doc['content']}\n\n"

        final_prompt = prompt_template.format(context=context_str, query=query)
        
        # Stream the response
        for chunk in llm.stream(final_prompt):
            yield chunk
    except Exception as e:
        yield f"\n\n**Error communicating with local AI:** {str(e)}\n\nPlease ensure Ollama is running and the model `{llm.model}` is installed (run `ollama pull {llm.model}`)."
