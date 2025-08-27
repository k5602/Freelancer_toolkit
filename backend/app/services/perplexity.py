import os
import asyncio
import perplexipy
from dotenv import load_dotenv

load_dotenv()

PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY")

async def get_completion(prompt: str) -> str:
    """
    Get completion from Perplexity AI.
    """
    if not PERPLEXITY_API_KEY:
        return "Perplexity API key not found. Please set the PERPLEXITY_API_KEY environment variable."

    async with Perplexity(api_key=PERPLEXITY_API_KEY) as perplexity:
        answer = await perplexity.search(prompt=prompt)

        # The answer is a list of dictionaries. I need to format it into a string.
        # I will concatenate the 'answer' field of each dictionary in the list.
        return " ".join([a['answer'] for a in answer])
