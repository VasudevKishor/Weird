from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from dotenv import load_dotenv
import os
from sqlalchemy import and_
from jwt_utils import token_required, generate_token
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from flask_cors import CORS, cross_origin
from sqlalchemy.exc import SQLAlchemyError


# ------------------ CONFIGURATION ------------------

load_dotenv()
app = Flask(__name__)
CORS(app)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("MYSQL_URI")
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET')
jwt = JWTManager(app)
db = SQLAlchemy(app)

# ------------------ CONSTANTS ------------------

ROLES = ["admin", "department_manager", "project_manager", "financial_analyst", "employee"]

# ------------------ MODELS ------------------

project_assignees = db.Table(
    'project_assignees',
    db.Column('project_id', db.Integer, db.ForeignKey('project.id'), primary_key=True),
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('role', db.String(100))
)

class Role(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    role = db.Column(db.String(100), unique=True, nullable=False)
    privileges = db.Column(db.String(255))
    createdAt = db.Column(db.DateTime, default=datetime.utcnow)
    updatedAt = db.Column(db.DateTime, onupdate=datetime.utcnow)

# In app.py or routes.py
@app.route('/api/roles', methods=['GET'])
@jwt_required()
def get_roles():
    roles = Role.query.all()
    return jsonify([r.role for r in roles])

class EmployeeFinancials(db.Model):
    tablename = 'employee_financials'

    id = db.Column(db.Integer, primary_key=True)
    eid = db.Column(db.String(20), db.ForeignKey('user.eid'), unique=True, nullable=False)
    salary = db.Column(db.Float, nullable=True)
    infrastructure = db.Column(db.Float, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship('User', backref='financials')

class FinancialYear(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    label = db.Column(db.String(20), nullable=False, unique=True)  # e.g., "2024-2025"

    def to_dict(self):
        return {
            "id": self.id,
            "label": self.label
        }


from sqlalchemy import Date

class ProjectAssignment(db.Model):
    __tablename__ = 'project_assignment'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=False)
    allocated_percentage = db.Column(db.Integer, nullable=False)
    allocated_hours = db.Column(db.Integer)
    billing_rate = db.Column(db.Float)
    cost = db.Column(db.Float)
    start_date = db.Column(Date)  # Add this line
    end_date = db.Column(Date)    # And this line
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


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
    managerIds = db.Column(db.Text, nullable=True) 
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
    
class ActivityLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(50))
    name = db.Column(db.String(100))
    action = db.Column(db.String(50))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

# ------------------ FINANCIAL YEARS ------------------

@app.route("/financial-years", methods=["GET"])
def get_financial_years():
    years = FinancialYear.query.all()
    return jsonify([year.to_dict() for year in years]), 200

@app.route("/financial-years", methods=["POST"])
def add_financial_year():
    data = request.get_json()
    start_year = data.get("start_year")

    if not isinstance(start_year, int):
        return jsonify({"error": "Invalid or missing start_year"}), 400

    label = f"{start_year}-{start_year + 1}"

    if FinancialYear.query.filter_by(label=label).first():
        return jsonify({"error": "Financial year already exists"}), 400

    year = FinancialYear(label=label)
    db.session.add(year)
    db.session.commit()
    return jsonify(year.to_dict()), 201

@app.route("/financial-years/<int:id>", methods=["DELETE"])
def delete_financial_year(id):
    year = FinancialYear.query.get(id)
    if not year:
        return jsonify({"error": "Not found"}), 404

    db.session.delete(year)
    db.session.commit()
    return jsonify({"message": "Deleted"}), 200
#------------------FINANCIAL YEAR PAGE-----------------
@app.route('/api/employee-financials', methods=['GET'])
@jwt_required()
def get_employee_financials():
    # Filter users based on role and status
    users = User.query.filter(
        User.role.in_(['employee', 'department_manager']),
        User.status == 'active'
    ).all()

    result = []
    for user in users:
        financial = EmployeeFinancials.query.filter_by(eid=user.eid).first()
        salary = financial.salary if financial else None
        infrastructure = financial.infrastructure if financial else None
        cost = None
        if salary is not None and infrastructure is not None:
            cost = salary + infrastructure
        result.append({
            "eid": user.eid,
            "fname": user.fname,
            "lname": user.lname,
            "salary": salary,
            "infrastructure": infrastructure,
            "cost": cost
        })

    return jsonify(result), 200



# POST to update a user's financials
@app.route('/api/employee-financials/<eid>', methods=['POST'])
@jwt_required()
def update_employee_financials(eid):
    data = request.get_json()
    salary = data.get("salary")
    infrastructure = data.get("infrastructure")

    user = User.query.filter_by(eid=eid).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    financial = EmployeeFinancials.query.filter_by(eid=eid).first()
    if not financial:
        financial = EmployeeFinancials(eid=eid)
        db.session.add(financial)

    financial.salary = salary
    financial.infrastructure = infrastructure
    db.session.commit()

    return jsonify({"message": "Financial data updated"}), 200

# ------------------ PROJECT ASSIGNMENTS ------------------

def working_days(start_date, end_date): 
    total = 0
    curr = start_date
    while curr <= end_date:
        if curr.weekday() < 5:  # 0–4 are Mon–Fri
            total += 1
        curr += timedelta(days=1)
    return total
@app.route('/api/assign-task', methods=['POST'])
@jwt_required()
def assign_task():
    try:
        print("📥 Received request to /api/assign-task")

        data = request.get_json()
        print(f"🔍 Request JSON: {data}")

        if not data:
            return jsonify({"error": "No data provided"}), 400

        project_id = data.get('project_id')
        assignments = data.get('assignments', [])

        print(f"📌 project_id: {project_id}, Assignments count: {len(assignments)}")

        if project_id is None:
            return jsonify({"error": "project_id is required"}), 400

        try:
            project_id = int(project_id)
        except (ValueError, TypeError):
            return jsonify({"error": "project_id must be an integer"}), 400

        if not assignments or not isinstance(assignments, list):
            return jsonify({"error": "Assignments must be a non-empty array"}), 400

        project = Project.query.get(project_id)
        if not project:
            print(f"🚫 Project {project_id} not found.")
            return jsonify({"error": "Project not found"}), 404

        validated_assignments = []
        total_percentage = 0
        allocations = []

        for assignment in assignments:
            print(f"🧪 Validating assignment: {assignment}")

            if not all(key in assignment for key in ['user_id', 'percentage', 'billing_rate', 'start_date', 'end_date']):
                return jsonify({"error": "Each assignment requires user_id, percentage, billing_rate, start_date, and end_date"}), 400

            try:
                user_id = int(assignment['user_id'])
                percentage = float(assignment['percentage'])
                billing_rate = float(assignment['billing_rate'])
                start_date = datetime.strptime(assignment['start_date'], "%Y-%m-%d").date()
                end_date = datetime.strptime(assignment['end_date'], "%Y-%m-%d").date()
            except (ValueError, TypeError):
                return jsonify({"error": "Invalid numeric or date values in assignment. Date format: YYYY-MM-DD"}), 400

            user = User.query.get(user_id)
            if not user:
                print(f"🚫 User with ID {user_id} not found.")
                return jsonify({"error": f"User with ID {user_id} not found"}), 404

            if percentage <= 0 or percentage > 100:
                return jsonify({"error": "Percentage must be between 0 and 100"}), 400

            working_days_count = working_days(start_date, end_date) + 1
            HOURS_PER_DAY = 8
            allocated_hours = working_days_count * HOURS_PER_DAY * (percentage / 100.0)
            cost = billing_rate * allocated_hours

            allocation_data = {
                'user_id': user_id,
                'project_id': project_id,
                'allocated_percentage': percentage,
                'billing_rate': billing_rate,
                'allocated_hours': working_days_count,
                'cost': round(cost, 2),
                'start_date': start_date,
                'end_date': end_date
            }

            total_percentage += percentage
            allocations.append(allocation_data)
            validated_assignments.append(allocation_data)

        if total_percentage > 100:
            print(f"⚠ Total percentage exceeds 100%: {total_percentage}")
            return jsonify({
                "error": f"Total percentage exceeds 100% (current: {total_percentage}%)",
                "total_percentage": total_percentage
            }), 400

        for assignment in validated_assignments:
            existing = ProjectAssignment.query.filter_by(
                user_id=assignment['user_id'],
                project_id=project_id
            ).first()

            if existing:
                print(f"✏ Updating existing assignment for {assignment['user_id']}")
                existing.allocated_percentage = assignment['allocated_percentage']
                existing.allocated_hours = assignment['allocated_hours']
                existing.billing_rate = assignment['billing_rate']
                existing.cost = assignment['cost']
                existing.start_date = assignment['start_date']
                existing.end_date = assignment['end_date']
            else:
                print(f"➕ Creating new assignment for {assignment['user_id']}")
                new_assignment = ProjectAssignment(**assignment)
                db.session.add(new_assignment)

            # Link to project_assignees if not already linked
            assignee_exists = db.session.execute(
                db.select(project_assignees).where(
                    project_assignees.c.project_id == project_id,
                    project_assignees.c.user_id == assignment['user_id']
                )
            ).first()

            if not assignee_exists:
                print(f"📌 Linking user {assignment['user_id']} to project {project_id} in project_assignees")
                db.session.execute(
                    project_assignees.insert().values(
                        project_id=project_id,
                        user_id=assignment['user_id']
                    )
                )

        db.session.commit()
        print("✅ Assignments committed to DB")

        return jsonify({
            "message": "Tasks assigned successfully",
            "allocations": allocations,
            "total_percentage": total_percentage
        }), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        print(f"❌ Database error: {str(e)}")
        return jsonify({"error": "Database operation failed"}), 500

    except Exception as e:
        db.session.rollback()
        print(f"❗ Unexpected error: {str(e)}")
        return jsonify({"error": "An unexpected error occurred"}), 500


@app.route('/api/projects/<int:project_id>/assignees/<eid>', methods=['DELETE'])
@jwt_required()
def remove_task_assignment(project_id, eid):
    try:
        print(f"🗑 Removing assignment: project_id={project_id}, eid={eid}")

        user = User.query.filter_by(eid=eid).first()
        if not user:
            return jsonify({"error": "User not found"}), 404

        # Delete from ProjectAssignment table
        assignment = ProjectAssignment.query.filter_by(
            project_id=project_id,
            user_id=user.id
        ).first()

        if assignment:
            db.session.delete(assignment)
            print(f"🗑 Deleted from ProjectAssignment for user_id={user.id}")

        # Remove from project_assignees join table
        db.session.execute(
            project_assignees.delete().where(
                project_assignees.c.project_id == project_id,
                project_assignees.c.user_id == user.id
            )
        )
        print(f"🧹 Removed from project_assignees for user_id={user.id}")

        db.session.commit()
        print("✅ Assignment and assignee link deleted")
        return jsonify({"message": "Assignment removed successfully"}), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        print(f"❌ DB error: {str(e)}")
        return jsonify({"error": "Failed to remove assignment"}), 500

    except Exception as e:
        db.session.rollback()
        print(f"❗ Unexpected error: {str(e)}")
        return jsonify({"error": "Unexpected error"}), 500



# ------------------ HELPERS ------------------


def log_activity(entity_type, entity_name, action):
    try:
        new_log = ActivityLog(
            type=entity_type,
            name=entity_name,
            action=action,
            timestamp=datetime.utcnow()
        )
        db.session.add(new_log)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"Failed to log activity: {str(e)}")


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
        "createdAt": u.createdAt.isoformat() if u.createdAt else None,
        "updatedAt": u.updatedAt.isoformat() if u.updatedAt else None
    }
# ------------------ AUTH ------------------

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(email=data.get("email")).first()
    if not user or not check_password_hash(user.password, data.get("password")):
        return jsonify({"error": "Invalid email or password"}), 401
    token = generate_token(user)
    return jsonify({
        "message": "Login successful",
        "user": user_to_json(user),
        "token": token  
    })

@app.route('/api/admin/signup', methods=['POST'])
def admin_signup():
    try:
        data = request.get_json()
        print("Received data:", data)

        fname = data.get("name")
        email = data.get("email")
        password = data.get("password")
        role = data.get("role", "admin")

        if not fname or not email or not password:
            print("Missing fields")
            return jsonify({"error": "All fields are required"}), 400

        # Check if user already exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({"error": "User already exists"}), 400

        # Hash the password
        hashed_pw = generate_password_hash(data["password"])

        # Create user
        new_user = User(
            fname=fname,
            email=email,
            password=hashed_pw,
            role=role
        )

        db.session.add(new_user)
        db.session.commit()

        return jsonify({"message": "Admin created successfully"}), 201

    except Exception as e:
        print("Error in admin signup route:", str(e))
        return jsonify({"error": "Internal server error"}), 500

# ------------------ USER ROUTES ------------------

# GET all employees, POST new employee
@app.route('/api/employees', methods=['GET', 'POST'])
@jwt_required()
def employees():
    if request.method == 'GET':
        return get_users()
    elif request.method == 'POST':
        return create_user()

# PUT to update employee, DELETE to remove
@app.route('/api/employees/<eid>', methods=['PUT', 'DELETE'])
@jwt_required()
def employee_by_id(eid):
    if request.method == 'PUT':
        return update_user(eid)
    elif request.method == 'DELETE':
        return delete_user(eid)

@app.route('/api/search/users', methods=['GET'])
@jwt_required()
def search_users():
    query = request.args.get('q', '').strip().lower()
    if not query:
        return jsonify([])

    results = User.query.filter(
        db.or_(
            db.func.lower(User.fname).like(f'%{query}%'),
            db.func.lower(User.lname).like(f'%{query}%'),
            db.func.lower(User.email).like(f'%{query}%'),
            db.func.lower(User.eid).like(f'%{query}%')
        )
    ).all()

    return jsonify([user_to_json(u) for u in results])


@app.route('/api/users', methods=['POST'])
@jwt_required()
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
    log_activity("Employee", f"{user.fname} {user.lname}", "created")
    return jsonify({"message": "User created", "user": user_to_json(user)}), 201

@app.route('/api/users', methods=['GET'])
@jwt_required()
def get_users():
    allowed_roles = ["employee", "admin","department_manager"]  # customize as needed
    users = User.query.filter(User.role.in_(allowed_roles)).all()
    return jsonify([user_to_json(u) for u in users])
def get_users_dept():
    allowed_roles = ["employee","department_manager"]  # customize as needed
    users = User.query.filter(User.role.in_(allowed_roles)).all()
    return jsonify([user_to_json(u) for u in users])



@app.route('/api/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Check if user is a department manager
    is_manager = Department.query.filter_by(managerId=user.eid).first()
    if is_manager:
        return jsonify({"error": f"Cannot delete employee '{user.fname} {user.lname}' as they are managing department '{is_manager.name}'."}), 400

    try:
        # Step 1: Remove from project_assignees table
        db.session.execute(
            project_assignees.delete().where(project_assignees.c.user_id == user_id)
        )

        # Step 2: Log the action
        log_activity("Employee", f"{user.fname} {user.lname}", "deleted")

        # Step 3: Delete the user
        db.session.delete(user)
        db.session.commit()

        return jsonify({"message": "User deleted"}), 200

    except Exception as e:
        db.session.rollback()
        print("Error deleting user:", str(e))
        return jsonify({"error": "Internal server error"}), 500


@app.route('/api/users/<int:user_id>/status', methods=['PUT'])
@jwt_required()
def update_user_status(user_id):
    data = request.json
    new_status = data.get('status')

    if new_status not in ['active', 'inactive']:
        return jsonify({'error': 'Invalid status'}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    user.status = new_status
    db.session.commit()

    return jsonify({'message': 'Status updated'})



@app.route('/api/users/<eid>', methods=['PUT'])
@jwt_required() 
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
    log_activity("Employee", f"{user.fname} {user.lname}", "updated")
    return jsonify({"message": "User updated", "user": user_to_json(user)}), 200


# ------------------ ORGANISATIONS ------------------

@app.route('/api/organisations', methods=['POST'])
@jwt_required()
def create_organisation():
    data = request.json
    if Organisation.query.filter_by(oid=data["oid"]).first():
        return jsonify({"error": "Organisation already exists"}), 409
    org = Organisation(oid=data["oid"], name=data["name"])
    db.session.add(org)
    db.session.commit()
    log_activity("Organisation", org.name, "created")
    return jsonify({
        "message": "Organisation created",
        "organisation": {"oid": org.oid, "name": org.name}
    }), 201

@app.route('/api/organisations', methods=['GET'])
@jwt_required()
def get_organisations():
    orgs = Organisation.query.all()
    return jsonify([
        {
            "id": o.id,
            "oid": o.oid,
            "name": o.name,
            "createdAt": o.createdAt.isoformat() if o.createdAt else None,
            "updatedAt": o.updatedAt.isoformat() if o.updatedAt else None
        }
        for o in orgs
    ])

@app.route('/api/organisations/<oid>', methods=['DELETE'])
@jwt_required()
def delete_organisation(oid):
    org = Organisation.query.filter_by(oid=oid).first()
    if not org:
        return jsonify({"error": "Organisation not found"}), 404
    Department.query.filter_by(oid=oid).delete()
    db.session.delete(org)
    db.session.commit()
    log_activity("Organisation", org.name, "deleted")
    return jsonify({"message": "Organisation and related departments deleted"}), 200

@app.route('/api/organisation-name', methods=['GET'])
@jwt_required()
def get_organisation_name():
    print("🔍 Incoming request to /api/organisation-name")
    try:
        org = Organisation.query.first()
        if not org:
            print("⚠️ No organisation found in database.")
            return jsonify({"error": "No organisation found"}), 404
        print(f"✅ Organisation found: {org.name}")
        return jsonify({"name": org.name}), 200
    except Exception as e:
        print(f"❌ Exception occurred: {e}")
        return jsonify({"error": str(e)}), 500


# ------------------ DEPARTMENTS ------------------
# For Department table manager id
@app.route('/api/employees/dept', methods=['GET', 'POST'])
@jwt_required()
def employees_dept():
    if request.method == 'GET':
        return get_users_dept()
    elif request.method == 'POST':
        return create_user()


@app.route('/api/departments', methods=['POST'])
@jwt_required()
def create_department():
    data = request.json

    # Backward compatibility: support both managerId and managerIds
    manager_ids = data.get("managerIds") or []
    if not manager_ids and data.get("managerId"):
        manager_ids = [data.get("managerId")]

    # Only convert non-empty lists into comma-separated strings, else None
    manager_ids_csv = ','.join(manager_ids) if manager_ids else None
    primary_manager = manager_ids[0] if manager_ids else None

    # Create the department (no manager required)
    dept = Department(
        did=data.get("did"),
        name=data.get("name"),
        oid=data.get("oid"),
        managerId=primary_manager,
        managerIds=manager_ids_csv
    )
    db.session.add(dept)

    # Update roles for valid managers, if any
    for eid in manager_ids:
        manager = User.query.filter_by(eid=eid).first()
        if manager:
            manager.role = "department_manager"
        else:
            return jsonify({"error": f"Manager '{eid}' not found"}), 404

    try:
        db.session.commit()
        log_activity("Department", dept.name, "created")
        return jsonify({"message": "Department created"}), 201
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({"error": "Database error", "details": str(e)}), 500


@app.route('/api/departments', methods=['GET'])
@jwt_required()
def get_departments():
    depts = Department.query.all()
    dept_list = []
    
    for d in depts:
        # Handle both old single managerId and new multiple managerIds
        manager_ids = []
        if hasattr(d, 'managerIds') and d.managerIds:
            manager_ids = d.managerIds.split(',')
        elif d.managerId:
            manager_ids = [d.managerId]
        
        dept_data = {
            "id": d.id,
            "did": d.did,
            "name": d.name,
            "oid": d.oid,
            "managerId": d.managerId,  # Keep for backward compatibility
            "managerIds": manager_ids,  # New field for multiple managers
            "createdAt": d.createdAt.isoformat() if d.createdAt else None,
            "updatedAt": d.updatedAt.isoformat() if d.updatedAt else None
        }
        dept_list.append(dept_data)
    
    return jsonify(dept_list)


@app.route('/api/departments/<did>', methods=['PUT'])
@jwt_required()
def update_department(did):
    print(f"🔄 /api/departments/{did} PUT route hit")
    
    dept = Department.query.filter_by(did=did).first()
    if not dept:
        return jsonify({"error": "Department not found"}), 404

    data = request.json
    print("📥 Update Data:", data)

    # Get old manager IDs for role reversion
    old_manager_ids = []
    if hasattr(dept, 'managerIds') and dept.managerIds:
        old_manager_ids = dept.managerIds.split(',')
    elif dept.managerId:
        old_manager_ids = [dept.managerId]

    # Handle both single managerId (backward compatibility) and multiple managerIds
    new_manager_ids = data.get("managerIds", [])
    if not new_manager_ids and data.get("managerId"):
        # Backward compatibility: convert single managerId to array
        new_manager_ids = [data.get("managerId")]

    if not new_manager_ids:
        print("❌ No managers specified")
        return jsonify({"error": "At least one manager is required"}), 400

    # Validate all new manager IDs exist
    invalid_managers = []
    valid_new_managers = []
    
    for manager_id in new_manager_ids:
        manager = User.query.filter_by(eid=manager_id).first()
        if manager:
            valid_new_managers.append(manager)
        else:
            invalid_managers.append(manager_id)
    
    if invalid_managers:
        print(f"❌ Invalid manager IDs: {invalid_managers}")
        return jsonify({"error": f"Manager users not found: {', '.join(invalid_managers)}"}), 404

    # Update department fields
    dept.name = data.get("name", dept.name)
    dept.oid = data.get("oid", dept.oid)
    dept.managerId = new_manager_ids[0]  # Primary manager for backward compatibility
    dept.managerIds = ','.join(new_manager_ids)  # All managers

    # Handle role changes
    # First, revert old managers who are no longer managers of this department
    managers_to_remove = set(old_manager_ids) - set(new_manager_ids)
    for manager_id in managers_to_remove:
        manager = User.query.filter_by(eid=manager_id).first()
        if manager:
            # Check if they still manage other departments
            still_managing = Department.query.filter(
                Department.did != did,
                Department.managerIds.like(f'%{manager_id}%')
            ).first()
            
            if not still_managing:
                manager.role = "employee"
                print(f"🔄 Reverted {manager.eid}'s role back to employee")

    # Update new managers' roles
    for manager in valid_new_managers:
        manager.role = "department_manager"
        print(f"👤 Manager role updated: {manager.eid}")

    try:
        db.session.commit()
        print("✅ Department updated successfully")
        log_activity("Department", dept.name, "updated")
        
        # Return updated department data
        return jsonify({
            "id": dept.id,
            "did": dept.did,
            "name": dept.name,
            "oid": dept.oid,
            "managerId": dept.managerId,
            "managerIds": new_manager_ids,
            "createdAt": dept.createdAt.isoformat() if dept.createdAt else None,
            "updatedAt": dept.updatedAt.isoformat() if dept.updatedAt else None
        }), 200
        
    except SQLAlchemyError as e:
        db.session.rollback()
        print("💥 Database error:", str(e))
        return jsonify({"error": "Database error", "details": str(e)}), 500


@app.route('/api/departments/<did>', methods=['DELETE'])
@jwt_required()
def delete_department(did):
    dept = Department.query.filter_by(did=did).first()
    if not dept:
        return jsonify({"error": "Department not found"}), 404

    employees_exist = User.query.filter_by(did=dept.name).first()
    if employees_exist:
        return jsonify({"error": "Cannot delete department with assigned employees"}), 400

    # Check for assigned projects
    projects_exist = Project.query.filter_by(departmentId=did).first()
    if projects_exist:
        return jsonify({"error": "Cannot delete department with existing projects"}), 400

    # Get all manager IDs for role reversion
    manager_ids_to_check = []
    if hasattr(dept, 'managerIds') and dept.managerIds:
        manager_ids_to_check = dept.managerIds.split(',')
    elif dept.managerId:
        manager_ids_to_check = [dept.managerId]

    db.session.delete(dept)
    db.session.commit()

    # Revert manager roles if they no longer manage any departments
    for manager_id in manager_ids_to_check:
        manager = User.query.filter_by(eid=manager_id).first()
        if manager:
            # Check if they still manage other departments
            still_managing = Department.query.filter(
                Department.managerIds.like(f'%{manager_id}%')
            ).first()
            
            if not still_managing:
                manager.role = "employee"
                db.session.commit()
                print(f"🔄 Reverted {manager.eid}'s role back to employee")

    log_activity("Department", dept.name, "deleted")
    return jsonify({"message": "Department deleted successfully"}), 200
# ------------------ PROJECTS ------------------

@app.route('/api/projects', methods=['POST'])
@jwt_required() 
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
    log_activity("Project", project.name, "created")
    return jsonify({"message": "Project created"}), 201

@app.route('/api/projects', methods=['GET'])
@jwt_required()
def get_projects():
    projects = Project.query.all()
    return jsonify([{
        "id": p.id,
        "name": p.name,
        "departmentId": p.departmentId,
        "startDate": p.startDate.strftime('%Y-%m-%d'),
        "endDate": p.endDate.strftime('%Y-%m-%d'),
        "budget": p.budget,
        "createdAt": p.createdAt.isoformat() if p.createdAt else None,
        "updatedAt": p.updatedAt.isoformat() if p.updatedAt else None
    } for p in projects])

@app.route('/api/projects/<int:project_id>', methods=['DELETE'])
@jwt_required()
def delete_project(project_id):
    proj = Project.query.get(project_id)
    if not proj:
        return jsonify({"error": "Project not found"}), 404
    db.session.delete(proj)
    db.session.commit()
    log_activity("Project", proj.name, "deleted")
    return jsonify({"message": "Project deleted"}), 200

@app.route('/api/projects/<int:project_id>', methods=['PUT'])
@jwt_required()
def update_project(project_id):
    data = request.json
    project = Project.query.get_or_404(project_id)

    project.name = data.get('name', project.name)
    project.departmentId = data.get('departmentId', project.departmentId)
    project.startDate = datetime.strptime(data['startDate'], '%Y-%m-%d')
    project.endDate = datetime.strptime(data['endDate'], '%Y-%m-%d')
    project.budget = float(data['budget'])

    db.session.commit()
    log_activity("Project", project.name, "updated")
    return jsonify({
        'id': project.id,
        'name': project.name,
        'departmentId': project.departmentId,
        'startDate': project.startDate.strftime('%Y-%m-%d'),
        'endDate': project.endDate.strftime('%Y-%m-%d'),
        'budget': project.budget
    }), 200

@app.route('/api/project-budgets', methods=['GET'])
@jwt_required()
def get_project_budgets():
    projects = Project.query.with_entities(Project.name, Project.budget).all()
    result = [{"name": name, "budget": budget} for name, budget in projects]
    return jsonify(result), 200

@app.route('/api/projects/<int:project_id>/total-cost', methods=['GET'])
@jwt_required()
def get_project_total_cost(project_id):
    total_cost = db.session.query(db.func.sum(ProjectAssignment.cost))\
        .filter_by(project_id=project_id).scalar()

    return jsonify({"totalCost": float(total_cost or 0)})


@app.route('/api/projects/upcoming-deadlines', methods=['GET'])
@jwt_required()
def get_upcoming_deadlines():
    today = datetime.today().date()
    upcoming = (
        Project.query
        .filter(Project.endDate >= today)
        .order_by(Project.endDate)
        .limit(5)
        .all()
    )
    result = [{
        "id": p.id,
        "name": p.name,
        "endDate": p.endDate.strftime('%Y-%m-%d')
    } for p in upcoming]

    return jsonify(result), 200

# ------------------ ASSIGNEES ROUTES ------------------
@app.route('/api/projects/<int:project_id>/assignees', methods=['GET'])
@jwt_required()
def get_assignees(project_id):
    result = db.session.query(
        User.eid,
        User.fname,
        User.lname,
        User.email,
        project_assignees.c.role,
        ProjectAssignment.allocated_hours,
        ProjectAssignment.billing_rate
    ).join(
        project_assignees,
        and_(
            project_assignees.c.user_id == User.id,
            project_assignees.c.project_id == project_id
        )
    ).join(
        ProjectAssignment,
        and_(
            ProjectAssignment.user_id == User.id,
            ProjectAssignment.project_id == project_id
        ),
        isouter=True  # Just in case not every assignee has an assignment row
    ).all()

    assignees = []
    for eid, fname, lname, email, role, hours, rate in result:
        cost = round((hours or 0) * (rate or 0), 2)
        assignees.append({
            'eid': eid,
            'fname': fname,
            'lname': lname,
            'email': email,
            'role': role,
            'cost': cost
        })
    
    return jsonify(assignees)






@app.route('/api/projects/<int:project_id>/assignees', methods=['POST'])
@jwt_required()
def add_assignee(project_id):
    data = request.json
    eid = data.get("eid")
    role = data.get("role", "").strip()

    if not eid or not role:
        return jsonify({"error": "EID and role required"}), 400

    # Fetch project & user
    project = db.session.get(Project, project_id)
    user = User.query.filter_by(eid=eid).first()
    if not project or not user:
        return jsonify({"error": "Project or user not found"}), 404

    # Prevent duplicate assignment
    exists = db.session.execute(
        project_assignees.select().where(
            and_(
                project_assignees.c.project_id == project_id,
                project_assignees.c.user_id == user.id
            )
        )
    ).first()
    if exists:
        return jsonify({"error": "Employee already assigned"}), 409

    # 🔒 Enforce single Project Manager
    if role == "Project Manager":
        pm_exists = db.session.execute(
            project_assignees.select().where(
                and_(
                    project_assignees.c.project_id == project_id,
                    project_assignees.c.role == "Project Manager"
                )
            )
        ).first()
        if pm_exists:
            return jsonify({"error": "This project already has a Project Manager"}), 409

    # Insert with role
    db.session.execute(
        project_assignees.insert().values({
            "project_id": project_id,
            "user_id": user.id,
            "role": role
        })
    )
    db.session.commit()
    return jsonify({"message": "Assignee added with role"}), 200

@app.route('/api/projects/<int:project_id>/assignees/<eid>', methods=['DELETE'])
@jwt_required()
def remove_assignee(project_id, eid):
    user = User.query.filter_by(eid=eid).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    result = db.session.execute(
        project_assignees.delete().where(
            and_(
                project_assignees.c.project_id == project_id,
                project_assignees.c.user_eid == user.eid
            )
        )
    )

    if result.rowcount == 0:
        return jsonify({"error": "Assignee not found in project"}), 404

    db.session.commit()
    return jsonify({"message": "Assignee removed"}), 200



# ------------------ RECENT ACTIVITY ------------------
@app.route("/api/recent-activities", methods=["GET"])
@jwt_required()
def get_recent_activities():
    activities = ActivityLog.query.order_by(ActivityLog.timestamp.desc()).limit(10).all()
    result = [
        {
            "entity": a.type,
            "user": a.name,
            "action": a.action,
            "timestamp": a.timestamp.isoformat()
        }
        for a in activities
    ]
    return jsonify(result), 200

@app.route('/api/user-info', methods=['GET'])
@jwt_required()
def user_info():
    user_id = get_jwt_identity()
    user = get_user_by_id(user_id)
    if user:
        return jsonify({
            "userName": user['name']  # or user.username depending on schema
        }), 200
    else:
        return jsonify({"error": "User not found"}), 404


# ------------------ MAIN ------------------

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
