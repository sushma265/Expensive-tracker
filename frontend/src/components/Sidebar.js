import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  MdDashboard, MdReceipt, MdAccountBalanceWallet,
  MdPieChart, MdSettings, MdLogout, MdTrendingUp
} from 'react-icons/md';
import './Sidebar.css';

const navItems = [
  { path: '/dashboard', icon: MdDashboard, label: 'Dashboard' },
  { path: '/expenses', icon: MdReceipt, label: 'Transactions' },
  { path: '/analytics', icon: MdPieChart, label: 'Analytics' },
  { path: '/budget', icon: MdAccountBalanceWallet, label: 'Budget' },
  { path: '/settings', icon: MdSettings, label: 'Settings' }
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon"><MdTrendingUp /></div>
        <span className="logo-text">SpendWise</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink key={path} to={path} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Icon className="nav-icon" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{initials}</div>
          <div className="user-details">
            <span className="user-name">{user?.name}</span>
            <span className="user-email">{user?.email}</span>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout} title="Logout">
          <MdLogout />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
