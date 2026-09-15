import os
import io
import requests


BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")


def test_reservation_rejection_and_booking_approval_workflow():
    admin = requests.Session()
    associate = requests.Session()

    assert admin.post(f"{BASE_URL}/api/auth/login", json={"email": "admin@verdant.example", "password": "Admin@12345"}).status_code == 200
    assert associate.post(f"{BASE_URL}/api/auth/login", json={"email": "associate@verdant.example", "password": "Associate@12345"}).status_code == 200

    lead_response = requests.post(
        f"{BASE_URL}/api/public/inquiries",
        json={"name": "TEST Workflow Lead", "phone": "9876543211", "email": "test.reservation@example.com"},
    )
    assert lead_response.status_code == 200
    lead_id = lead_response.json()["lead_id"]
    associate_id = associate.get(f"{BASE_URL}/api/auth/me").json()["id"]
    assert admin.patch(f"{BASE_URL}/api/admin/leads/{lead_id}/assign", json={"associate_id": associate_id}).status_code == 200

    properties = associate.get(f"{BASE_URL}/api/associate/properties").json()
    property_id = next(item["id"] for item in properties if item["status"] == "available")
    reservation = associate.post(
        f"{BASE_URL}/api/associate/reservations",
        files={"property_id": (None, property_id), "lead_id": (None, lead_id)},
    )
    assert reservation.status_code == 200
    reservation_id = next(item["id"] for item in admin.get(f"{BASE_URL}/api/admin/reservations").json() if item["lead_id"] == lead_id)
    assert admin.patch(f"{BASE_URL}/api/admin/reservations/{reservation_id}", json={"decision": "reject"}).status_code == 200
    assert next(item["status"] for item in associate.get(f"{BASE_URL}/api/associate/properties").json() if item["id"] == property_id) == "available"

    reservation = associate.post(
        f"{BASE_URL}/api/associate/reservations",
        files={"property_id": (None, property_id), "lead_id": (None, lead_id)},
    )
    assert reservation.status_code == 200
    reservation_id = next(item["id"] for item in admin.get(f"{BASE_URL}/api/admin/reservations").json() if item["lead_id"] == lead_id and item["status"] == "pending")
    assert admin.patch(f"{BASE_URL}/api/admin/reservations/{reservation_id}", json={"decision": "approve"}).status_code == 200
    booking = associate.post(f"{BASE_URL}/api/associate/bookings", files={"reservation_id": (None, reservation_id)})
    assert booking.status_code == 200 and booking.json()["status"] == "pending"
    booking_id = booking.json()["id"]
    assert admin.patch(f"{BASE_URL}/api/admin/bookings/{booking_id}", json={"decision": "approve"}).status_code == 200
    assert next(item["status"] for item in associate.get(f"{BASE_URL}/api/associate/properties").json() if item["id"] == property_id) == "booked"

    reports = admin.get(f"{BASE_URL}/api/admin/reports")
    assert reports.status_code == 200 and "lead_status" in reports.json() and "property_status" in reports.json()
    assert admin.get(f"{BASE_URL}/api/admin/documents").status_code == 200
    assert admin.get(f"{BASE_URL}/api/admin/gallery").status_code == 200
    invalid = admin.post(f"{BASE_URL}/api/admin/uploads", files={"file": ("bad.txt", io.BytesIO(b"bad"), "text/plain")})
    assert invalid.status_code == 400