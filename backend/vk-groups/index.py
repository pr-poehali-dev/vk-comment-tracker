"""
Управление группами ВКонтакте для мониторинга комментариев.
GET / — список всех групп
POST / — добавить группу (body: {screen_name или vk_id})
DELETE / — удалить группу (body: {id})
PATCH / — переключить активность (body: {id, is_active})
GET /search — поиск групп через VK API (query: q)
"""

import os
import json
import psycopg2
import urllib.request
import urllib.parse


SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p94871206_vk_comment_tracker")
VK_TOKEN = os.environ.get("VK_ACCESS_TOKEN", "")
VK_API = "https://api.vk.com/method"
VK_VERSION = "5.199"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def vk_request(method: str, params: dict) -> dict:
    params["access_token"] = VK_TOKEN
    params["v"] = VK_VERSION
    url = f"{VK_API}/{method}?" + urllib.parse.urlencode(params)
    with urllib.request.urlopen(url, timeout=10) as r:
        return json.loads(r.read().decode())


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def handler(event: dict, context) -> dict:
    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")

    if method == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    # GET /search — поиск через VK API
    if method == "GET" and path.endswith("/search"):
        q = (event.get("queryStringParameters") or {}).get("q", "")
        if not q:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "q required"})}

        data = vk_request("groups.search", {"q": q, "count": 10, "type": "page,group,event", "fields": "members_count,photo_200"})
        items = data.get("response", {}).get("items", [])
        result = []
        for g in items:
            result.append({
                "vk_id": g["id"],
                "screen_name": g.get("screen_name", f"club{g['id']}"),
                "name": g["name"],
                "photo_url": g.get("photo_200"),
                "members_count": g.get("members_count", 0),
            })
        return {"statusCode": 200, "headers": CORS, "body": json.dumps(result, ensure_ascii=False)}

    # GET / — список групп из БД
    if method == "GET":
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"""
            SELECT id, vk_id, screen_name, name, photo_url, members_count, is_active, created_at
            FROM {SCHEMA}.groups ORDER BY created_at DESC
        """)
        rows = cur.fetchall()
        conn.close()
        groups = [
            {
                "id": r[0], "vk_id": r[1], "screen_name": r[2], "name": r[3],
                "photo_url": r[4], "members_count": r[5], "is_active": r[6],
                "created_at": r[7].isoformat() if r[7] else None,
            }
            for r in rows
        ]
        return {"statusCode": 200, "headers": CORS, "body": json.dumps(groups, ensure_ascii=False)}

    body = json.loads(event.get("body") or "{}")

    # POST / — добавить группу
    if method == "POST":
        identifier = str(body.get("screen_name") or body.get("vk_id") or "").strip()
        if not identifier:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "screen_name or vk_id required"})}

        data = vk_request("groups.getById", {"group_id": identifier, "fields": "members_count,photo_200"})
        if "error" in data:
            return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Группа не найдена"})}

        groups_list = data.get("response", {}).get("groups", [])
        if not groups_list:
            return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Группа не найдена"})}

        g = groups_list[0]
        vk_id = g["id"]
        screen_name = g.get("screen_name", f"club{vk_id}")
        name = g["name"]
        photo_url = g.get("photo_200")
        members_count = g.get("members_count", 0)

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"""
            INSERT INTO {SCHEMA}.groups (vk_id, screen_name, name, photo_url, members_count)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (vk_id) DO UPDATE SET name=EXCLUDED.name, photo_url=EXCLUDED.photo_url, members_count=EXCLUDED.members_count, is_active=TRUE
            RETURNING id, vk_id, screen_name, name, photo_url, members_count, is_active, created_at
        """, (vk_id, screen_name, name, photo_url, members_count))
        row = cur.fetchone()
        conn.commit()
        conn.close()
        result = {
            "id": row[0], "vk_id": row[1], "screen_name": row[2], "name": row[3],
            "photo_url": row[4], "members_count": row[5], "is_active": row[6],
            "created_at": row[7].isoformat() if row[7] else None,
        }
        return {"statusCode": 200, "headers": CORS, "body": json.dumps(result, ensure_ascii=False)}

    # PATCH / — переключить is_active
    if method == "PATCH":
        group_id = body.get("id")
        is_active = body.get("is_active")
        if group_id is None or is_active is None:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "id and is_active required"})}
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"UPDATE {SCHEMA}.groups SET is_active=%s WHERE id=%s", (is_active, group_id))
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    # DELETE / — удалить группу
    if method == "DELETE":
        group_id = body.get("id")
        if not group_id:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "id required"})}
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"DELETE FROM {SCHEMA}.groups WHERE id=%s", (group_id,))
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    return {"statusCode": 405, "headers": CORS, "body": json.dumps({"error": "Method not allowed"})}
