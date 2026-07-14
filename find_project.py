import requests
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("IBM_API_KEY")

if not api_key:
    print("Error: IBM_API_KEY is not set in .env file.")
    exit(1)

# 1. Get IAM token
print("Requesting IAM token from IBM Cloud...")
resp = requests.post(
    "https://iam.cloud.ibm.com/identity/token",
    headers={"Content-Type": "application/x-www-form-urlencoded"},
    data={
        "grant_type": "urn:ibm:params:oauth:grant-type:apikey",
        "apikey": api_key,
    },
)
token = resp.json().get("access_token")
if not token:
    print("Failed to get token:", resp.text)
    exit(1)

# 2. List projects
print("IAM token acquired. Listing Watsonx projects...")
url = "https://api.dataplatform.cloud.ibm.com/v2/projects"
headers = {
    "Authorization": f"Bearer {token}",
    "Accept": "application/json"
}
resp2 = requests.get(url, headers=headers)
if resp2.status_code == 200:
    projects = resp2.json().get("resources", [])
    if projects:
        print("Found Projects:")
        for p in projects:
            print(f"- Name: {p['entity']['name']}, ID: {p['metadata']['guid']}")
    else:
        print("No Watsonx/Dataplatform projects found for this account.")
else:
    print("Failed to list projects:", resp2.text)
