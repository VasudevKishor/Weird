import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './styles/ManageUsers.css';

const API = process.env.REACT_APP_API_BASE_URL;

const ManageUsers = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone:'',
    joinDate: '',
    role: 'employee'
  });
  const [deleteEmail, setDeleteEmail] = useState('');

  const roles = ['admin', 'department_manager', 'project_manager', 'financial_analyst', 'employee'];

  const handleAdd = async () => {
    try {
      await axios.post(`${API}/api/users`, form);
      alert("User added.");
      setForm({ name: '', email: '', password: '', role: 'employee' });
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add user');
    }
  };

  const handleDelete = async () => {
    try {
      const res = await axios.get(`${API}/api/users`);
      const user = res.data.find(u => u.email === deleteEmail);
      if (user) {
        await axios.delete(`${API}/api/users/${user._id}`);
        alert("User deleted.");
        setDeleteEmail('');
      } else {
        alert("User not found.");
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete user');
    }
  };

  return (
    <div className="UserManagementContainer">
      <h2>Manage Users</h2>

      <div className="card">
        <h3>Create User</h3>
        <input
          placeholder="Name"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
        />
        <input
          placeholder="Email"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
        />
        <input
          placeholder="Password"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
        />
        <input
          placeholder="Phone"
          value={form.phone}
          onChange={e => setForm({ ...form, phone: e.target.value })}
        />
        <input
          placeholder="joinDate"
          value={form.joinDate}
          onChange={e => setForm({ ...form, joinDate: e.target.value })}
        />
        <select
          value={form.role}
          onChange={e => setForm({ ...form, role: e.target.value })}
        >
          {roles.map(role => <option key={role} value={role}>{role}</option>)}
        </select>
        <button onClick={handleAdd}>Add User</button>
      </div>

      <div className="card">
        <h3>Delete User (by Email)</h3>
        <input
          placeholder="Email"
          value={deleteEmail}
          onChange={e => setDeleteEmail(e.target.value)}
        />
        <button onClick={handleDelete}>Delete</button>
      </div>

      <button className="back-btn" onClick={() => navigate('/admin-dashboard')}>
        Back to Dashboard
      </button>
    </div>
  );
};

export default ManageUsers;
