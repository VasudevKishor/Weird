import React, { useState } from 'react';
import axios from 'axios';
import './styles/AdminDashboard.css';

const ManageUsers = ({ goBack }) => {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'employee' });
  const [deleteEmail, setDeleteEmail] = useState('');

  const roles = ['admin', 'department_manager', 'project_manager', 'financial_analyst', 'employee'];

  const handleAdd = async () => {
    await axios.post("http://localhost:5000/api/users", form);
    alert("User added.");
  };

  const handleDelete = async () => {
    const res = await axios.get("http://localhost:5000/api/users");
    const user = res.data.find(u => u.email === deleteEmail);
    if (user) {
      await axios.delete(`http://localhost:5000/api/users/${user._id}`);
      alert("User deleted.");
    } else {
      alert("User not found.");
    }
  };

  return (
    <div className="admin-dashboard">
      <h2>Manage Users</h2>

      <div className="card">
        <h3>Create User</h3>
        <input placeholder="Name" onChange={e => setForm({ ...form, name: e.target.value })} />
        <input placeholder="Email" onChange={e => setForm({ ...form, email: e.target.value })} />
        <input placeholder="Password" onChange={e => setForm({ ...form, password: e.target.value })} />
        <select onChange={e => setForm({ ...form, role: e.target.value })}>
          {roles.map(role => <option key={role} value={role}>{role}</option>)}
        </select>
        <button onClick={handleAdd}>Add User</button>
      </div>

      <div className="card">
        <h3>Delete User (by Email)</h3>
        <input placeholder="Email" onChange={e => setDeleteEmail(e.target.value)} />
        <button onClick={handleDelete}>Delete</button>
      </div>

      <button onClick={goBack}>Back to Dashboard</button>
    </div>
  );
};

export default ManageUsers;
