import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css'; // Make sure this path is correct

const Login = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await axios.post('http://localhost:5000/api/login', credentials);
      const { user, token } = res.data;

      if (user.role === 'admin' || user.role === 'Admin') {
        navigate('/admin-dashboard');
      } else if (user.role === 'employee') {
        alert('Employee logged in');
        navigate('/emp-homepage');
      } else if (user.role === 'project_manager') {
        alert('Project Manager logged in');
        navigate('/emp-homepage');
      } else if (user.role === 'department_manager') {
        alert('Department Manager logged in');
        navigate('/emp-homepage');
      } else if (user.role === 'financial_analyst') {
        alert('Financial Analyst logged in');
        navigate('/emp-homepage');
      }else if (user.role === 'employee'){
        alert('Employee logged in');
        navigate('/emp-homepage');
      } else {
        alert('Unknown role');
      }
    } catch (err) {
      console.error(err);
      setError('Invalid email or password');
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Login</h2>
        {error && <p className="error">{error}</p>}
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={credentials.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={credentials.password}
          onChange={handleChange}
          required
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;
