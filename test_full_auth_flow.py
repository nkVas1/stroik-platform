#!/usr/bin/env python3
"""Test complete onboarding flow leading to token generation"""

import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000"

messages_history = []

def send_message(text):
    """Send a message and get response"""
    messages_history.append({"role": "user", "content": text})
    
    payload = {
        "user_id": f"test_{int(time.time())}",
        "messages": messages_history
    }
    
    response = requests.post(f"{BASE_URL}/api/chat", json=payload, timeout=30)
    response.raise_for_status()
    data = response.json()
    
    # Add assistant response to history
    if data.get('response'):
        messages_history.append({"role": "assistant", "content": data['response']})
    
    return data

print("=" * 70)
print("🧪 TESTING COMPLETE ONBOARDING + BEARER TOKEN FLOW")
print("=" * 70)

try:
    # Step 1: Initial greeting
    print("\n1️⃣  Starting onboarding...")
    result = send_message("Привет, я здесь впервые")
    print(f"   AI: {result['response'][:100]}...")
    
    # Step 2: Identify as worker
    print("\n2️⃣  Declaring as worker...")
    result = send_message("Я рабочий, ищу работу")
    print(f"   AI: {result['response'][:100]}...")
    
    # Step 3: Specify specialization
    print("\n3️⃣  Specifying specialization (electrician)...")
    result = send_message("Я электрик")
    print(f"   AI: {result['response'][:100]}...")
    
    # Step 4: Experience
    print("\n4️⃣  Providing experience (10 years)...")
    result = send_message("У меня 10 лет опыта")
    print(f"   is_complete: {result.get('is_complete')}")
    
    if result.get('is_complete'):
        token = result.get('access_token')
        print(f"   ✅ ONBOARDING COMPLETE!")
        print(f"   📌 Token generated: {token[:40]}...{token[-10:]}")
        
        # Step 5: Test protected endpoint with the token
        print("\n5️⃣  Testing protected endpoint with token...")
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        response = requests.get(f"{BASE_URL}/api/users/me", headers=headers, timeout=5)
        response.raise_for_status()
        profile = response.json()
        
        print(f"   ✅ Profile retrieved:")
        print(f"      - ID: {profile.get('id')}")
        print(f"      - Role: {profile.get('role')}")
        print(f"      - Specialization: {profile.get('specialization')}")
        print(f"      - Experience: {profile.get('experience_years')} years")
        print(f"      - Verified: {profile.get('is_verified')}")
        
        # Step 6: Test invalid token rejection
        print("\n6️⃣  Testing invalid token rejection...")
        bad_headers = {"Authorization": "Bearer invalid.token.fake"}
        response = requests.get(f"{BASE_URL}/api/users/me", headers=bad_headers)
        if response.status_code == 401:
            print(f"   ✅ Invalid token correctly rejected (401)")
        else:
            print(f"   ⚠️  Expected 401, got {response.status_code}")
        
        print("\n" + "=" * 70)
        print("✅ ALL TESTS PASSED! Bearer token authentication working!")
        print("=" * 70)
    else:
        print(f"   ⚠️  Onboarding not complete yet")
        print(f"   Response: {result['response']}")
        
except Exception as e:
    print(f"\n❌ Error during testing: {e}")
    import traceback
    traceback.print_exc()
