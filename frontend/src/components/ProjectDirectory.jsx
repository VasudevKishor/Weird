import React, { useState, useEffect } from 'react';
import './EmployeeDirectory.css';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import axios from 'axios';
import ModalWrapper from './ModalWrapper';
import { useNavigate } from 'react-router-dom';


const ProjectDirectory = () => {
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formMode, setFormMode] = useState('add'); // 'add' or 'edit'
  const [currentProject, setCurrentProject] = useState({
    name: '',
    departmentId: '',
    startDate: '',
    endDate: '',
    budget: ''
  });
  const [editId, setEditId] = useState(null);


  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/projects');
      setProjects(res.data);
    } catch (err) {
      console.error('Failed to fetch projects', err);
    }
  };

  const openAddModal = () => {
    setFormMode('add');
    setCurrentProject({
      name: '',
      departmentId: '',
      startDate: '',
      endDate: '',
      budget: ''
    });
    setEditId(null);
    setShowModal(true);
  };

  const openEditModal = (project) => {
    setFormMode('edit');
    setCurrentProject({
      name: project.name || '',
      departmentId: project.departmentId || '',
      startDate: project.startDate ? project.startDate.substring(0, 10) : '',
      endDate: project.endDate ? project.endDate.substring(0, 10) : '',
      budget: project.budget || ''
    });
    setEditId(project.id);
    setShowModal(true);
  };

  const handleInputChange = (e) =>
    setCurrentProject(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, departmentId, startDate, endDate, budget } = currentProject;
    if (!name || !departmentId || !startDate || !endDate || !budget) {
      return alert('All fields are required.');
    }

    try {
      if (formMode === 'add') {
        const res = await axios.post('http://localhost:5000/api/projects', currentProject);
        setProjects(prev => [...prev, res.data]);
        alert('Project added successfully');
      } else {
        const res = await axios.put(`http://localhost:5000/api/projects/${editId}`, currentProject);
        setProjects(prev => prev.map(p => p.id === editId ? res.data : p));
        alert('Project updated successfully');
      }
      setShowModal(false);
      fetchProjects();
    } catch (err) {
      console.error('Error submitting project', err);
      alert('Error submitting project. Check console.');
    }
  };

  const handleAssigneesClick = (project) => {
    navigate(`/projects/${project.id}/assignees`, {
      state: {
        projectId: project.id,
        name: project.name,
        budget: project.budget,
      },
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/projects/${id}`);
      setProjects(prev => prev.filter(p => p._id !== id));
      alert('Project deleted');
      fetchProjects();
    } catch (err) {
      console.error('Error deleting project', err);
      alert('Error deleting project. Check console.');
    }
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
            <th>Budget</th>
            <th>Actions</th>
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
              <td>
                <FaEdit className="icon edit-icon" onClick={() => openEditModal(proj)} />
                <FaTrash className="icon delete-icon" onClick={() => handleDelete(proj.id)} />
                <button
                  className="assignees-btn"
                  onClick={() => handleAssigneesClick(proj)}
                  title="Manage Assignees"
                >
                  Assignees
                </button>
              </td>
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
          <form className="modal-form" onSubmit={handleSubmit}>
            <input
              name="name"
              placeholder="Project Name"
              value={currentProject.name}
              onChange={handleInputChange}
            />
            <input
              name="departmentId"
              placeholder="Department ID"
              value={currentProject.departmentId}
              onChange={handleInputChange}
            />
            <label htmlFor="startDate">Start Date</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={currentProject.startDate}
              onChange={handleInputChange}
            />
            <label htmlFor="EndDate">End Date</label>
            <input
              type="date"
              name="endDate"
              value={currentProject.endDate}
              onChange={handleInputChange}
            />
            <input
              name="budget"
              placeholder="Budget"
              value={currentProject.budget}
              onChange={handleInputChange}
            />
            <button type="submit">{formMode === 'add' ? 'Add' : 'Update'}</button>
          </form>
        </ModalWrapper>
      )}

    </div>
  );
};

export default ProjectDirectory;
