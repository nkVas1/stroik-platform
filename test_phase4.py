#!/usr/bin/env python3
"""Test Phase 4 - Hybrid Chat Mode with Bearer Token"""

import requests
import json
import time

BASE_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:3000"
OLLAMA_URL = "http://localhost:11434"

def test_services():
    """Check if all services are running"""
    print("🔍 Checking services...")
    
    try:
        backend = requests.get(f"{BASE_URL}/docs", timeout=3)
        print(f"✅ Backend (8000): {backend.status_code}")
    except Exception as e:
        print(f"❌ Backend (8000): {e}")
        return False
    
    try:
        frontend = requests.head(f"{FRONTEND_URL}/", timeout=3)
        print(f"✅ Frontend (3000): {frontend.status_code}")
    except Exception as e:
        print(f"❌ Frontend (3000): {e}")
    
    try:
        ollama = requests.get(f"{OLLAMA_URL}/api/tags", timeout=3)
        print(f"✅ Ollama (11434): {ollama.status_code}")
    except Exception as e:
        print(f"❌ Ollama (11434): {e}")
    
    return True

def test_new_user_onboarding():
    """Test Phase 4 Hybrid Mode 1: New user onboarding"""
    print("\n📝 TEST 1: New User Onboarding (No Bearer Token)")
    print("-" * 60)
    
    messages = [
        {"role": "user", "content": "Привет, я хочу присоединиться. Я сварщик с 10 годами опыта, ищу крупные проекты, говорю по-русски свободно"}
    ]
    
    response = requests.post(
        f"{BASE_URL}/api/chat",
        json={"messages": messages},
        headers={"Content-Type": "application/json"}
    )
    
    print(f"Status: {response.status_code}")
    data = response.json()
    print(f"Response text: {data.get('response')[:100]}...")
    print(f"Is complete: {data.get('is_complete')}")
    print(f"Access token: {data.get('access_token')[:20] if data.get('access_token') else 'None'}...")
    
    return data.get('access_token')

def test_existing_user_update(token):
    """Test Phase 4 Hybrid Mode 2: Existing user profile update"""
    print("\n🔄 TEST 2: Existing User Profile Update (With Bearer Token)")
    print("-" * 60)
    
    if not token:
        print("⚠️  No token available, skipping test")
        return
    
    messages = [
        {"role": "user", "content": "Мне нужно обновить мой профиль. Вот мой ФИО: Иван Сидоров, город Москва, email: ivan@example.com"}
    ]
    
    response = requests.post(
        f"{BASE_URL}/api/chat",
        json={"messages": messages},
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}"
        }
    )
    
    print(f"Status: {response.status_code}")
    data = response.json()
    print(f"Response text: {data.get('response')[:100]}...")
    print(f"Is complete: {data.get('is_complete')}")

def test_get_current_user(token):
    """Test GET /api/users/me with new fields"""
    print("\n👤 TEST 3: Get Current User Profile (All New Fields)")
    print("-" * 60)
    
    if not token:
        print("⚠️  No token available, skipping test")
        return
    
    response = requests.get(
        f"{BASE_URL}/api/users/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    print(f"Status: {response.status_code}")
    data = response.json()
    
    print("\nUser Profile:")
    print(f"  ID: {data.get('id')}")
    print(f"  Role: {data.get('role')}")
    print(f"  Is Verified: {data.get('is_verified')}")
    print(f"  Verification Level: {data.get('verification_level')}")
    print(f"  Entity Type: {data.get('entity_type')}")
    print(f"  FIO: {data.get('fio')}")
    print(f"  Company Name: {data.get('company_name')}")
    print(f"  Location: {data.get('location')}")
    print(f"  Email: {data.get('email')}")
    print(f"  Phone: {data.get('phone')}")
    print(f"  Language Proficiency: {data.get('language_proficiency')}")
    print(f"  Work Authorization: {data.get('work_authorization')}")

if __name__ == "__main__":
    print("=" * 60)
    print("Phase 4: Hybrid Chat Mode Test Suite")
    print("=" * 60)
    
    if not test_services():
        print("\n❌ Services not running. Please start them first.")
        exit(1)
    
    token = test_new_user_onboarding()
    test_existing_user_update(token)
    test_get_current_user(token)
    
    print("\n" + "=" * 60)
    print("✅ Test suite complete!")
    print("=" * 60)
