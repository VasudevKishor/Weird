from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson.objectid import ObjectId
from datetime import datetime,timezone
from werkzeug.security import generate_password_hash, check_password_hash
import os
from dotenv import load_dotenv
from pytz import timezone as pytz_timezone
IST = pytz_timezone("Asia/Kolkata")

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Connect to MongoDB
client = MongoClient(os.getenv("MONGO_URI"))
db = client["dashboardDB"]

# Valid roles
ROLES = ["admin", "department_manager", "project_manager", "financial_analyst", "employee"]

# ------------------ AUTH ------------------

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    user = db.users.find_one({"email": email})
    
    if not user or not check_password_hash(user.get("password", ""), password):
        return jsonify({"error": "Invalid email or password"}), 401

    return jsonify({
        "message": "Login successful",
        "user": {
            "id": str(user["_id"]),
            "email": user.get("email"),
            "role": user.get("role")
        },
        "token": "dummy-token"
    })

# ------------------ USERS ------------------

@app.route('/api/users', methods=['POST'])
def create_user():
    data = request.json
    email = data.get("email")
    name = data.get("name")
    password = data.get("password")
    role = data.get("role", "").strip().lower()

    if not all([email, name, password]):
        return jsonify({"error": "All fields are required"}), 400

    if role not in ROLES:
        return jsonify({"error": f"Invalid role: '{role}'"}), 400

    if db.users.find_one({"email": email}):
        return jsonify({"error": "User already exists"}), 409

    user_data = {
        "email": email,
        "name": name,
        "password": generate_password_hash(password),
        "role": role,
        "working_hours": 0,
        "createdAt": datetime.utcnow()
    }

    db.users.insert_one(user_data)
    return jsonify({"message": "User created"}), 201

@app.route('/api/users/<user_id>', methods=['DELETE'])
def delete_user(user_id):
    result = db.users.delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 1:
        return jsonify({"message": "User deleted"}), 200
    return jsonify({"error": "User not found"}), 404

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

@app.route('/api/users', methods=['GET'])
def get_users():
    users = list(db.users.find({}))
    for user in users:
        user["_id"] = str(user["_id"])
        user.pop("password", None)
    return jsonify(users)

# ------------------ LEADERBOARD ------------------

@app.route('/api/leaderboard', methods=['GET'])
def leaderboard():
    top_users = list(db.users.find({"role": "employee"}).sort("working_hours", -1).limit(10))
    for user in top_users:
        user["_id"] = str(user["_id"])
        user.pop("password", None)
    return jsonify(top_users)

# ------------------ ORGANISATIONS ------------------

@app.route('/api/organisations', methods=['POST'])
def create_organisation():
    data = request.json
    oid = data.get("oid", "").strip()
    name = data.get("name", "").strip()

    if not oid or not name:
        return jsonify({"error": "Organisation ID and name are required"}), 400

    if db.organisations.find_one({"oid": oid}):
        return jsonify({"error": "Organisation already exists"}), 409

    new_org = {
        "oid": oid,
        "name": name,
        "createdAt": datetime.utcnow()
    }

    result = db.organisations.insert_one(new_org)
    new_org["_id"] = str(result.inserted_id)
    return jsonify(new_org), 201

@app.route('/api/organisations', methods=['GET'])
def get_organisations():
    organisations = list(db.organisations.find({}))
    for org in organisations:
        org["_id"] = str(org["_id"])
    return jsonify(organisations)

@app.route('/api/organisations/<oid>', methods=['DELETE'])
def delete_organisation(oid):
    result = db.organisations.delete_one({"oid": oid})
    if result.deleted_count == 0:
        return jsonify({"error": "Organisation not found"}), 404
    db.departments.delete_many({"oid": oid})
    return jsonify({"message": "Organisation and related departments deleted"}), 200

@app.route('/api/organisations/<oid>', methods=['PUT'])
def update_organisation(oid):
    data = request.json
    name = data.get("name", "").strip()

    if not name:
        return jsonify({"error": "Name is required"}), 400

    result = db.organisations.find_one_and_update(
        {"oid": oid},
        {"$set": {"name": name, "updatedAt": datetime.utcnow()}},
        return_document=True
    )

    if not result:
        return jsonify({"error": "Organisation not found"}), 404

    result["_id"] = str(result["_id"])
    return jsonify(result), 200

# ------------------ DEPARTMENTS ------------------

@app.route('/api/departments', methods=['POST'])
def create_department():
    data = request.json
    did = data.get("did", "").strip()
    name = data.get("name", "").strip()
    oid = data.get("oid", "").strip()
    managerId = data.get("managerId", "").strip()

    if not all([did, name, oid, managerId]):
        return jsonify({"error": "All fields required"}), 400

    if not db.organisations.find_one({"oid": oid}):
        return jsonify({"error": "Organisation does not exist"}), 404

    if db.departments.find_one({"did": did}):
        return jsonify({"error": "Department already exists"}), 409

    db.departments.insert_one({
        "did": did,
        "name": name,
        "oid": oid,
        "managerId": managerId,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    })

    return jsonify({"message": "Department created"}), 201

@app.route('/api/departments', methods=['GET'])
def get_departments():
    departments = list(db.departments.find({}))
    for dept in departments:
        dept["_id"] = str(dept["_id"])
    return jsonify(departments)

@app.route('/api/departments/<did>', methods=['PUT'])
def update_department(did):
    data = request.json
    name = data.get("name", "").strip()
    oid = data.get("oid", "").strip()
    managerId = data.get("managerId", "").strip()

    if not all([name, oid, managerId]):
        return jsonify({"error": "All fields required"}), 400

    result = db.departments.find_one_and_update(
        {"did": did},
        {
            "$set": {
                "name": name,
                "oid": oid,
                "managerId": managerId,
                "updatedAt": datetime.utcnow()
            }
        },
        return_document=True
    )

    if not result:
        return jsonify({"error": "Department not found"}), 404

    result["_id"] = str(result["_id"])
    return jsonify(result), 200

@app.route('/api/departments/<did>', methods=['DELETE'])
def delete_department(did):
    result = db.departments.delete_one({"did": did})
    if result.deleted_count == 0:
        return jsonify({"error": "Department not found"}), 404
    return jsonify({"message": "Department deleted"}), 200

# ------------------ EMPLOYEES ------------------

@app.route('/api/employees', methods=['GET'])
def get_employees():
    employees = list(db.users.find({"role": {"$in": ["employee", "admin"]}}))
    for emp in employees:
        emp["_id"] = str(emp["_id"])
        emp.pop("password", None)
    return jsonify(employees)

@app.route('/api/employees', methods=['POST'])
def add_employee():
    data = request.json
    eid = data.get("eid")
    fname = data.get("fname")
    lname = data.get("lname")
    email = data.get("email")
    did = data.get("did")
    password = data.get("password")

    if not all([eid, fname, lname, email, did, password]):
        return jsonify({"error": "All fields are required"}), 400

    if db.users.find_one({"email": email}):
        return jsonify({"error": "Email already exists"}), 409

    employee = {
        "eid": eid,
        "fname": fname,
        "lname": lname,
        "email": email,
        "did": did,
        "role": "employee",
        "password": generate_password_hash(password),
        "working_hours": 0,
        "createdAt": datetime.utcnow()
    }

    result = db.users.insert_one(employee)
    employee["_id"] = str(result.inserted_id)
    employee.pop("password", None)
    return jsonify(employee), 201

@app.route('/api/projects', methods=['GET'])
def get_projects():
    projects = list(db.projects.find({}))
    for proj in projects:
        proj["_id"] = str(proj["_id"])
        if isinstance(proj.get("startDate"), datetime):
            proj["startDate"] = proj["startDate"].strftime('%Y-%m-%d')
        if isinstance(proj.get("endDate"), datetime):
            proj["endDate"] = proj["endDate"].strftime('%Y-%m-%d')
        if isinstance(proj.get("createdAt"), datetime):
            proj["createdAt"] = proj["createdAt"].strftime('%Y-%m-%d')
    return jsonify(projects), 200

@app.route('/api/projects', methods=['POST'])
def create_project():
    data = request.json or {}
    name = data.get("name", "").strip()
    departmentId = data.get("departmentId", "").strip()
    startDate = data.get("startDate", "").strip()
    endDate = data.get("endDate", "").strip()
    budget = data.get("budget")

    if not all([name, departmentId, startDate, endDate, budget]):
        return jsonify({"error": "All fields are required"}), 400

    try:
        new_project = {
            "name": name,
            "departmentId": departmentId,
            "startDate": datetime.strptime(startDate, "%Y-%m-%d"),
            "endDate": datetime.strptime(endDate, "%Y-%m-%d"),
            "budget": float(budget),
            "createdAt": datetime.utcnow()
        }
    except ValueError:
        return jsonify({"error": "Invalid date or budget format"}), 400

    result = db.projects.insert_one(new_project)
    new_project["_id"] = str(result.inserted_id)
    new_project["startDate"] = startDate
    new_project["endDate"] = endDate
    new_project["createdAt"] = new_project["createdAt"].strftime('%Y-%m-%d')

    return jsonify(new_project), 201

@app.route('/api/projects/<project_id>', methods=['PUT'])
def update_project(project_id):
    data = request.json or {}
    name = data.get("name", "").strip()
    departmentId = data.get("departmentId", "").strip()
    startDate = data.get("startDate", "").strip()
    endDate = data.get("endDate", "").strip()
    budget = data.get("budget")

    if not all([name, departmentId, startDate, endDate, budget]):
        return jsonify({"error": "All fields are required"}), 400

    try:
        updated_data = {
            "name": name,
            "departmentId": departmentId,
            "startDate": datetime.strptime(startDate, "%Y-%m-%d"),
            "endDate": datetime.strptime(endDate, "%Y-%m-%d"),
            "budget": float(budget),
            "updatedAt": datetime.utcnow()
        }
    except ValueError:
        return jsonify({"error": "Invalid date or budget format"}), 400

    result = db.projects.find_one_and_update(
        {"_id": ObjectId(project_id)},
        {"$set": updated_data},
        return_document=True
    )

    if not result:
        return jsonify({"error": "Project not found"}), 404

    result["_id"] = str(result["_id"])
    result["startDate"] = result["startDate"].strftime('%Y-%m-%d')
    result["endDate"] = result["endDate"].strftime('%Y-%m-%d')
    result["updatedAt"] = result["updatedAt"].strftime('%Y-%m-%d')

    return jsonify(result), 200

@app.route('/api/projects/<project_id>', methods=['DELETE'])
def delete_project(project_id):
    result = db.projects.delete_one({"_id": ObjectId(project_id)})
    if result.deleted_count == 0:
        return jsonify({"error": "Project not found"}), 404
    return jsonify({"message": "Project deleted"}), 200

@app.route('/api/employees/<eid>', methods=['PUT'])
def update_employee(eid):
    data = request.json or {}
    updates = {}
    for field in ["fname", "lname", "email", "did", "status", "joinDate"]:
        if field in data:
            updates[field] = data[field]
    if not updates:
        return jsonify({"error": "No fields to update"}), 400

    updates["updatedAt"] = datetime.utcnow()
    result = db.users.update_one({"eid": eid}, {"$set": updates})
    if result.matched_count == 0:
        return jsonify({"error": "Employee not found"}), 404

    emp = db.users.find_one({"eid": eid})
    emp["_id"] = str(emp["_id"])
    emp.pop("password", None)
    return jsonify(emp), 200

# Recent Activities

def parse_timestamp(ts):
    if isinstance(ts, datetime):
        if ts.tzinfo is None:
            return ts.replace(tzinfo=timezone.utc)
        return ts
    try:
        dt = datetime.fromisoformat(str(ts))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception:
        return datetime.now(timezone.utc)
    if isinstance(ts, datetime):
        return ts
    try:
        return datetime.fromisoformat(str(ts))
    except ception:
        return datetime.now(timezone.utc)
def log_activity(type_, name, action):
    db.activity_log.insert_one({
        "type": type_,
        "name": name,
        "action": action,  # "created", "updated", "deleted"
        "timestamp": datetime.utcnow()
    })



@app.route('/api/recent-activities')
def get_recent_activities():
    activities = []

    for e in db.employees.find().limit(10):
        name = f"{e.get('fname', '')} {e.get('lname', '')}".strip()
        activities.append({
            "type": "Employee",
            "name": name,
            "timestamp": parse_timestamp(e.get("createdAt"))
        })

    for o in db.organisations.find().limit(10):
        activities.append({
            "type": "Organisation",
            "name": o.get("name"),
            "timestamp": parse_timestamp(o.get("createdAt"))
        })

    for p in db.projects.find().limit(10):
        activities.append({
            "type": "Project",
            "name": p.get("name"),
            "timestamp": parse_timestamp(p.get("createdAt"))
        })

    activities.sort(key=lambda x: x["timestamp"], reverse=True)

    return jsonify(activities)
    activities.sort(key=lambda x: x["timestamp"], reverse=True)

    return jsonify(activities)



# ------------------ MAIN ------------------

if __name__ == '__main__':
    app.run(debug=True)
