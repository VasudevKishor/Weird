import React, { useState, useEffect } from 'react';
import './EmployeeDirectory.css';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import axios from 'axios';
import ModalWrapper from './ModalWrapper';

const initialForm = { eid: '', fname: '', lname: '', email: '', did: '', password: '' };

const EmployeeDirectory = () => {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formMode, setFormMode] = useState('add'); // "add" or "edit"
  const [form, setForm] = useState(initialForm);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    const load = async () => {
      await fetchEmployees();
    };
    load();
  }, []);


  const fetchEmployees = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/employees');
      setEmployees(res.data);
    } catch (e) {
      console.error('Failed to fetch employees', e);
    }
  };

  const openAdd = () => {
    setForm(initialForm);
    setFormMode('add');
    setSelectedId(null);
    setShowModal(true);
  };

  const openEdit = emp => {
    setForm({ eid: emp.eid, fname: emp.fname, lname: emp.lname, email: emp.email, did: emp.did, password: '' });
    setFormMode('edit');
    setSelectedId(emp.eid);
    setShowModal(true);
  };

  const close = () => setShowModal(false);

  const handleChange = e => { setForm(prev => ({ ...prev, [e.target.name]: e.target.value })); };

  const handleSubmit = async e => {
    e.preventDefault();
    const { eid, fname, lname, email, did, password } = form;
    if (!eid || !fname || !lname || !email || !did || (formMode === 'add' && !password)) {
      return alert('All fields required, and password for new employee');
    }
    try {
      if (formMode === 'add') {
        await axios.post('http://localhost:5000/api/employees', form);
        alert('Emplaoyee added successfully');
      } else {
        await axios.put(`http://localhost:5000/api/employees/${selectedId}`, form);
        alert('Emplaoyee updated successfully');
      }
      close();
      fetchEmployees();
    } catch (err) {
      console.error('Submit error', err.response?.data || err);
      alert(err.response?.data?.error || 'Error submitting employee');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete employee?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/users/${id}`);
      fetchEmployees();
    } catch (e) {
      console.error('Delete error', e.response?.data || e);
      alert('Error deleting employee');
    }
  };

  const filtered = employees.filter(emp =>
    `${emp.fname} ${emp.lname}`.toLowerCase().includes(search.toLowerCase())
  );


  return (
    <div className="employee-table-container">
      <div className="table-header">
        <h2>Employee Directory</h2>
        <div className="controls">
          <input
            type="text"
            className="search-bar"
            placeholder="Search employee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="add-btn" onClick={openAdd}><FaPlus /> Add Employee</button>
        </div>
      </div>
      <table className="employee-table">
        <thead>
          <tr>
            <th>Employee ID</th><th>Name</th><th>Email</th><th>Department</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(emp => (
            <tr key={emp._id || emp.eid}>
              <td>{emp.eid}</td>
              <td>{emp.fname} {emp.lname}</td>
              <td>{emp.email}</td>
              <td>{emp.did}</td>
              <td>
                <FaEdit onClick={() => openEdit(emp)} className="icon edit-icon" />
                <FaTrash onClick={() => handleDelete(emp.id || emp._id)} className="icon delete-icon" />
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr><td colSpan="5">No employees found.</td></tr>
          )}
        </tbody>

      </table>

      {showModal && (
        <ModalWrapper
          onClose={close}
          title={formMode === 'add' ? 'Add Employee' : 'Edit Employee'}
        >
          <form className="modal-form" onSubmit={handleSubmit}>
            <input
              name="eid"
              placeholder="Employee ID"
              value={form.eid}
              onChange={handleChange}
              disabled={formMode === 'edit'}
            />
            <input
              name="fname"
              placeholder="First Name"
              value={form.fname}
              onChange={handleChange}
            />
            <input
              name="lname"
              placeholder="Last Name"
              value={form.lname}
              onChange={handleChange}
            />
            <input
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
            />
            <input
              name="did"
              placeholder="Department ID"
              value={form.did}
              onChange={handleChange}
            />
            {formMode === 'add' && (
              <input
                name="password"
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
              />
            )}
            <button type="submit">{formMode === 'add' ? 'Add' : 'Update'}</button>
          </form>
        </ModalWrapper>
      )}
    </div>
  );
};

export default EmployeeDirectory;
