import React, { useState, useEffect, useRef } from 'react';
import './EmployeeDirectory.css';
import { FaEdit, FaTrash, FaPlus, FaTimes, FaSearch } from 'react-icons/fa';
import axios from 'axios';
import ModalWrapper from './ModalWrapper';
import './ModalWrapper.css';

const API = process.env.REACT_APP_API_BASE_URL;
const token = localStorage.getItem("token");
const authHeader = {
  headers: {
    Authorization: `Bearer ${token}`,
  },
};

// Custom Multi-Select Manager Component
const ManagerSelector = ({ selectedManagers, onManagerChange, employees, error }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredEmployees = employees.filter(emp =>
    emp.eid.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${emp.fname} ${emp.lname}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleManagerSelect = (managerId) => {
    const newSelectedManagers = selectedManagers.includes(managerId)
      ? selectedManagers.filter(id => id !== managerId)
      : [...selectedManagers, managerId];

    onManagerChange(newSelectedManagers);
  };

  const removeManager = (managerId) => {
    const newSelectedManagers = selectedManagers.filter(id => id !== managerId);
    onManagerChange(newSelectedManagers);
  };

  const getManagerName = (managerId) => {
    const manager = employees.find(emp => emp.eid === managerId);
    return manager ? `${manager.fname} ${manager.lname}` : managerId;
  };

  return (
    <div className="manager-selector" ref={dropdownRef}>
      <label>Managers</label>

      {/* Selected Managers Display */}
      <div className="selected-managers">
        {selectedManagers.map(managerId => (
          <div key={managerId} className="manager-tag">
            <span>{managerId} - {getManagerName(managerId)}</span>
            <FaTimes
              className="remove-manager"
              onClick={() => removeManager(managerId)}
            />
          </div>
        ))}
      </div>

      {/* Search Input */}
      <div className="manager-search-container">
        <div className="search-input-wrapper">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search managers by ID or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsOpen(true)}
            className="manager-search-input"
            style={error ? { borderColor: '#c33' } : {}}
          />
        </div>
      </div>

      {/* Dropdown List */}
      {isOpen && (
        <div className="manager-dropdown">
          {filteredEmployees.length > 0 ? (
            filteredEmployees.map(emp => (
              <div
                key={emp.eid}
                className={`manager-option ${selectedManagers.includes(emp.eid) ? 'selected' : ''}`}
                onClick={() => handleManagerSelect(emp.eid)}
              >
                <input
                  type="checkbox"
                  checked={selectedManagers.includes(emp.eid)}
                  readOnly
                />
                <span>{emp.eid} - {emp.fname} {emp.lname}</span>
              </div>
            ))
          ) : (
            <div className="no-results">No managers found</div>
          )}
        </div>
      )}

      {error && <div className="field-error">{error}</div>}
    </div>
  );
};

const DepartmentDirectory = () => {
  const [departments, setDepartments] = useState([]);
  const [organisations, setOrganisations] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [currentDept, setCurrentDept] = useState({
    did: '',
    name: '',
    oid: '',
    managerIds: [] // Changed from managerId to managerIds (array)
  });
  const [formErrors, setFormErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [editId, setEditId] = useState(null);
  const [organisationName, setOrganisationName] = useState('');
  const [organisationId, setOrganisationId] = useState('');

  useEffect(() => {
    fetchDepartments();
    fetchOrganisations();
    fetchEmployees();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await axios.get(`${API}/api/departments`, authHeader);
      setDepartments(res.data);
    } catch (err) {
      console.error('Failed to fetch departments', err);
    }
  };

  const fetchOrganisations = async () => {
  try {
    const res = await axios.get(`${API}/api/organisations`, authHeader);
    setOrganisations(res.data);
    if (res.data.length > 0) {
      const org = res.data[0];
      setOrganisationName(org.name);
      setOrganisationId(org.oid);
      // Set oid directly in currentDept when adding a new dept
      setCurrentDept(prev => ({ ...prev, oid: org.oid }));
    }
  } catch (err) {
    console.error('Failed to fetch organisations', err);
  }
};
  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${API}/api/employees/dept`, authHeader);
      setEmployees(res.data);
    } catch (err) {
      console.error('Failed to fetch employees', err);
    }
  };

  const handleDelete = async (did) => {
    if (!window.confirm("Are you sure you want to delete this department?")) return;
    try {
      await axios.delete(`${API}/api/departments/${did}`, authHeader);
      setDepartments(prev => prev.filter(dept => dept.did !== did));
      alert("Department deleted successfully");
      await fetchEmployees();
    } catch (err) {
      console.error("Failed to delete department", err);
      if (err.response && err.response.data && err.response.data.error) {
        alert(err.response.data.error);
      } else {
        alert("Error deleting department.");
      }
    }
  };

  const openAddModal = () => {
    setFormMode('add');
    setCurrentDept({ did: '', name: '', oid: organisationId, managerIds: [] });
    setFormErrors({});
    setGeneralError('');
    setShowModal(true);
  };

  const openEditModal = (dept) => {
    setFormMode('edit');
    // Handle both old single managerId and new multiple managerIds
    const managerIds = dept.managerIds || (dept.managerId ? [dept.managerId] : []);
    setCurrentDept({ ...dept, managerIds });
    setEditId(dept.did);
    setFormErrors({});
    setGeneralError('');
    setShowModal(true);
  };

  const validateField = (name, value) => {
    let errorMsg = '';
    switch (name) {
      case 'did':
        if (!value.trim()) {
          errorMsg = 'Department ID cannot be empty.';
        } else if (!/^D\d{3}$/.test(value)) {
          errorMsg = 'Format must be D000.';
        } else if (formMode === 'add' && departments.some(dep => dep.did === value)) {
          errorMsg = 'Department ID already exists.';
        }
        break;
      case 'name':
        if (!value.trim()) {
          errorMsg = 'Department name is required.';
        } else if (!/^[A-Za-z ]{2,50}$/.test(value)) {
          errorMsg = 'Name must be 2-50 letters.';
        } else if (departments.find(dep => dep.name.toLowerCase() === value.toLowerCase() && dep.did !== currentDept.did)) {
          errorMsg = 'Duplicate department name.';
        }
        break;
      case 'oid':
        if (!value.trim()) {
          errorMsg = 'Organization ID required.';
        } else if (!organisations.some(org => org.oid === value)) {
          errorMsg = 'Invalid Organization ID.';
        }
        break;
      default:
        break;
    }
    return errorMsg;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentDept(prev => ({ ...prev, [name]: value }));
    setFormErrors(prev => ({
      ...prev,
      [name]: validateField(name, value)
    }));
    setGeneralError('');
  };

  const handleManagerChange = (selectedManagers) => {
    setCurrentDept(prev => ({ ...prev, managerIds: selectedManagers }));
    setFormErrors(prev => ({
      ...prev,
      managerIds: validateField('managerIds', selectedManagers)
    }));
    setGeneralError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { did, name, oid, managerIds } = currentDept;
    const fields = ['did', 'name', 'oid', 'managerIds'];
    const newErrors = {};

    let hasErrors = false;
    fields.forEach(field => {
      const error = validateField(field, currentDept[field]);
      if (error) {
        newErrors[field] = error;
        hasErrors = true;
      }
    });

    if (hasErrors) {
      setFormErrors(newErrors);
      return;
    }

    try {
      if (formMode === 'add') {
        const res = await axios.post(`${API}/api/departments`, currentDept, authHeader);
        setDepartments(prev => [...prev, res.data]);
        alert("Department added.");
      } else {
        const res = await axios.put(`${API}/api/departments/${editId}`, currentDept, authHeader);
        setDepartments(prev => prev.map(dep => dep.did === editId ? res.data : dep));
        alert("Department updated.");
      }
      setShowModal(false);
      fetchDepartments();
    } catch (err) {
      console.error(err);
      setGeneralError('Submission failed.');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormErrors({});
    setGeneralError('');
  };

  const filteredDepartments = departments.filter(d =>
    d.name?.toLowerCase().includes(search.toLowerCase())
  );

  const getManagerNames = (dept) => {
    if (dept.managerIds && dept.managerIds.length > 0) {
      return dept.managerIds.map(id => {
        const manager = employees.find(emp => emp.eid === id);
        return manager ? `${id} (${manager.fname} ${manager.lname})` : id;
      }).join(', ');
    } else if (dept.managerId) {
      const manager = employees.find(emp => emp.eid === dept.managerId);
      return manager ? `${dept.managerId} (${manager.fname} ${manager.lname})` : dept.managerId;
    }
    return 'No managers assigned';
  };

  return (
    <div className="employee-table-container">
      <div className="table-header">
        <h2>Department Details</h2>
        <div className="controls">
          <input
            type="text"
            className="search-bar"
            placeholder="Search department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="add-btn" onClick={openAddModal}>
            <FaPlus /> Add Department
          </button>
        </div>
      </div>

      <table className="employee-table">
        <thead>
          <tr>
            <th>Department ID</th>
            <th>Name</th>
            <th>Organisation ID</th>
            <th>Managers</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredDepartments.map((dept) => (
            <tr key={dept._id || dept.did}>
              <td>{dept.did}</td>
              <td>{dept.name}</td>
              <td>{dept.oid}</td>
              <td>{getManagerNames(dept)}</td>
              <td>
                <FaEdit className="icon edit-icon" onClick={() => openEditModal(dept)} />
                <FaTrash className="icon delete-icon" onClick={() => handleDelete(dept.did)} />
              </td>
            </tr>
          ))}
          {filteredDepartments.length === 0 && (
            <tr>
              <td colSpan="5" className="no-data">No matching departments found.</td>
            </tr>
          )}
        </tbody>
      </table>

      {showModal && (
        <ModalWrapper
          title={formMode === 'add' ? 'Add Department' : 'Edit Department'}
          onClose={closeModal}
        >
          <form className="modal-form" onSubmit={handleSubmit}>
            {generalError && (
              <div className="form-error">{generalError}</div>
            )}

            <div className="floating-label">
              <input
                name="did"
                placeholder=" "
                value={currentDept.did}
                onChange={handleInputChange}
                disabled={formMode === 'edit'}
                style={formErrors.did ? { borderColor: '#c33' } : {}}
              />
              <label>Department ID</label>
              {formErrors.did && <div className="field-error">{formErrors.did}</div>}
            </div>

            <div className="floating-label">
              <input
                name="name"
                placeholder=" "
                value={currentDept.name}
                onChange={handleInputChange}
                style={formErrors.name ? { borderColor: '#c33' } : {}}
              />
              <label>Department Name</label>
              {formErrors.name && <div className="field-error">{formErrors.name}</div>}
            </div>

            <div className="floating-label">
              <input
                name="organisationName"
                placeholder=" "
                value={organisationName}
                readOnly
                style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }}
              />
              <label>Organisation</label>
            </div>

            <ManagerSelector
              selectedManagers={currentDept.managerIds}
              onManagerChange={handleManagerChange}
              employees={employees}
              error={formErrors.managerIds}
            />

            <button type="submit">{formMode === 'add' ? 'Add' : 'Update'}</button>
          </form>
        </ModalWrapper>
      )}
    </div>
  );
};

export default DepartmentDirectory;