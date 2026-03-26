import logging
from tree_sitter_languages import get_language, get_parser

logger = logging.getLogger(__name__)

def get_language_for_file(filename: str):
    ext = filename.split('.')[-1].lower()
    mapping = {
        'py': 'python',
        'js': 'javascript',
        'jsx': 'javascript',
        'ts': 'typescript',
        'tsx': 'tsx',
        'go': 'go',
        'java': 'java',
        'cpp': 'cpp',
        'c': 'c',
        'cs': 'c_sharp',
        'rs': 'rust'
    }
    return mapping.get(ext)

def parse_code_chunks(code: str, language_name: str, filepath: str):
    try:
        language = get_language(language_name)
        parser = get_parser(language_name)
    except Exception as e:
        logger.error(f"Failed to load language '{language_name}': {e}")
        return []

    tree = parser.parse(bytes(code, "utf8"))
    chunks = []
    
    def traverse(node):
        # Match function/class/method declarations across different languages
        node_type = node.type.lower()
        if "function" in node_type or "class" in node_type or "method" in node_type or node_type == "declaration":
            start_line = node.start_point[0] + 1
            end_line = node.end_point[0] + 1
            
            # Extract name heuristically
            name = "unknown"
            for child in node.children:
                if child.type == "identifier" or child.type == "name":
                    name = child.text.decode("utf8")
                    break

            # Avoid adding entire massive classes if we only want methods, but here we add both
            chunks.append({
                "filepath": filepath,
                "name": name,
                "type": node.type,
                "start_line": start_line,
                "end_line": end_line,
                "content": code[node.start_byte:node.end_byte]
            })
        for child in node.children:
            traverse(child)

    traverse(tree.root_node)
    
    # Fallback to whole file if no structural blocks found
    if not chunks and code.strip():
        chunks.append({
            "filepath": filepath,
            "name": "module",
            "type": "module",
            "start_line": 1,
            "end_line": len(code.splitlines()),
            "content": code
        })

    return chunks
