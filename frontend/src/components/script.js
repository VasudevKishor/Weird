// Load employees
async function loadEmployees() {
  const res = await fetch("http://localhost:5000/api/employees");
  const employees = await res.json();
  const tbody = document.querySelector("#employeeTable tbody");
  tbody.innerHTML = "";
  employees.forEach(emp => {
    const row = `
      <tr>
        <td>${emp.name}</td>
        <td>${emp.department}</td>
        <td>${emp.active ? "Active" : "Inactive"}</td>
        <td>${emp.cost_history?.[0]?.salary || 0}</td>
        <td>${emp.cost_history?.[0]?.infra_cost || 0}</td>
        <td>${emp.cost_history?.[0]?.fy || ""}</td>
      </tr>
    `;
    tbody.innerHTML += row;
  });
}

loadEmployees();

// Save employee
async function saveEmployee() {
  const data = {
    name: document.getElementById("name").value,
    department: document.getElementById("department").value,
    salary: Number(document.getElementById("salary").value),
    infra_cost: Number(document.getElementById("infra_cost").value),
    fy: document.getElementById("fy").value,
    active: document.getElementById("active").value === "true"
  };

  const res = await fetch("http://localhost:5000/api/employees", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  if (res.ok) {
    alert("Employee added successfully");
    document.getElementById("addEmployeeForm").reset();
    const modal = bootstrap.Modal.getInstance(document.getElementById("addModal"));
    modal.hide();
    loadEmployees();
  } else {
    const err = await res.json();
    alert(err.error || "Failed to add employee");
  }
}
