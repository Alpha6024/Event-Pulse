import { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from 'react-hot-toast';
import { BarChart3, Users, Calendar, Plus, Download, Search, LogOut, Shield, Menu, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';

const API = import.meta.env.VITE_API_URL;

export default function AdminDashboard() {
  const [menu, setMenu] = useState("stats");
  const [stats, setStats] = useState({ students: 0, organizers: 0, totalEvents: 0 });
  const [users, setUsers] = useState([]);
  const [eventData, setEventData] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [reportSearch, setReportSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const token = localStorage.getItem("token");

  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    role: "student",
    email: "",
  });

  const fetchEventReport = async () => {
    const res = await axios.get(`${API}/api/admin/events-report`, {
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
        `${API}/api/admin/create-user`,
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
    const res = await axios.get(`${API}/api/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setStats(res.data);
  };

  const fetchUsers = async () => {
    const res = await axios.get(`${API}/api/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setUsers(res.data);
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      await axios.delete(`${API}/api/admin/user/${id}`, {
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

  const navItems = [
    { key: "stats", label: "Dashboard Stats", icon: BarChart3 },
    { key: "users", label: "All Users", icon: Users },
    { key: "viewData", label: "View & Download Data", icon: Calendar },
    { key: "addUser", label: "Add User", icon: Plus },
  ];

  const handleNavClick = (key) => {
    setMenu(key);
    setSidebarOpen(false);
  };

  return (
    <div className="h-screen flex bg-white overflow-hidden">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 2000,
          style: { background: '#363636', color: '#fff' },
        }}
      />

      {/* MOBILE OVERLAY */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* SIDEBAR — fixed on mobile, static on desktop */}
      <AnimatePresence>
        {(sidebarOpen) && (
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "tween", duration: 0.25 }}
            className="fixed top-0 left-0 h-full w-64 bg-gray-900 text-white p-6 z-30 flex flex-col lg:hidden"
          >
            <SidebarContent
              menu={menu}
              navItems={navItems}
              handleNavClick={handleNavClick}
              showClose
              onClose={() => setSidebarOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* SIDEBAR — always visible on desktop */}
      <div className="hidden lg:flex w-64 bg-gray-900 text-white p-6 flex-col shrink-0">
        <SidebarContent
          menu={menu}
          navItems={navItems}
          handleNavClick={handleNavClick}
        />
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* MOBILE TOP BAR */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-gray-900 text-white shrink-0">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-indigo-400" />
            <span className="text-lg font-bold">Admin Panel</span>
          </div>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-4 lg:p-6">

          {/* STATS */}
          {menu === "stats" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="mb-2">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-1">Dashboard Overview</h1>
                <p className="text-gray-500 text-sm lg:text-base">Monitor your platform's key metrics</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                  label="Total Students"
                  value={stats.students}
                  color="blue"
                  icon={<Users className="w-10 h-10 text-blue-600/30" />}
                />
                <StatCard
                  label="Total Organizers"
                  value={stats.organizers}
                  color="green"
                  icon={<Shield className="w-10 h-10 text-green-600/30" />}
                />
                <StatCard
                  label="Total Events"
                  value={stats.totalEvents || 0}
                  color="purple"
                  icon={<Calendar className="w-10 h-10 text-purple-600/30" />}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartCard title="User Distribution">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={[
                      { name: 'Students', value: stats.students },
                      { name: 'Organizers', value: stats.organizers },
                      { name: 'Events', value: stats.totalEvents || 0 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" stroke="#6B7280" tick={{ fontSize: 12 }} />
                      <YAxis stroke="#6B7280" tick={{ fontSize: 12 }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}
                        fill="#6366f1" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Platform Overview">
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Students', value: stats.students, fill: '#3B82F6' },
                          { name: 'Organizers', value: stats.organizers, fill: '#10B981' }
                        ]}
                        cx="50%" cy="50%"
                        innerRadius={55} outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill="#3B82F6" />
                        <Cell fill="#10B981" />
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-4 mt-2">
                    <Legend color="bg-blue-600" label="Students" />
                    <Legend color="bg-green-600" label="Organizers" />
                  </div>
                </ChartCard>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartCard title="Monthly Growth">
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={[
                      { month: 'Jan', users: Math.floor((stats.students + stats.organizers) * 0.6), events: Math.floor((stats.totalEvents || 0) * 0.4) },
                      { month: 'Feb', users: Math.floor((stats.students + stats.organizers) * 0.7), events: Math.floor((stats.totalEvents || 0) * 0.5) },
                      { month: 'Mar', users: Math.floor((stats.students + stats.organizers) * 0.8), events: Math.floor((stats.totalEvents || 0) * 0.6) },
                      { month: 'Apr', users: Math.floor((stats.students + stats.organizers) * 0.9), events: Math.floor((stats.totalEvents || 0) * 0.8) },
                      { month: 'May', users: stats.students + stats.organizers, events: stats.totalEvents || 0 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" stroke="#6B7280" tick={{ fontSize: 12 }} />
                      <YAxis stroke="#6B7280" tick={{ fontSize: 12 }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Line type="monotone" dataKey="users" stroke="#3B82F6" strokeWidth={2.5} dot={false} />
                      <Line type="monotone" dataKey="events" stroke="#10B981" strokeWidth={2.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Registration Trends">
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={[
                      { week: 'W1', registered: Math.floor(stats.students * 0.2), claimed: Math.floor(stats.students * 0.15) },
                      { week: 'W2', registered: Math.floor(stats.students * 0.4), claimed: Math.floor(stats.students * 0.3) },
                      { week: 'W3', registered: Math.floor(stats.students * 0.6), claimed: Math.floor(stats.students * 0.45) },
                      { week: 'W4', registered: Math.floor(stats.students * 0.8), claimed: Math.floor(stats.students * 0.6) },
                      { week: 'W5', registered: stats.students, claimed: Math.floor(stats.students * 0.75) }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="week" stroke="#6B7280" tick={{ fontSize: 12 }} />
                      <YAxis stroke="#6B7280" tick={{ fontSize: 12 }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Area type="monotone" dataKey="registered" stackId="1" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.5} />
                      <Area type="monotone" dataKey="claimed" stackId="1" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
            </motion.div>
          )}

          {/* VIEW DATA */}
          {menu === "viewData" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-1">Event Reports</h1>
                <p className="text-gray-500 text-sm">Track registration and certificate claims globally</p>
              </div>

              <div className="bg-white p-4 lg:p-6 rounded-2xl shadow-xl border border-gray-200">
                <div className="flex flex-col gap-3 mb-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">Event & Certificate Reports</h3>
                      <p className="text-xs text-gray-500">Export and analyze event data</p>
                    </div>
                    <button
                      onClick={downloadExcel}
                      className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-200 shadow-lg text-sm w-full sm:w-auto"
                    >
                      <Download className="w-4 h-4" />
                      Export CSV
                    </button>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search events or organizers..."
                      className="w-full border-2 border-gray-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:border-indigo-500 focus:outline-none bg-gray-50 focus:bg-white transition-colors"
                      value={reportSearch}
                      onChange={(e) => setReportSearch(e.target.value)}
                    />
                  </div>
                </div>

                {/* Mobile: card list / Desktop: table */}
                <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full text-sm">
                    <thead className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                      <tr>
                        <th className="p-3 text-left font-semibold">Event Title</th>
                        <th className="p-3 text-left font-semibold">Organizer</th>
                        <th className="p-3 text-left font-semibold">Mobile</th>
                        <th className="p-3 text-center font-semibold">Registered</th>
                        <th className="p-3 text-center font-semibold">Claimed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReport.length > 0 ? filteredReport.map((e, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 border-b border-gray-100 transition-colors">
                          <td className="p-3 font-medium text-gray-800">{e.title}</td>
                          <td className="p-3 text-gray-600">{e.organizer}</td>
                          <td className="p-3 text-gray-600">{e.mobile}</td>
                          <td className="p-3 text-center">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">{e.registered}</span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">{e.claimed}</span>
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan="5" className="p-8 text-center text-gray-400">No matching records found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden space-y-3">
                  {filteredReport.length > 0 ? filteredReport.map((e, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-2">
                      <p className="font-semibold text-gray-800 text-sm">{e.title}</p>
                      <p className="text-xs text-gray-500">Organizer: <span className="text-gray-700">{e.organizer}</span></p>
                      <p className="text-xs text-gray-500">Mobile: <span className="text-gray-700">{e.mobile}</span></p>
                      <div className="flex gap-3 pt-1">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">Reg: {e.registered}</span>
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">Claimed: {e.claimed}</span>
                      </div>
                    </div>
                  )) : (
                    <p className="text-center text-gray-400 py-8 text-sm">No matching records found</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* USERS */}
          {menu === "users" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-1">User Management</h1>
                <p className="text-gray-500 text-sm">Manage all platform users</p>
              </div>

              <div className="bg-white p-4 lg:p-6 rounded-2xl shadow-xl border border-gray-200">
                <div className="flex flex-col sm:flex-row gap-3 mb-5">
                  <div className="relative">
                    <select
                      className="border border-gray-300 rounded-lg px-3 py-2 pr-8 text-gray-700 bg-white focus:border-indigo-500 focus:outline-none appearance-none w-full sm:w-auto text-sm"
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
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search by username"
                      className="w-full border-2 border-gray-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:border-indigo-500 focus:outline-none bg-gray-50 focus:bg-white transition-colors"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>

                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full text-sm">
                    <thead className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                      <tr>
                        <th className="p-3 text-left font-semibold">Username</th>
                        <th className="p-3 text-left font-semibold">Role</th>
                        <th className="p-3 text-left font-semibold">Email</th>
                        <th className="p-3 text-center font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => (
                        <tr key={u._id} className="hover:bg-gray-50 border-b border-gray-100 transition-colors">
                          <td className="p-3 font-medium text-gray-800">{u.username}</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${u.role === 'student' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="p-3 text-gray-600">{u.email || "-"}</td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => deleteUser(u._id)}
                              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 shadow"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden space-y-3">
                  {filteredUsers.map((u) => (
                    <div key={u._id} className="border border-gray-200 rounded-xl p-4 bg-gray-50 flex items-center justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-sm truncate">{u.username}</p>
                        <p className="text-xs text-gray-500 truncate">{u.email || "—"}</p>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${u.role === 'student' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                          {u.role}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteUser(u._id)}
                        className="shrink-0 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ADD USER */}
          {menu === "addUser" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start justify-center min-h-full pt-4"
            >
              <div className="w-full max-w-lg">
                <div className="mb-4 text-center">
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-1">Add New User</h1>
                  <p className="text-gray-500 text-sm">Create student or organizer accounts</p>
                </div>

                <div className="bg-white p-6 lg:p-8 rounded-2xl shadow-xl border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-5 text-center">User Details</h3>
                  <div className="space-y-4">
                    <input
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none bg-gray-50 focus:bg-white transition-colors"
                      placeholder="Username"
                      value={newUser.username}
                      onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    />
                    <input
                      type="password"
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none bg-gray-50 focus:bg-white transition-colors"
                      placeholder="Password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    />
                    <input
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none bg-gray-50 focus:bg-white transition-colors"
                      placeholder="Email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    />
                    <div className="relative">
                      <select
                        className="w-full border border-gray-300 rounded-lg px-3 py-3 pr-8 text-gray-700 bg-white focus:border-indigo-500 focus:outline-none appearance-none text-sm"
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
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 rounded-xl font-semibold text-sm transition-all duration-200 shadow-lg hover:shadow-xl"
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
    </div>
  );
}

/* ─── Small reusable components ─── */

function SidebarContent({ menu, navItems, handleNavClick, showClose, onClose }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-3 mb-8">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-indigo-400 shrink-0" />
          <h2 className="text-xl font-bold text-white">Admin Panel</h2>
        </div>
        {showClose && (
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-700 transition-colors">
            <X className="w-5 h-5 text-white/70" />
          </button>
        )}
      </div>

      <nav className="space-y-2 flex-1">
        {navItems.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => handleNavClick(key)}
            className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${
              menu === key
                ? "bg-indigo-600 text-white shadow-lg"
                : "hover:bg-gray-700 text-white/80 hover:text-white"
            }`}
          >
            <Icon className="w-5 h-5 shrink-0" />
            <span className="text-sm">{label}</span>
          </button>
        ))}
      </nav>

      <button
        onClick={() => {
          localStorage.clear();
          import('react-hot-toast').then(({ default: toast }) => toast.success("Logged out successfully!"));
          setTimeout(() => window.location.href = "/", 1000);
        }}
        className="flex items-center gap-3 text-red-400 hover:text-red-300 mt-6 w-full text-left px-4 py-3 rounded-xl hover:bg-red-500/10 transition-all duration-200"
      >
        <LogOut className="w-5 h-5 shrink-0" />
        <span className="text-sm">Logout</span>
      </button>
    </div>
  );
}

function StatCard({ label, value, color, icon }) {
  const colorMap = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
  };
  return (
    <div className="bg-white p-5 rounded-2xl shadow-xl border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm lg:text-base font-semibold text-gray-600 mb-1">{label}</h3>
          <p className={`text-3xl lg:text-4xl font-bold ${colorMap[color]}`}>{value}</p>
        </div>
        {icon}
      </div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-white p-4 lg:p-6 rounded-2xl shadow-xl border border-gray-200">
      <h3 className="text-base lg:text-lg font-bold text-gray-800 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 ${color} rounded-full`} />
      <span className="text-xs text-gray-600">{label}</span>
    </div>
  );
}

const tooltipStyle = {
  backgroundColor: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
  fontSize: '12px',
};