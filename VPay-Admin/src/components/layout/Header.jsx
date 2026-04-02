import React from 'react';
import { FiMenu, FiBell, FiUser, FiLogOut, FiSettings, FiShield, FiBriefcase, FiHeadphones, FiCheckCircle } from 'react-icons/fi';
import { useAuthStore } from '../../store/authStore';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Header = ({ onToggleSidebar }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getOfficeBadge = () => {
    const role = user?.role || 'user';
    switch (role) {
      case 'superadmin':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100 animate-fade-in shadow-sm">
            <FiShield size={14} className="animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Command Center</span>
          </div>
        );
      case 'admin':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full border border-blue-100 shadow-sm">
            <FiBriefcase size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Operations Office</span>
          </div>
        );
      case 'support':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 shadow-sm">
            <FiHeadphones size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Support Desk</span>
          </div>
        );
      case 'compliance':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full border border-amber-100 shadow-sm">
            <FiCheckCircle size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Compliance Office</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <header className="bg-white border-b border-gray-100 h-16 flex items-center justify-between px-6 sticky top-0 z-40 backdrop-blur-md bg-white/80">
      <div className="flex items-center gap-6">
        <button
          onClick={onToggleSidebar}
          className="text-gray-400 hover:text-primary-600 transition-all transform active:scale-95"
          title="Toggle Sidebar"
        >
          <FiMenu size={24} />
        </button>
        
        {/* Office Indicator */}
        <div className="hidden sm:block">
          {getOfficeBadge()}
        </div>
      </div>

      <div className="flex items-center gap-5">
        {/* Notifications */}
        <button className="relative text-gray-400 hover:text-primary-600 transition-all group p-2 rounded-xl hover:bg-primary-50">
          <FiBell size={20} className="group-hover:animate-bounce" />
          <span className="absolute top-2 right-2 bg-primary-600 text-white text-[8px] font-bold rounded-full h-4 w-4 flex items-center justify-center border-2 border-white shadow-sm">
            3
          </span>
        </button>

        {/* User Menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 pl-2 pr-1 py-1 bg-gray-50/50 hover:bg-gray-100 rounded-2xl transition-all border border-transparent hover:border-gray-200 group"
          >
            <div className="text-right hidden md:block">
              <p className="text-sm font-bold text-gray-900 leading-tight">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest">{user?.role}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary-600 flex items-center justify-center text-white font-bold shadow-lg shadow-primary-200 group-hover:scale-105 transition-transform">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
              <div className="px-4 py-2 border-b border-gray-50 mb-1">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Signed in as</p>
                <p className="text-xs font-semibold text-gray-700 truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => { navigate('/settings'); setShowDropdown(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                disabled={user?.role !== 'superadmin'}
              >
                <FiSettings size={18} />
                System Settings
              </button>
              <button
                onClick={() => { navigate('/profile'); setShowDropdown(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-primary-50 hover:text-primary-600 transition-colors"
              >
                <FiUser size={18} />
                My Profile
              </button>
              <div className="border-t border-gray-50 mt-1 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <FiLogOut size={18} />
                  Terminate Session
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
