import os
import json
import urllib.request
import urllib.error

def generate_topics():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY environment variable not found.")
        exit(1)

    # Load existing blogs for cannibalization check
    try:
        with open('blog_index.json', 'r', encoding='utf-8') as f:
            blogs = json.load(f)
            existing_slugs = [blog.get('slug') for blog in blogs]
            existing_titles = [blog.get('title') for blog in blogs]
    except FileNotFoundError:
        existing_slugs, existing_titles = [], []
        
    # Read the engine skill prompt
    try:
        with open('scripts/vcard-topic-engine.md', 'r', encoding='utf-8') as f:
            engine_prompt = f.read()
    except FileNotFoundError:
        print("Error: scripts/vcard-topic-engine.md not found.")
        exit(1)

    system_instruction = f"""
    You are the vCard SEO Topic Engine. You must follow the rules defined in the prompt below exactly to find keyword gaps and create a growth schedule.
    
    PROMPT:
    {engine_prompt}
    
    CONTEXT:
    The following topics already exist on the site (DO NOT CANNIBALIZE THESE):
    Slugs: {existing_slugs}
    Titles: {existing_titles[:25]}... 
    
    YOUR TASK:
    Generate exactly 10 new, highly profitable, non-cannibalizing topics based on the clusters defined in your instructions. 
    Output the 10 topics ONLY as a markdown table using the exact format requested. 
    Do not include any intro, outro, or wrapper text. Just the table rows. Do NOT include Markdown code fences like ```markdown. Start immediately with the table header.
    """

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    
    data = {
        "contents": [{
            "parts": [{"text": system_instruction}]
        }],
        "systemInstruction": {
            "parts": [{"text": "You are an automated topic generation engine. Output ONLY raw markdown table rows, without code blocks or introductory text."}]
        },
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 8192
        }
    }
    
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json'})
    
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            text_output = result['candidates'][0]['content']['parts'][0]['text']
            
            # Clean up potential markdown blocks if the LLM adds them despite instructions
            text_output = text_output.replace("```markdown", "").replace("```", "").strip()
            
            # Remove the header if it generated one, since our schedule file already has a header
            lines = text_output.split('\n')
            if len(lines) > 2 and '|' in lines[0] and '---' in lines[1]:
                lines = lines[2:] # skip header and separator
            clean_table = '\n'.join(lines)
            
            print("Successfully generated topics from Gemini API.")
            
            # Append to schedule
            with open('data/vcard-growth-schedule.md', 'a', encoding='utf-8') as f:
                f.write(clean_table + "\n")
                
            print("Topics successfully appended to data/vcard-growth-schedule.md")
    
    except urllib.error.HTTPError as e:
        print(f"HTTP Error: {e.code} - {e.read().decode('utf-8')}")
        exit(1)
    except Exception as e:
        print(f"Error: {str(e)}")
        exit(1)

if __name__ == "__main__":
    generate_topics()
