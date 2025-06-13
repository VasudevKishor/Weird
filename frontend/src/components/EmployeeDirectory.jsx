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
  const [formMode, setFormMode] = useState('add');
  const [form, setForm] = useState(initialForm);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    fetchEmployees();
    return () => {}; // prevent "destroy is not a function" error
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
    setForm({
      eid: emp.eid,
      fname: emp.fname,
      lname: emp.lname,
      email: emp.email,
      did: emp.did,
      password: ''
    });
    setFormMode('edit');
    setSelectedId(emp._id);
    setShowModal(true);
  };

  const close = () => setShowModal(false);

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const { eid, fname, lname, email, did, password } = form;

    // Validation
    if (!eid || !fname || !lname || !email || !did || (formMode === 'add' && !password)) {
      return alert('All fields required, and password for new employee');
    }

    // Check for duplicate eid
    const eidExists = employees.some(emp =>
      emp.eid === eid && (formMode === 'add' || emp._id !== selectedId)
    );
    if (eidExists) {
      return alert('Employee ID already exists');
    }

    try {
      if (formMode === 'add') {
        await axios.post('http://localhost:5000/api/employees', form);
      } else {
        await axios.put(`http://localhost:5000/api/employees/${selectedId}`, form);
      }
      close();
      fetchEmployees();
    } catch (err) {
      console.error('Submit error', err.response?.data || err);
      alert(err.response?.data?.error || 'Error submitting employee');
    }
  };

  const handleDelete = async (_id) => {
  if (!window.confirm('Delete employee?')) return;
  try {
    await axios.delete(`http://localhost:5000/api/users/${_id}`);
    fetchEmployees();
  } catch (e) {
    console.error('Delete error', e.response?.data || e);
    alert(e.response?.data?.error || 'Error deleting employee');
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
            placeholder="Search employee..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button onClick={openAdd}><FaPlus /> Add Employee</button>
        </div>
      </div>
      <table className="employee-table">
        <thead>
          <tr>
            <th>Employee ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Department</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(emp => (
            <tr key={emp._id}>
              <td>{emp.eid}</td>
              <td>{emp.fname} {emp.lname}</td>
              <td>{emp.email}</td>
              <td>{emp.did}</td>
              <td>
                <FaEdit onClick={() => openEdit(emp)} className="icon edit-icon" />
                <FaTrash onClick={() => handleDelete(emp._id)} className="icon delete-icon" />
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan="5">No employees found.</td>
            </tr>
          )}
        </tbody>
      </table>

      {showModal && (
        <ModalWrapper onClose={close}>
          <form className="modal-form" onSubmit={handleSubmit}>
            <h3>{formMode === 'add' ? 'Add Employee' : 'Edit Employee'}</h3>
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
