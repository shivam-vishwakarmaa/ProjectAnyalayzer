import json
from langchain_community.llms import Ollama
from langchain_core.prompts import PromptTemplate

# Initialize Ollama LLM
# The user specified qwen3.5-coder
llm = Ollama(model="qwen3.5-coder")

prompt_template = PromptTemplate(
    input_variables=["context", "query"],
    template="""You are an expert AI coding assistant.
Use the following retrieved code chunks to answer the user's question clearly and concisely.
If the answer is not in the context, say you don't know based on the provided context, but try your best.
When proposing modifications, generate clear unified diffs or instructions.

Context:
{context}

Question:
{query}

Answer:"""
)

def stream_llm_response(query: str, retrieved_docs: list):
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
