import requests

BASE_URL = "http://127.0.0.1:5001"

def test_endpoints():
    print("Testing Voyage application endpoints...")
    
    # 1. Health check
    try:
        health_url = f"{BASE_URL}/api/health"
        print(f"GET {health_url}")
        r = requests.get(health_url)
        print("Status Code:", r.status_code)
        print("Response:", r.json())
    except Exception as e:
        print("Error during health check:", e)
        return

    # 2. Chat test
    try:
        chat_url = f"{BASE_URL}/api/chat"
        print(f"\nPOST {chat_url}")
        payload = {
            "message": "suggest a 2-day itinerary for Paris",
            "history": []
        }
        r = requests.post(chat_url, json=payload)
        print("Status Code:", r.status_code)
        if r.status_code == 200:
            reply = r.json().get("reply", "")
            print("\nAI Response Preview:")
            print("-" * 40)
            print(reply[:500] + "\n...")
            print("-" * 40)
        else:
            print("Response:", r.text)
    except Exception as e:
        print("Error during chat test:", e)

if __name__ == "__main__":
    test_endpoints()
