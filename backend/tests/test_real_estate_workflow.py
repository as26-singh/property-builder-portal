import os
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://codelytics-1.preview.emergentagent.com").rstrip("/")

def test_public_and_auth_workflow():
    s = requests.Session()
    projects = s.get(f"{BASE_URL}/api/public/projects")
    assert projects.status_code == 200 and projects.json()
    properties = s.get(f"{BASE_URL}/api/public/properties")
    assert properties.status_code == 200 and any(x["number"] == "A-101" for x in properties.json())
    inquiry = s.post(f"{BASE_URL}/api/public/inquiries", json={"name":"TEST Browser Lead","phone":"9876543210","email":"test.workflow@example.com"})
    assert inquiry.status_code == 200 and inquiry.json().get("lead_id")
    assert s.get(f"{BASE_URL}/api/admin/dashboard").status_code == 401
    admin = s.post(f"{BASE_URL}/api/auth/login", json={"email":"admin@verdant.example","password":"Admin@12345"})
    assert admin.status_code == 200 and admin.json()["role"] == "super_admin"
    assert s.get(f"{BASE_URL}/api/auth/me").status_code == 200
    assert s.get(f"{BASE_URL}/api/associate/dashboard").status_code == 403