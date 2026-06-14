import os

from dotenv import load_dotenv
from openai import OpenAI

# load deepseek auth data
load_dotenv()

API_KEY = os.getenv("API_KEY")
APP_ID = os.getenv("APP_ID")

client = OpenAI(
    api_key=API_KEY, 
    base_url="https://qianfan.baidubce.com/v2",
    default_headers={ "appid": APP_ID }
)

stream = client.chat.completions.create(
    model="qwen3.5-397b-a17b",
    messages=[
        {'role': 'system', 'content': 'You are a helpful assistant.'},
        {'role': 'user', 'content': 'Where is the capital of China?'}
    ],
    stream=True
)

for chunk in stream:
    if chunk.choices[0].delta.content is not None:
        print(chunk.choices[0].delta.content, end="")
