import jwt
from flask import request, jsonify
from functools import wraps
import os  # ✅ Add this
from dotenv import load_dotenv

load_dotenv()
JWT_SECRET = os.getenv("JWT_SECRET")


def generate_token(user):
    payload = {
        "sub": str(user.id),
        "id": user.id,
        "role": user.role,
        "email": user.email
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def decode_token(token):
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get("Authorization")
        if not token or not token.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid token"}), 401
        token = token.split(" ")[1]
        data = decode_token(token)
        if not data:
            return jsonify({"error": "Invalid or expired token"}), 403
        request.user = data  # You can access it in the route
        return f(*args, **kwargs)
    return decorated
