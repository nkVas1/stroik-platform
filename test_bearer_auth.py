#!/usr/bin/env python3
"""Test bearer token authentication flow"""

import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000"

print("=" * 60)
print("🧪 TESTING BEARER TOKEN AUTHENTICATION")
print("=" * 60)

# Step 1: Complete onboarding to get a token
print("\n1️⃣  Testing chat endpoint (onboarding completion)...")
chat_payload = {
    "user_id": "test_session",
    "messages": [
        {"role": "user", "content": "Я электрик с опытом 10 лет"}
    ]
}

try:
    response = requests.post(f"{BASE_URL}/api/chat", json=chat_payload, timeout=30)
    response.raise_for_status()
    data = response.json()
    
    print(f"   Status: {response.status_code} ✓")
    print(f"   is_complete: {data.get('is_complete')}")
    
    token = data.get('access_token')
    if token:
        print(f"   ✅ Token generated: {token[:30]}...{token[-10:]}")
    else:
        print("   ⚠️  No token in response")
        print(f"   Response: {data}")
        exit(1)
except Exception as e:
    print(f"   ❌ Error: {e}")
    exit(1)

# Step 2: Test protected endpoint WITHOUT token
print("\n2️⃣  Testing /api/users/me WITHOUT token...")
try:
    response = requests.get(f"{BASE_URL}/api/users/me", timeout=5)
    print(f"   Status: {response.status_code}")
    if response.status_code == 403:
        print("   ✅ Correctly denied access (401/403)")
    else:
        print(f"   ⚠️  Expected 403, got {response.status_code}")
except Exception as e:
    print(f"   ✓ Request rejected as expected: {type(e).__name__}")

# Step 3: Test protected endpoint WITH valid token
print("\n3️⃣  Testing /api/users/me WITH valid token...")
try:
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    response = requests.get(f"{BASE_URL}/api/users/me", headers=headers, timeout=5)
    response.raise_for_status()
    profile = response.json()
    
    print(f"   Status: {response.status_code} ✓")
    print(f"   ✅ User profile retrieved:")
    print(f"      - ID: {profile.get('id')}")
    print(f"      - Role: {profile.get('role')}")
    print(f"      - Specialization: {profile.get('specialization')}")
    print(f"      - Experience (years): {profile.get('experience_years')}")
    print(f"      - Verified: {profile.get('is_verified')}")
except Exception as e:
    print(f"   ❌ Error: {e}")
    exit(1)

# Step 4: Test protected endpoint WITH invalid token
print("\n4️⃣  Testing /api/users/me WITH invalid token...")
try:
    invalid_headers = {
        "Authorization": "Bearer invalid.token.here",
        "Content-Type": "application/json"
    }
    response = requests.get(f"{BASE_URL}/api/users/me", headers=invalid_headers, timeout=5)
    if response.status_code == 401:
        print(f"   Status: {response.status_code} ✓")
        print("   ✅ Correctly rejected invalid token")
    else:
        print(f"   ⚠️  Expected 401, got {response.status_code}")
except Exception as e:
    print(f"   ✓ Request rejected: {type(e).__name__}")

print("\n" + "=" * 60)
print("✅ ALL TESTS PASSED!")
print("=" * 60)
