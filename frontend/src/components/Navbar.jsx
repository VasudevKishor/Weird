import React, { useState,useEffect } from "react";
import { FaUserCircle } from "react-icons/fa";
import { NavLink, useNavigate } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
    const [showDropdown, setShowDropdown] = useState(false);
    const navigate = useNavigate();
    const [userName, setUserName] = useState('');

     useEffect(() => {
    const name = localStorage.getItem("userName");
    if (name) {
      setUserName(name);
    }
  }, []);

    const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    navigate("/"); // 👈 Redirect to login page
    };

   

    return (
        <nav className="navbar">
            <div className="navbar-left">
                <NavLink to="/admin-dashboard"><div className="logo"></div></NavLink>
                <ul className="nav-links">
                    <li>
                        <NavLink to="/admin-dashboard" className={({ isActive }) => isActive ? "active" : ""}>
                            Dashboard
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/project-dashboard" className={({ isActive }) => isActive ? "active" : ""}>
                            Projects
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/org-dashboard" className={({ isActive }) => isActive ? "active" : ""}>
                            Organisation
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/dept-dashboard" className={({ isActive }) => isActive ? "active" : ""}>
                            Departments
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/employee-dashboard" className={({ isActive }) => isActive ? "active" : ""}>
                            Users
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/financial-year-manager" className={({ isActive }) => isActive ? "active" : ""}>
                            Settings
                        </NavLink>
                    </li>
                </ul>
            </div>
            
            <div className="profile-dropdown-container">
                <FaUserCircle 
                    className="profile-icon" 
                    onClick={() => setShowDropdown(!showDropdown)} 
                />
                {showDropdown && (
                    <div className="dropdown">
                        <p className="dropdown-username">Welcome, {userName}</p>
                        <button className="dropdown-logout" onClick={handleLogout}>Logout</button>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
