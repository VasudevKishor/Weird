import React from "react";
import { FaUserCircle } from "react-icons/fa";
import "./Navbar.css";
const API = process.env.REACT_APP_API_BASE_URL;

const Navbar = () => {
    return (
        <nav className="navbar">
            <div className="navbar-left">
                <a href="/admin-dashboard"><div className="logo"></div></a>
                <ul className="nav-links">
                    <li><a href="/employee-dashboard">Manage Users</a></li>
                    <li><a href="/org-dashboard">Manage Organisation</a></li>
                    <li><a href="/dept-dashboard">Manage Departments</a></li>
                    <li><a href="/project-dashboard">Manage Projects</a></li>
                </ul>
            </div>
            <div className="profile-icon">
                <FaUserCircle />
            </div>
        </nav>
    );
};

export default Navbar;
