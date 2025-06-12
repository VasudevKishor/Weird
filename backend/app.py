from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import os
from dotenv import load_dotenv
from bson.objectid import ObjectId 

load_dotenv()
app = Flask(__name__)
CORS(app)

# Connect to MongoDB
client = MongoClient(os.getenv("MONGO_URI"))
db = client["dashboardDB"]

# Login Route

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    user = db.users.find_one({"email": email})
    
    if not user or user.get("password") != password:
        return jsonify({"error": "Invalid email or password"}), 401

    return jsonify({
        "message": "Login successful",
        "user": {
            "email": user.get("email"),
            "role": user.get("role")
        },
        "token": "dummy-token"
    })

ROLES = ["admin", "department_manager", "project_manager", "financial_analyst", "employee"]

# Create User
@app.route('/api/users', methods=['POST'])
def create_user():
    data = request.json
    if data.get('role') not in ROLES:
        return jsonify({"error": "Invalid role"}), 400
    db.users.insert_one(data)
    return jsonify({"message": "User created"}), 201

# Delete User
@app.route('/api/users/<user_id>', methods=['DELETE'])
def delete_user(user_id):
    result = db.users.delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 1:
        return jsonify({"message": "User deleted"}), 200
    return jsonify({"error": "User not found"}), 404

# Update User Role
@app.route('/api/users/<user_id>/role', methods=['PATCH'])
def update_role(user_id):
    data = request.json
    new_role = data.get('role')
    if new_role not in ROLES:
        return jsonify({"error": "Invalid role"}), 400
    result = db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"role": new_role}})
    if result.matched_count == 1:
        return jsonify({"message": "Role updated"}), 200
    return jsonify({"error": "User not found"}), 404

# Leaderboard
@app.route('/api/leaderboard', methods=['GET'])
def leaderboard():
    top_users = list(db.users.find({"role": "employee"}).sort("working_hours", -1).limit(25))
    for user in top_users:
        user["_id"] = str(user["_id"])
    return jsonify(top_users)


if __name__ == '__main__':
    app.run(debug=True)
