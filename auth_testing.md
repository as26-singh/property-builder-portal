# Authentication and CRM testing playbook

1. Login with the seeded admin credentials in `/app/memory/test_credentials.md` and verify `/api/auth/me`.
2. Confirm an unauthenticated request to `/api/admin/dashboard` returns 401.
3. Submit a public inquiry and verify a lead is created.
4. Log in as an associate, confirm only assigned leads are returned, and update a lead status.
5. Log in as admin, assign a lead, and verify it appears for the associate.
6. Verify site visit requests are stored and property reservations reject unavailable properties.
7. Verify admin reservation approval and rejection update reservation and property state.
8. For object storage, verify admin uploads use the storage integration and only database file references are returned.