#!/bin/bash
# scripts/setup-keycloak.sh

KEYCLOAK_URL="http://localhost:8080"
ADMIN_USER="admin"
ADMIN_PASS="${KEYCLOAK_ADMIN_PASSWORD}"

# 等待 Keycloak 启动
echo "Waiting for Keycloak to start..."
sleep 30

# 获取 access token
TOKEN=$(curl -s -X POST "${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token" \
  -d "username=${ADMIN_USER}" \
  -d "password=${ADMIN_PASS}" \
  -d "grant_type=password" \
  -d "client_id=admin-cli" | jq -r '.access_token')

# 创建 Realm
curl -s -X POST "${KEYCLOAK_URL}/admin/realms" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "realm": "knowledge-platform",
    "enabled": true
  }'

# 创建 Clients
for client in portal dokuwiki gitea plane nextcloud; do
  curl -s -X POST "${KEYCLOAK_URL}/admin/realms/knowledge-platform/clients" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{
      \"clientId\": \"${client}\",
      \"enabled\": true,
      \"publicClient\": false,
      \"protocol\": \"openid-connect\",
      \"redirectUris\": [\"https://${DOMAIN}/*\"],
      \"webOrigins\": [\"https://${DOMAIN}\"]
    }"
done

# 创建 Roles
for role in admin project-manager engineer viewer; do
  curl -s -X POST "${KEYCLOAK_URL}/admin/realms/knowledge-platform/roles" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"name\": \"${role}\"}"
done

echo "Keycloak initialized successfully"
