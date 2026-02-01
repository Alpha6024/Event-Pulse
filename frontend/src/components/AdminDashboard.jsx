import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import toast, { Toaster } from 'react-hot-toast';
import { BarChart3, Users, Calendar, Plus, Download, Search, LogOut, Shield } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';

export default function AdminDashboard() {
  const [menu, setMenu] = useState("stats");
  const [stats, setStats] = useState({ students: 0, organizers: 0, totalEvents: 0 });
  const [users, setUsers] = useState([]);
  const [eventData, setEventData] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [reportSearch, setReportSearch] = useState("");

  const token = localStorage.getItem("token");

  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    role: "student",
    email: "",
  });

  const fetchEventReport = async () => {
    const res = await axios.get("http://localhost:5000/api/admin/events-report", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setEventData(res.data);
  };

  const downloadExcel = () => {
    const headers = ["Event Title", "Organizer", "Mobile", "Registered", "Claimed"];
    const rows = filteredReport.map(e => [
      e.title,
      e.organizer,
      `'${e.mobile}`,
      e.registered,
      e.claimed
    ]);

    let csvContent = "data:text/csv;charset=utf-8," 
      + [headers, ...rows].map(row => row.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Global_Event_Report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const createUser = async () => {
    try {
      await axios.post(
        "http://localhost:5000/api/admin/create-user",
        newUser,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("User created successfully!");
      setNewUser({ username: "", password: "", role: "student", email: "" });
      setMenu("users");
      fetchUsers();
    } catch (err) { 
      toast.error("Failed to create user");
      console.log(err);
    }
  };

  const fetchStats = async () => {
    const res = await axios.get("http://localhost:5000/api/admin/stats", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setStats(res.data);
  };

  const fetchUsers = async () => {
    const res = await axios.get("http://localhost:5000/api/admin/users", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setUsers(res.data);
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/admin/user/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("User deleted successfully!");
      fetchUsers();
    } catch (err) {
      toast.error("Failed to delete user");
      console.log(err);
    }
  };

  useEffect(() => {
    if (menu === "stats") fetchStats();
    if (menu === "users") fetchUsers();
    if (menu === "viewData") fetchEventReport();
  }, [menu]);

  const filteredUsers = users.filter((u) => {
    const roleMatch = filter === "all" || u.role === filter;
    const searchMatch = u.username?.toLowerCase().includes(search.toLowerCase());
    return roleMatch && searchMatch;
  });

  const filteredReport = eventData.filter((e) => 
    e.title.toLowerCase().includes(reportSearch.toLowerCase()) || 
    e.organizer.toLowerCase().includes(reportSearch.toLowerCase())
  );

  return (
    <div className="h-screen flex bg-white overflow-hidden">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 2000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
     
      {/* SIDEBAR */}
      <div className="w-64 bg-gray-900 text-white p-6">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-indigo-400" />
          <h2 className="text-xl font-bold text-white">Admin Panel</h2>
        </div>
        
        <nav className="space-y-2">
          <button 
            onClick={() => setMenu("stats")} 
            className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${
              menu === "stats" 
                ? "bg-indigo-600 text-white shadow-lg" 
                : "hover:bg-gray-700 text-white/80 hover:text-white"
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            Dashboard Stats
          </button>
          
          <button 
            onClick={() => setMenu("users")} 
            className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${
              menu === "users" 
                ? "bg-indigo-600 text-white shadow-lg" 
                : "hover:bg-gray-700 text-white/80 hover:text-white"
            }`}
          >
            <Users className="w-5 h-5" />
            All Users
          </button>
          
          <button 
            onClick={() => setMenu("viewData")} 
            className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${
              menu === "viewData" 
                ? "bg-indigo-600 text-white shadow-lg" 
                : "hover:bg-gray-700 text-white/80 hover:text-white"
            }`}
          >
            <Calendar className="w-5 h-5" />
            View & Download Data
          </button>
          
          <button 
            onClick={() => setMenu("addUser")} 
            className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${
              menu === "addUser" 
                ? "bg-indigo-600 text-white shadow-lg" 
                : "hover:bg-gray-700 text-white/80 hover:text-white"
            }`}
          >
            <Plus className="w-5 h-5" />
            Add User
          </button>
        </nav>
        
        <button 
          onClick={() => { 
            localStorage.clear(); 
            toast.success("Logged out successfully!");
            setTimeout(() => window.location.href = "/", 1000);
          }} 
          className="flex items-center gap-3 text-red-400 hover:text-red-300 mt-10 w-full text-left px-4 py-3 rounded-xl hover:bg-red-500/10 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
        {menu === "stats" && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="space-y-6"
          >
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard Overview</h1>
              <p className="text-gray-600">Monitor your platform's key metrics</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">Total Students</h3>
                    <p className="text-4xl font-bold text-blue-600">{stats.students}</p>
                  </div>
                  <Users className="w-12 h-12 text-blue-600/30" />
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">Total Organizers</h3>
                    <p className="text-4xl font-bold text-green-600">{stats.organizers}</p>
                  </div>
                  <Shield className="w-12 h-12 text-green-600/30" />
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">Total Events</h3>
                    <p className="text-4xl font-bold text-purple-600">{stats.totalEvents || 0}</p>
                  </div>
                  <Calendar className="w-12 h-12 text-purple-600/30" />
                </div>
              </div>
            </div>
            
            {/* CHARTS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {/* BAR CHART */}
              <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4">User Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { name: 'Students', value: stats.students, fill: '#3B82F6' },
                    { name: 'Organizers', value: stats.organizers, fill: '#10B981' },
                    { name: 'Events', value: stats.totalEvents || 0, fill: '#8B5CF6' }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#6B7280" />
                    <YAxis stroke="#6B7280" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e5e7eb', 
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }} 
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              {/* PIE CHART */}
              <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Platform Overview</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Students', value: stats.students, fill: '#3B82F6' },
                        { name: 'Organizers', value: stats.organizers, fill: '#10B981' }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {[
                        { name: 'Students', value: stats.students, fill: '#3B82F6' },
                        { name: 'Organizers', value: stats.organizers, fill: '#10B981' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e5e7eb', 
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                    <span className="text-sm text-gray-600">Students</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                    <span className="text-sm text-gray-600">Organizers</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* ADDITIONAL CHARTS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {/* LINE CHART */}
              <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Monthly Growth</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={[
                    { month: 'Jan', users: Math.floor((stats.students + stats.organizers) * 0.6), events: Math.floor((stats.totalEvents || 0) * 0.4) },
                    { month: 'Feb', users: Math.floor((stats.students + stats.organizers) * 0.7), events: Math.floor((stats.totalEvents || 0) * 0.5) },
                    { month: 'Mar', users: Math.floor((stats.students + stats.organizers) * 0.8), events: Math.floor((stats.totalEvents || 0) * 0.6) },
                    { month: 'Apr', users: Math.floor((stats.students + stats.organizers) * 0.9), events: Math.floor((stats.totalEvents || 0) * 0.8) },
                    { month: 'May', users: stats.students + stats.organizers, events: stats.totalEvents || 0 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" stroke="#6B7280" />
                    <YAxis stroke="#6B7280" />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                    <Line type="monotone" dataKey="users" stroke="#3B82F6" strokeWidth={3} />
                    <Line type="monotone" dataKey="events" stroke="#10B981" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              {/* AREA CHART */}
              <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Registration Trends</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={[
                    { week: 'W1', registered: Math.floor(stats.students * 0.2), claimed: Math.floor(stats.students * 0.15) },
                    { week: 'W2', registered: Math.floor(stats.students * 0.4), claimed: Math.floor(stats.students * 0.3) },
                    { week: 'W3', registered: Math.floor(stats.students * 0.6), claimed: Math.floor(stats.students * 0.45) },
                    { week: 'W4', registered: Math.floor(stats.students * 0.8), claimed: Math.floor(stats.students * 0.6) },
                    { week: 'W5', registered: stats.students, claimed: Math.floor(stats.students * 0.75) }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="week" stroke="#6B7280" />
                    <YAxis stroke="#6B7280" />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="registered" stackId="1" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="claimed" stackId="1" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}

        {menu === "viewData" && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="space-y-6"
          >
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Event Reports</h1>
              <p className="text-gray-600">Track registration and certificate claims globally</p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Event & Certificate Reports</h3>
                  <p className="text-sm text-gray-600">Export and analyze event data</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                  <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input 
                      type="text" 
                      placeholder="Search events or organizers..." 
                      className="w-full border-2 border-gray-200 rounded-xl px-12 py-2 focus:border-indigo-500 focus:outline-none transition-colors duration-200 bg-gray-50 focus:bg-white"
                      value={reportSearch}
                      onChange={(e) => setReportSearch(e.target.value)}
                    />
                  </div>
                  <button 
                    onClick={downloadExcel} 
                    className="flex items-center gap-2 bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl whitespace-nowrap"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full">
                  <thead className="bg-linear-to-r from-indigo-600 to-purple-600 text-white">
                    <tr>
                      <th className="p-4 text-left font-semibold">Event Title</th>
                      <th className="p-4 text-left font-semibold">Organizer</th>
                      <th className="p-4 text-left font-semibold">Mobile</th>
                      <th className="p-4 text-center font-semibold">Registered</th>
                      <th className="p-4 text-center font-semibold">Claimed</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {filteredReport.length > 0 ? filteredReport.map((e, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100">
                        <td className="p-4 font-medium text-gray-800">{e.title}</td>
                        <td className="p-4 text-gray-600">{e.organizer}</td>
                        <td className="p-4 text-gray-600">{e.mobile}</td>
                        <td className="p-4 text-center">
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                            {e.registered}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                            {e.claimed}
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="5" className="p-10 text-center text-gray-400">
                          No matching records found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {menu === "users" && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="space-y-6"
          >
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">User Management</h1>
              <p className="text-gray-600">Manage all platform users</p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="relative">
                  <select 
                    className="border border-gray-300 rounded-lg px-3 py-2 pr-8 text-gray-700 bg-white focus:border-indigo-500 focus:outline-none appearance-none w-full" 
                    value={filter} 
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option value="all">All Roles</option>
                    <option value="student">Student</option>
                    <option value="organizer">Organizer</option>
                  </select>
                  <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input 
                    type="text" 
                    placeholder="Search by username" 
                    className="w-full border-2 border-gray-200 rounded-xl px-12 py-2 focus:border-indigo-500 focus:outline-none transition-colors duration-200 bg-gray-50 focus:bg-white" 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)} 
                  />
                </div>
              </div>
              
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full">
                  <thead className="bg-linear-to-r from-indigo-600 to-purple-600 text-white">
                    <tr>
                      <th className="p-4 text-left font-semibold">Username</th>
                      <th className="p-4 text-left font-semibold">Role</th>
                      <th className="p-4 text-left font-semibold">Email</th>
                      <th className="p-4 text-center font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {filteredUsers.map((u) => (
                      <tr key={u._id} className="hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100">
                        <td className="p-4 font-medium text-gray-800">{u.username}</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            u.role === 'student' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-4 text-gray-600">{u.email || "-"}</td>
                        <td className="p-4 text-center">
                          <button 
                            onClick={() => deleteUser(u._id)} 
                            className="bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {menu === "addUser" && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="flex items-center justify-center min-h-full"
          >
            <div className="w-full max-w-lg">
              <div className="mb-6 text-center">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Add New User</h1>
                <p className="text-gray-600">Create student or organizer accounts</p>
              </div>
              
              <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">User Details</h3>
                
                <div className="space-y-4">
                  <input 
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-indigo-500 focus:outline-none transition-colors duration-200 bg-gray-50 focus:bg-white" 
                    placeholder="Username" 
                    value={newUser.username} 
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} 
                  />
                  
                  <input 
                    type="password" 
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-indigo-500 focus:outline-none transition-colors duration-200 bg-gray-50 focus:bg-white" 
                    placeholder="Password" 
                    value={newUser.password} 
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} 
                  />
                  
                  <input 
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-indigo-500 focus:outline-none transition-colors duration-200 bg-gray-50 focus:bg-white" 
                    placeholder="Email" 
                    value={newUser.email} 
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} 
                  />
                  
                  <div className="relative">
                    <select 
                      className="w-full border border-gray-300 rounded-lg px-3 py-3 pr-8 text-gray-700 bg-white focus:border-indigo-500 focus:outline-none appearance-none" 
                      value={newUser.role} 
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    >
                      <option value="student">Student</option>
                      <option value="organizer">Organizer</option>
                    </select>
                    <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  
                  <button 
                    onClick={createUser} 
                    className="w-full bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                  >
                    Create User
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}