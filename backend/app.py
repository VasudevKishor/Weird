from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from dotenv import load_dotenv
import os

# ------------------ CONFIGURATION ------------------

load_dotenv()
app = Flask(__name__)
CORS(app)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("MYSQL_URI")
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# ------------------ CONSTANTS ------------------

ROLES = ["admin", "department_manager", "project_manager", "financial_analyst", "employee"]

# ------------------ MODELS ------------------

project_assignees = db.Table('project_assignees',
    db.Column('project_id', db.Integer, db.ForeignKey('project.id'), primary_key=True),
    db.Column('eid', db.String(10), db.ForeignKey('employee.eid'), primary_key=True)
)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    eid = db.Column(db.String(20), unique=True)
    fname = db.Column(db.String(100))
    lname = db.Column(db.String(100))
    email = db.Column(db.String(100), unique=True)
    password = db.Column(db.String(200))
    role = db.Column(db.String(50))
    did = db.Column(db.String(20))
    working_hours = db.Column(db.Integer, default=0)
    joinDate = db.Column(db.Date)
    status = db.Column(db.String(50))
    createdAt = db.Column(db.DateTime, default=datetime.utcnow)
    updatedAt = db.Column(db.DateTime, onupdate=datetime.utcnow)

class Organisation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    oid = db.Column(db.String(20), unique=True)
    name = db.Column(db.String(100))
    createdAt = db.Column(db.DateTime, default=datetime.utcnow)
    updatedAt = db.Column(db.DateTime, onupdate=datetime.utcnow)

class Department(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    did = db.Column(db.String(20), unique=True)
    name = db.Column(db.String(100))
    oid = db.Column(db.String(20))
    managerId = db.Column(db.String(100))
    createdAt = db.Column(db.DateTime, default=datetime.utcnow)
    updatedAt = db.Column(db.DateTime, onupdate=datetime.utcnow)

class Project(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    departmentId = db.Column(db.String(20))
    startDate = db.Column(db.Date)
    endDate = db.Column(db.Date)
    budget = db.Column(db.Float)
    createdAt = db.Column(db.DateTime, default=datetime.utcnow)
    updatedAt = db.Column(db.DateTime, onupdate=datetime.utcnow)
    assignees = db.relationship('Employee', secondary=project_assignees, backref='projects')

class ActivityLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(50))
    name = db.Column(db.String(100))
    action = db.Column(db.String(50))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

class Employee(db.Model):
    eid = db.Column(db.String(10), primary_key=True)
    fname = db.Column(db.String(50))
    lname = db.Column(db.String(50))
    email = db.Column(db.String(100))

# ------------------ HELPERS ------------------

@app.route('/api/employees', methods=['GET'])
def get_employees():
    return get_users()


def log_activity(type_, name, action):
    db.session.add(ActivityLog(type=type_, name=name, action=action))
    db.session.commit()

def user_to_json(u):
    return {
        "id": u.id,
        "eid": u.eid,
        "fname": u.fname,
        "lname": u.lname,
        "email": u.email,
        "role": u.role,
        "did": u.did,
        "joinDate": u.joinDate.strftime('%Y-%m-%d') if u.joinDate else None,
        "status": u.status,
        "createdAt": u.createdAt.strftime('%Y-%m-%d'),
    }

# ------------------ AUTH ------------------

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(email=data.get("email")).first()
    if not user or not check_password_hash(user.password, data.get("password")):
        return jsonify({"error": "Invalid email or password"}), 401
    return jsonify({
        "message": "Login successful",
        "user": user_to_json(user),
        "token": "dummy-token"
    })

# ------------------ USER ROUTES ------------------

# GET all employees, POST new employee
@app.route('/api/employees', methods=['GET', 'POST'])
def employees():
    if request.method == 'GET':
        return get_users()
    elif request.method == 'POST':
        return create_user()

# PUT to update employee, DELETE to remove
@app.route('/api/employees/<eid>', methods=['PUT', 'DELETE'])
def employee_by_id(eid):
    if request.method == 'PUT':
        return update_user(eid)
    elif request.method == 'DELETE':
        return delete_user(eid)



@app.route('/api/users', methods=['POST'])
def create_user():
    data = request.json
    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "User already exists"}), 409
    user = User(
        eid=data.get("eid"),
        fname=data.get("fname"),
        lname=data.get("lname"),
        email=data["email"],
        password=generate_password_hash(data["password"]),
        role=data.get("role", "employee"),
        did=data.get("did"),
        joinDate=datetime.strptime(data["joinDate"], "%Y-%m-%d") if data.get("joinDate") else None,
        status=data.get("status", "active")
    )
    db.session.add(user)
    db.session.commit()
    return jsonify({"message": "User created", "user": user_to_json(user)}), 201

@app.route('/api/users', methods=['GET'])
def get_users():
    users = User.query.filter_by(role='employee').all()
    return jsonify([user_to_json(u) for u in users])


@app.route('/api/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "User deleted"}), 200

@app.route('/api/users/<eid>', methods=['PUT'])
def update_user(eid):
    user = User.query.filter_by(eid=eid).first()
    if not user:
        return jsonify({"error": "User not found"}), 404
    data = request.json
    user.fname = data.get("fname", user.fname)
    user.lname = data.get("lname", user.lname)
    user.email = data.get("email", user.email)
    user.did = data.get("did", user.did)
    # Optional: Only update password if provided
    if data.get("password"):
        user.password = generate_password_hash(data["password"])
    db.session.commit()
    return jsonify({"message": "User updated", "user": user_to_json(user)}), 200


# ------------------ ORGANISATIONS ------------------

@app.route('/api/organisations', methods=['POST'])
def create_organisation():
    data = request.json
    if Organisation.query.filter_by(oid=data["oid"]).first():
        return jsonify({"error": "Organisation already exists"}), 409
    org = Organisation(oid=data["oid"], name=data["name"])
    db.session.add(org)
    db.session.commit()
    return jsonify({
        "message": "Organisation created",
        "organisation": {"oid": org.oid, "name": org.name}
    }), 201

@app.route('/api/organisations', methods=['GET'])
def get_organisations():
    orgs = Organisation.query.all()
    return jsonify([{"id": o.id, "oid": o.oid, "name": o.name} for o in orgs])

@app.route('/api/organisations/<oid>', methods=['DELETE'])
def delete_organisation(oid):
    org = Organisation.query.filter_by(oid=oid).first()
    if not org:
        return jsonify({"error": "Organisation not found"}), 404
    Department.query.filter_by(oid=oid).delete()
    db.session.delete(org)
    db.session.commit()
    return jsonify({"message": "Organisation and related departments deleted"}), 200


@app.route('/api/organisations/<oid>', methods=['PUT'])
def update_organisation(oid):
    org = Organisation.query.filter_by(oid=oid).first()
    if not org:
        return jsonify({"error": "Organisation not found"}), 404

    data = request.json
    org.name = data.get("name", org.name)
    db.session.commit()

    return jsonify({
        "oid": org.oid,
        "name": org.name,
        "createdAt": org.createdAt.isoformat() if org.createdAt else None
    }), 200
# ------------------ DEPARTMENTS ------------------

@app.route('/api/departments', methods=['POST'])
def create_department():
    data = request.json
    if Department.query.filter_by(did=data["did"]).first():
        return jsonify({"error": "Department already exists"}), 409
    dept = Department(
        did=data["did"],
        name=data["name"],
        oid=data["oid"],
        managerId=data["managerId"]
    )
    db.session.add(dept)
    db.session.commit()
    return jsonify({"message": "Department created"}), 201

@app.route('/api/departments', methods=['GET'])
def get_departments():
    depts = Department.query.all()
    return jsonify([{
        "id": d.id,
        "did": d.did,
        "name": d.name,
        "oid": d.oid,
        "managerId": d.managerId
    } for d in depts])

@app.route('/api/departments/<did>', methods=['DELETE'])
def delete_department(did):
    dept = Department.query.filter_by(did=did).first()
    if not dept:
        return jsonify({"error": "Department not found"}), 404
    db.session.delete(dept)
    db.session.commit()
    return jsonify({"message": "Department deleted"}), 200

# ------------------ PROJECTS ------------------

@app.route('/api/projects', methods=['POST'])
def create_project():
    data = request.json
    project = Project(
        name=data["name"],
        departmentId=data["departmentId"],
        startDate=datetime.strptime(data["startDate"], "%Y-%m-%d"),
        endDate=datetime.strptime(data["endDate"], "%Y-%m-%d"),
        budget=float(data["budget"])
    )
    db.session.add(project)
    db.session.commit()
    return jsonify({"message": "Project created"}), 201

@app.route('/api/projects', methods=['GET'])
def get_projects():
    projects = Project.query.all()
    return jsonify([{
        "id": p.id,
        "name": p.name,
        "departmentId": p.departmentId,
        "startDate": p.startDate.strftime('%Y-%m-%d'),
        "endDate": p.endDate.strftime('%Y-%m-%d'),
        "budget": p.budget
    } for p in projects])

@app.route('/api/projects/<int:id>', methods=['DELETE'])
def delete_project(id):
    project = Project.query.get(id)
    if not project:
        return jsonify({"error": "Project not found"}), 404

    db.session.delete(project)
    db.session.commit()
    return jsonify({"message": "Project deleted"}), 200

@app.route('/api/projects/<int:project_id>', methods=['PUT'])
def update_project(project_id):
    data = request.json
    project = Project.query.get_or_404(project_id)

    project.name = data.get('name', project.name)
    project.departmentId = data.get('departmentId', project.departmentId)
    project.startDate = datetime.strptime(data['startDate'], '%Y-%m-%d')
    project.endDate = datetime.strptime(data['endDate'], '%Y-%m-%d')
    project.budget = float(data['budget'])

    db.session.commit()

    return jsonify({
        'id': project.id,
        'name': project.name,
        'departmentId': project.departmentId,
        'startDate': project.startDate.strftime('%Y-%m-%d'),
        'endDate': project.endDate.strftime('%Y-%m-%d'),
        'budget': project.budget
    }), 200

@app.route('/api/projects/<int:project_id>/assignees', methods=['GET'])
def get_assignees(project_id):
    project = Project.query.get_or_404(project_id)
    assignees = [{
        "eid": emp.eid,
        "fname": emp.fname,
        "lname": emp.lname,
        "email": emp.email
    } for emp in project.assignees]
    return jsonify(assignees), 200

@app.route('/api/projects/<int:project_id>/assignees', methods=['POST'])
def add_project_assignee(project_id):
    data = request.get_json()
    eid = data.get('eid')

    if not eid:
        return jsonify({"error": "EID required"}), 400

    # Example logic – adapt based on your DB schema
    employee = Employee.query.filter_by(eid=eid).first()
    if not employee:
        return jsonify({"error": "Employee not found"}), 404

    # Insert into join table or association
    db.session.execute(
        "INSERT INTO project_assignees (project_id, employee_eid) VALUES (:pid, :eid)",
        {"pid": project_id, "eid": eid}
    )
    db.session.commit()

    return jsonify({"message": "Assignee added"}), 200

@app.route('/api/projects/<int:project_id>/assignees/<string:eid>', methods=['DELETE'])
def remove_assignee(project_id, eid):
    project = Project.query.get_or_404(project_id)
    emp = Employee.query.get(eid)
    if not emp:
        return jsonify({"error": "Employee not found"}), 404

    if emp not in project.assignees:
        return jsonify({"error": "Employee not assigned to this project"}), 404

    project.assignees.remove(emp)
    db.session.commit()
    return jsonify({"message": "Assignee removed"}), 200

    
# ------------------ MAIN ------------------

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)