import React, { useState, useEffect } from 'react';
import './EmployeeDirectory.css';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import axios from 'axios';
import ModalWrapper from './ModalWrapper';
import { useNavigate } from 'react-router-dom';
import ProjectAssignee from './ProjectAssignees';

const API = process.env.REACT_APP_API_BASE_URL;

const ProjectDirectory = () => {
  const [projects, setProjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formMode, setFormMode] = useState('add'); // 'add' or 'edit'
  const [form, setForm] = useState({
    name: '',
    departmentId: '',
    startDate: '',
    endDate: '',
    budget: ''
  });
  const [editId, setEditId] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [showAssigneesModal, setShowAssigneesModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectCosts, setProjectCosts] = useState({});



  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (projects.length > 0) {
      fetchProjectCosts();
    }
  }, [projects]);

  const fetchProjectCosts = async () => {
    const costs = {};
    try {
      for (const proj of projects) {
        const res = await axios.get(`${API}/api/projects/${proj.id}/total-cost`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        costs[proj.id] = res.data.totalCost;
      }
      setProjectCosts(costs);
    } catch (err) {
      console.error('Failed to fetch project costs', err);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await axios.get(`${API}/api/projects`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setProjects(res.data);
    } catch (err) {
      console.error('Failed to fetch projects', err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await axios.get(`${API}/api/departments`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setDepartments(res.data);
    } catch (err) {
      console.error('Failed to load departments', err);
    }
  };

  const openAddModal = () => {
    setForm({ name: '', departmentId: '', startDate: '', endDate: '', budget: '' });
    setFormMode('add');
    setEditId(null);
    setFormErrors({});
    setGeneralError('');
    setShowModal(true);
  };

  const openEditModal = (project) => {
    setForm({
      name: project.name || '',
      departmentId: project.departmentId || '',
      startDate: project.startDate?.substring(0, 10) || '',
      endDate: project.endDate?.substring(0, 10) || '',
      budget: project.budget?.toString() || ''
    });
    setFormMode('edit');
    setEditId(project.id);
    setFormErrors({});
    setGeneralError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormErrors({});
    setGeneralError('');
  };

  const validateField = (name, value) => {
    let errorMsg = '';
    const trimmed = value.trim();

    switch (name) {
      case 'name':
        if (!trimmed) errorMsg = 'Project name is required.';
        else if (trimmed.length < 3 || trimmed.length > 30)
          errorMsg = 'Must be 3–30 characters.';
        else if (!/^[A-Za-z\s]+$/.test(trimmed))
          errorMsg = 'Only letters and spaces allowed.';
        break;

      case 'departmentId':
        if (!trimmed) errorMsg = 'Department ID is required.';
        else if (!departments.some(dep => dep.did === trimmed))
          errorMsg = 'Invalid department ID.';
        break;

      case 'startDate':
        if (!trimmed) errorMsg = 'Start date is required.';
        else {
          const start = new Date(trimmed);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (start < today) errorMsg = 'Start date cannot be in the past.';
        }
        break;

      case 'endDate':
        if (!trimmed) errorMsg = 'End date is required.';
        else {
          const start = new Date(form.startDate);
          const end = new Date(trimmed);
          if (start >= end) errorMsg = 'End date must be after start date.';
        }
        break;

      case 'budget':
        const num = parseFloat(trimmed);
        if (!trimmed) errorMsg = 'Budget is required.';
        else if (isNaN(num) || num <= 0) errorMsg = 'Budget must be a positive number.';
        else if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) errorMsg = 'Up to 2 decimal places only.';
        break;

      default:
        break;
    }

    return errorMsg;
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    const errorMsg = validateField(name, value);
    setFormErrors(prev => ({ ...prev, [name]: errorMsg }));
    if (generalError) setGeneralError('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setGeneralError('');
    setFormErrors({});

    const newErrors = {};
    for (const key in form) {
      const error = validateField(key, form[key]);
      if (error) newErrors[key] = error;
    }

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      setGeneralError('Please correct the errors in the form.');
      return;
    }

    try {
      if (formMode === 'add') {
        const res = await axios.post(`${API}/api/projects`, form, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setProjects(prev => [...prev, res.data]);
        alert('Project added successfully');
      } else {
        const res = await axios.put(`${API}/api/projects/${editId}`, form, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setProjects(prev => prev.map(p => p.id === editId ? res.data : p));
        alert('Project updated successfully');
      }
      closeModal();
      fetchProjects();
    } catch (err) {
      console.error('Error submitting project', err);
      const errorMsg = err.response?.data?.error || 'Error submitting project';
      setGeneralError(errorMsg);
    }
  };


  const handleAssigneesClick = (project) => {
    setSelectedProject(project);
    setShowAssigneesModal(true);
  };



  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project?')) return;
    try {
      await axios.delete(`${API}/api/projects/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setProjects(prev => prev.filter(p => p._id !== id));
      alert('Project deleted');
      fetchProjects();
    } catch (err) {
      console.error('Error deleting project', err);
      alert('Error deleting project. Check console.');
    }
  };

  const convertToIST = (isoString) => {
    if (!isoString) return '-';
    const utcDate = new Date(isoString);

    const istOffset = 5.5 * 60;
    const istTime = new Date(utcDate.getTime() + istOffset * 60 * 1000);

    return istTime.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour12: true,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const filteredProjects = projects.filter(p =>
    (p.name || '').toLowerCase().includes(search.toLowerCase())
  );


  return (
    <div className="employee-table-container">
      <div className="table-header">
        <h2>Project Details</h2>
        <div className="controls">
          <input
            type="text"
            className="search-bar"
            placeholder="Search project..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button className="add-btn" onClick={openAddModal}>
            <FaPlus /> Add Project
          </button>
        </div>
      </div>

      <table className="employee-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Department ID</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Budget ($)</th>
            <th>Total Cost ($)</th>
            <th>Actions</th>
            <th>Assign</th>
          </tr>
        </thead>
        <tbody>
          {filteredProjects.map(proj => (
            <tr key={proj.id}>
              <td>{proj.name}</td>
              <td>{proj.departmentId}</td>
              <td>{proj.startDate ? proj.startDate.substring(0, 10) : '—'}</td>
              <td>{proj.endDate ? proj.endDate.substring(0, 10) : '—'}</td>
              <td>{proj.budget}</td>
              <td>{projectCosts[proj.id] || 0}</td>
              <td>
                <FaEdit className="icon edit-icon" onClick={() => openEditModal(proj)} />
                <FaTrash className="icon delete-icon" onClick={() => handleDelete(proj.id)} />
              </td>
              <td><button
                className="assignees-btn"
                onClick={() => handleAssigneesClick(proj)}
                title="Manage Assignees"
              >
                Assign
              </button></td>
            </tr>
          ))}
          {filteredProjects.length === 0 && (
            <tr>
              <td colSpan="6" className="no-data">No matching projects found.</td>
            </tr>
          )}
        </tbody>
      </table>

      {showModal && (
        <ModalWrapper
          onClose={() => setShowModal(false)}
          title={formMode === 'add' ? 'Add Project' : 'Edit Project'}
        >
          <form onSubmit={handleSubmit} className="modal-form">
            {generalError && (
              <div
                className="form-error"
                style={{
                  backgroundColor: '#fee',
                  color: '#c33',
                  padding: '10px',
                  borderRadius: '4px',
                  marginBottom: '15px',
                  border: '1px solid #fcc',
                }}
              >
                {generalError}
              </div>
            )}

            <div className="floating-label">
              <input
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder=" "
                required
                style={formErrors.name ? { borderColor: '#c33' } : {}}
              />
              <label>Project Name</label>
              {formErrors.name && (
                <div className="field-error">{formErrors.name}</div>
              )}
            </div>

            <div className="floating-label">
              <input
                name="departmentId"
                type="text"
                value={form.departmentId}
                onChange={handleChange}
                placeholder=" "
                required
                style={formErrors.departmentId ? { borderColor: '#c33' } : {}}
              />
              <label>Department ID</label>
              {formErrors.departmentId && (
                <div className="field-error">{formErrors.departmentId}</div>
              )}
            </div>

            <div className="floating-label">
              <input
                type="date"
                name="startDate"
                value={form.startDate}
                onChange={handleChange}
                placeholder=" "
                required
                style={formErrors.startDate ? { borderColor: '#c33' } : {}}
              />
              <label>Start Date</label>
              {formErrors.startDate && (
                <div className="field-error">{formErrors.startDate}</div>
              )}
            </div>

            <div className="floating-label">
              <input
                type="date"
                name="endDate"
                value={form.endDate}
                onChange={handleChange}
                placeholder=" "
                required
                style={formErrors.endDate ? { borderColor: '#c33' } : {}}
              />
              <label>End Date</label>
              {formErrors.endDate && (
                <div className="field-error">{formErrors.endDate}</div>
              )}
            </div>

            <div className="floating-label">
              <input
                name="budget"
                type="number"
                value={form.budget}
                onChange={handleChange}
                placeholder=" "
                required
                style={formErrors.budget ? { borderColor: '#c33' } : {}}
              />
              <label>Budget</label>
              {formErrors.budget && (
                <div className="field-error">{formErrors.budget}</div>
              )}
            </div>

            <button type="submit">{formMode === 'add' ? 'Add' : 'Update'}</button>
          </form>

        </ModalWrapper>
      )}

      {showAssigneesModal && selectedProject && (
        <ModalWrapper
          title={`Assign Users to "${selectedProject.name}"`}
          onClose={() => {
            setShowAssigneesModal(false);
            setSelectedProject(null);
          }}
        >
          <ProjectAssignee
            projectId={selectedProject.id}
            projectName={selectedProject.name}
            onClose={() => {
              setShowAssigneesModal(false);
              setSelectedProject(null);
            }}
          />
        </ModalWrapper>
      )}

    </div>
  );
};

export default ProjectDirectory;
