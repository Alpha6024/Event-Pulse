import { useEffect, useState } from "react";
import axios from "axios";
import { Html5QrcodeScanner } from "html5-qrcode";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from 'react-hot-toast';
import { Calendar, User, LogOut, QrCode, Download, UserCheck, UserX, Search, X, Save, Menu } from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

export default function StudentDashboard() {
  const [menu, setMenu] = useState("events");
  const [events, setEvents] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [profile, setProfile] = useState({});
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [search, setSearch] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const token = localStorage.getItem("token");
  if (!token) window.location.href = "/";

  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const handleUnauthorized = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (menu === "events" || menu === "myEvents") {
          const res = await axios.get(`${API}/api/events`, authHeader);
          setEvents(res.data);
          const myRes = await axios.get(`${API}/api/student/my-events`, authHeader);
          setMyEvents(myRes.data);
        }
        if (menu === "profile") {
          const res = await axios.get(`${API}/api/student/profile`, authHeader);
          setProfile(res.data);
        }
      } catch (err) {
        if (err.response?.status === 401) handleUnauthorized();
      }
    };
    fetchData();
  }, [menu]);

  useEffect(() => {
    let scanner = null;
    if (showScanner) {
      scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 } });
      scanner.render((decodedText) => {
        const parts = decodedText.split("/");
        const eventId = parts[parts.length - 1];
        if (eventId) {
          scanner.clear();
          setShowScanner(false);
          handleClaimCertificate(eventId);
        }
      }, (error) => { console.log(error); });
    }
    return () => { if (scanner) scanner.clear(); };
  }, [showScanner]);

  const handleClaimCertificate = async (eventId) => {
    try {
      await axios.post(`${API}/api/events/${eventId}/claim`, {}, authHeader);
      toast.success("Certificate claimed successfully!");
      const myRes = await axios.get(`${API}/api/student/my-events`, authHeader);
      setMyEvents(myRes.data);
      const event = myRes.data.find(e => e._id === eventId);
      if (event) downloadCertificate(eventId, event.title);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to claim certificate. Ensure the 10-min window is open.");
    }
  };

  const filterEvents = (list) =>
    list.filter((e) =>
      e.title?.toLowerCase().includes(search.toLowerCase()) ||
      e.description?.toLowerCase().includes(search.toLowerCase())
    );

  const registerEvent = async (id) => {
    try {
      await axios.post(`${API}/api/events/register/${id}`, {}, authHeader);
      const [allRes, myRes] = await Promise.all([
        axios.get(`${API}/api/events`, authHeader),
        axios.get(`${API}/api/student/my-events`, authHeader),
      ]);
      setEvents(allRes.data);
      setMyEvents(myRes.data);
      toast.success("Registered successfully!");
      setSelectedEvent(null);
    } catch {
      toast.error("Already registered or registration failed.");
    }
  };

  const unregisterEvent = async (id) => {
    try {
      await axios.delete(`${API}/api/events/unregister/${id}`, authHeader);
      const [allRes, myRes] = await Promise.all([
        axios.get(`${API}/api/events`, authHeader),
        axios.get(`${API}/api/student/my-events`, authHeader),
      ]);
      setEvents(allRes.data);
      setMyEvents(myRes.data);
      toast.success("Unregistered successfully!");
      setSelectedEvent(null);
    } catch {
      toast.error("Failed to unregister.");
    }
  };

  const downloadCertificate = async (eventId, eventTitle) => {
    try {
      const userId = JSON.parse(atob(token.split(".")[1])).id;
      const certUrl = `${API}/uploads/cert-${eventId}-${userId}.png`;
      const response = await fetch(certUrl);
      if (!response.ok) throw new Error("File not found");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Certificate_${eventTitle.replace(/\s+/g, '_')}.png`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Certificate downloaded successfully!");
    } catch (err) {
      toast.error("Certificate not available. Ensure you scanned the QR code during the claim window.");
      console.error(err);
    }
  };

  const updateProfile = async () => {
    try {
      await axios.put(`${API}/api/student/profile`, {
        name: profile.name,
        email: profile.email,
        mobile: profile.mobile,
      }, authHeader);
      toast.success("Profile updated successfully!");
    } catch {
      toast.error("Profile update failed.");
    }
  };

  const isRegistered = (id) => myEvents.some((e) => e._id === id);

  const navItems = [
    { key: "events", label: "Events", icon: Calendar },
    { key: "myEvents", label: "My Events", icon: UserCheck },
    { key: "profile", label: "Profile", icon: User },
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
          duration: 3000,
          style: { background: '#363636', color: '#fff', borderRadius: '12px', padding: '16px', fontSize: '14px', fontWeight: '500' },
          success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } }
        }}
      />

      {/* MOBILE OVERLAY */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* SIDEBAR MOBILE */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
            transition={{ type: "tween", duration: 0.25 }}
            className="fixed top-0 left-0 h-full w-64 bg-gray-900 text-white flex flex-col z-30 lg:hidden"
          >
            <SidebarContent
              menu={menu} navItems={navItems} handleNavClick={handleNavClick}
              onScanQR={() => { setSidebarOpen(false); setShowScanner(true); }}
              showClose onClose={() => setSidebarOpen(false)}
            />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* SIDEBAR DESKTOP */}
      <aside className="hidden lg:flex w-64 bg-gray-900 text-white flex-col shrink-0">
        <SidebarContent
          menu={menu} navItems={navItems} handleNavClick={handleNavClick}
          onScanQR={() => setShowScanner(true)}
        />
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* MOBILE TOP BAR */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-gray-900 text-white shrink-0">
          <span className="text-lg font-bold">Student Panel</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowScanner(true)}
              className="p-2 rounded-lg bg-green-700/40 hover:bg-green-700/60 transition-colors"
            >
              <QrCode className="w-5 h-5 text-green-300" />
            </button>
            <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-gray-700 transition-colors">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        <main className="flex-1 bg-gray-50 overflow-y-auto">
          <div className="p-4 lg:p-8">

            {/* SEARCH BAR */}
            {menu !== "profile" && (
              <div className="relative mb-5 lg:mb-8">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search events..."
                  className="w-full pl-11 pr-4 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors shadow-sm bg-white"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            )}

            {/* ALL EVENTS */}
            {menu === "events" && (
              <>
                <div className="mb-5 lg:mb-8">
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">Available Events</h1>
                  <p className="text-sm text-gray-500">Browse and register for upcoming events</p>
                </div>
                <EventGrid
                  events={filterEvents(events)}
                  onSelect={setSelectedEvent}
                  showDownload={false}
                  onDownload={downloadCertificate}
                />
              </>
            )}

            {/* MY EVENTS */}
            {menu === "myEvents" && (
              <>
                <div className="mb-5 lg:mb-8">
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">My Events</h1>
                  <p className="text-sm text-gray-500">Track your registered events and download certificates</p>
                </div>
                <EventGrid
                  events={filterEvents(myEvents)}
                  onSelect={setSelectedEvent}
                  showDownload
                  onDownload={downloadCertificate}
                />
              </>
            )}

            {/* PROFILE */}
            {menu === "profile" && (
              <div className="max-w-2xl mx-auto">
                <div className="mb-5">
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">My Profile</h1>
                  <p className="text-sm text-gray-500">Manage your student account information</p>
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-5 lg:p-6 rounded-2xl shadow-lg border border-gray-100"
                >
                  <div className="grid grid-cols-1 gap-4">
                    {[
                      { label: "Username", key: "username", disabled: true, type: "text" },
                      { label: "Full Name", key: "name", placeholder: "Enter your full name", type: "text" },
                      { label: "Email Address", key: "email", placeholder: "Enter your email", type: "email" },
                      { label: "Mobile Number", key: "mobile", placeholder: "Enter your mobile", type: "tel" },
                    ].map(({ label, key, disabled, placeholder, type }) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                        <input
                          type={type}
                          disabled={disabled}
                          className={`w-full p-3 border rounded-xl text-sm transition-colors ${
                            disabled
                              ? "bg-gray-50 border-gray-200 text-gray-500 font-medium"
                              : "border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          }`}
                          value={profile[key] || ""}
                          placeholder={placeholder}
                          onChange={(e) => !disabled && setProfile({ ...profile, [key]: e.target.value })}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 flex justify-end">
                    <button
                      onClick={updateProfile}
                      className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-lg flex items-center gap-2"
                    >
                      <Save size={15} /> Save Changes
                    </button>
                  </div>
                </motion.div>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* QR SCANNER MODAL */}
      <AnimatePresence>
        {showScanner && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-[100] p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white p-5 rounded-2xl w-full max-w-sm"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-bold text-gray-800">Scan Organizer QR</h2>
                <button
                  onClick={() => setShowScanner(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
                >
                  <X size={16} />
                </button>
              </div>
              <div id="reader" className="overflow-hidden rounded-lg"></div>
              <p className="text-center text-xs text-gray-400 mt-3">Point your camera at the certificate claim QR code</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EVENT DETAIL MODAL */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] relative overflow-hidden border border-gray-100"
            >
              <button
                onClick={() => setSelectedEvent(null)}
                className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-gray-100 text-gray-600 shadow"
              >
                <X size={16} />
              </button>

              {/* Drag indicator on mobile */}
              <div className="sm:hidden w-10 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-1 shrink-0" />

              <div className="h-48 sm:h-64 bg-gradient-to-br from-gray-100 to-gray-200 shrink-0">
                {selectedEvent.images?.[0] ? (
                  <img src={`${API}${selectedEvent.images[0]}`} className="h-full w-full object-cover" alt="header" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-gray-400"><Calendar size={48} /></div>
                )}
              </div>

              <div className="p-5 sm:p-8 overflow-y-auto flex-1">
                <h2 className="text-xl sm:text-3xl font-bold mb-3 text-gray-900">{selectedEvent.title}</h2>
                <div>
                  <h4 className="font-bold text-gray-700 mb-2 text-xs uppercase tracking-wide">Description</h4>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{selectedEvent.description}</p>
                </div>
              </div>

              <div className="p-4 sm:p-8 border-t border-gray-200 bg-gray-50 shrink-0">
                {selectedEvent.status === "ended" ? (
                  isRegistered(selectedEvent._id) && (
                    <button
                      onClick={() => downloadCertificate(selectedEvent._id, selectedEvent.title)}
                      className="w-full bg-green-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-green-700 shadow-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Download size={16} /> Download My Certificate
                    </button>
                  )
                ) : (
                  !isRegistered(selectedEvent._id) ? (
                    <button
                      onClick={() => registerEvent(selectedEvent._id)}
                      className="w-full bg-indigo-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <UserCheck size={16} /> Register Now
                    </button>
                  ) : (
                    <button
                      onClick={() => unregisterEvent(selectedEvent._id)}
                      className="w-full bg-red-500 text-white py-3 rounded-xl text-sm font-bold hover:bg-red-600 shadow-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <UserX size={16} /> Cancel Registration
                    </button>
                  )
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Event Grid ─── */
function EventGrid({ events, onSelect, showDownload, onDownload }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
      {events.map((e) => (
        <motion.div
          key={e._id}
          whileHover={{ scale: 1.02 }}
          onClick={() => onSelect(e)}
          className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer relative border border-gray-100"
        >
          {e.status === "ended" && (
            <span className="absolute top-3 right-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full z-10 font-medium shadow">
              Ended
            </span>
          )}
          <div className="h-40 lg:h-48 bg-gradient-to-br from-gray-100 to-gray-200">
            {e.images?.[0] ? (
              <img src={`${API}${e.images[0]}`} className="h-full w-full object-cover" alt="event" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-gray-400"><Calendar size={40} /></div>
            )}
          </div>
          <div className="p-4 lg:p-6">
            <h3 className="font-bold text-base lg:text-lg text-gray-900 mb-1 truncate">{e.title}</h3>
            <p className="text-xs lg:text-sm text-gray-500 line-clamp-2">{e.description}</p>
            {showDownload && e.status === "ended" && (
              <div className="pt-3 mt-2 border-t border-gray-100">
                <button
                  onClick={(ev) => { ev.stopPropagation(); onDownload(e._id, e.title); }}
                  className="w-full bg-green-600 text-white py-2 rounded-xl text-xs font-bold hover:bg-green-700 transition-colors shadow flex items-center justify-center gap-1.5"
                >
                  <Download size={13} /> Download Certificate
                </button>
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ─── Sidebar ─── */
function SidebarContent({ menu, navItems, handleNavClick, onScanQR, showClose, onClose }) {
  return (
    <div className="flex flex-col h-full p-6">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold text-white">Student Panel</h2>
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
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm transition-colors ${
              menu === key ? "bg-indigo-600 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"
            }`}
          >
            <Icon size={18} /> {label}
          </button>
        ))}

        <button
          onClick={onScanQR}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm text-green-400 hover:bg-green-900/20 hover:text-green-300 transition-colors"
        >
          <QrCode size={18} /> Scan QR to Claim
        </button>
      </nav>

      <button
        onClick={() => { localStorage.clear(); window.location.href = "/"; }}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors"
      >
        <LogOut size={18} /> Logout
      </button>
    </div>
  );
}