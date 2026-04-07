import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import Draggable from "react-draggable";
import QRCode from "react-qr-code";
import toast, { Toaster } from 'react-hot-toast';
import { Calendar, Plus, User, LogOut, Edit, Trash2, Download, Award, Menu, X } from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

export default function OrganizerDashboard() {
  const [menu, setMenu] = useState("events");
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState("all");
  const [profile, setProfile] = useState({});
  const [form, setForm] = useState({});
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showCertModal, setShowCertModal] = useState(false);
  const [templateFile, setTemplateFile] = useState(null);
  const [templatePreview, setTemplatePreview] = useState(null);
  const [namePosition, setNamePosition] = useState({ x: 100, y: 100 });
  const [codePosition, setCodePosition] = useState({ x: 100, y: 150 });
  const [nameFontSize, setNameFontSize] = useState(40);
  const [isEnding, setIsEnding] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [claimUrl, setClaimUrl] = useState("");
  const [timeLeft, setTimeLeft] = useState(600);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const nameRef = useRef(null);
  const codeRef = useRef(null);
  const imgRef = useRef(null);
  const token = localStorage.getItem("token");
  const userId = JSON.parse(atob(token.split(".")[1])).id;

  useEffect(() => {
    fetchEvents();
    if (menu === "profile") {
      axios.get(`${API}/api/organizer/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => setProfile(res.data));
    }
  }, [menu, token]);

  useEffect(() => {
    let timer;
    if (showQRModal && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setShowQRModal(false);
    }
    return () => clearInterval(timer);
  }, [showQRModal, timeLeft]);

  const fetchEvents = () => {
    axios.get(`${API}/api/events`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => setEvents(res.data));
  };

  const handleUpdateProfile = async () => {
    try {
      await axios.put(`${API}/api/organizer/profile`, profile, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error("Failed to update profile.");
      console.error(err);
    }
  };

  const deleteEvent = async (id) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      await axios.delete(`${API}/api/events/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEvents(events.filter((e) => e._id !== id));
      toast.success("Event deleted successfully!");
    } catch (err) {
      toast.error("Failed to delete event.");
      console.error(err);
    }
  };

  const createEvent = async () => {
    const fd = new FormData();
    Object.keys(form).forEach((k) => {
      if (k === "images" && form.images) {
        [...form.images].forEach((img) => fd.append("images", img));
      } else { fd.append(k, form[k]); }
    });
    try {
      if (form._id) {
        await axios.put(`${API}/api/events/${form._id}`, fd, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
        });
      } else {
        await axios.post(`${API}/api/events`, fd, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
        });
      }
      setForm({}); setMenu("events"); fetchEvents();
    } catch (err) {
      toast.error("Failed to save event. Please try again.");
      console.error(err);
    }
  };

  const handleEndEvent = async () => {
    if (!templateFile) { toast.error("Please upload a certificate template first."); return; }
    if (!window.confirm("End event and open 10-minute claim window?")) return;
    setIsEnding(true);
    const img = imgRef.current;
    const scaleX = img.naturalWidth / img.clientWidth;
    const scaleY = img.naturalHeight / img.clientHeight;
    const fd = new FormData();
    fd.append("certificateTemplate", templateFile);
    fd.append("nameX", (namePosition.x * scaleX).toFixed(2));
    fd.append("nameY", (namePosition.y * scaleY).toFixed(2));
    fd.append("codeX", (codePosition.x * scaleX).toFixed(2));
    fd.append("codeY", (codePosition.y * scaleY).toFixed(2));
    fd.append("nameSize", (nameFontSize * scaleX).toFixed(2));
    try {
      await axios.post(`${API}/api/events/${selectedEvent._id}/end`, fd, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      setClaimUrl(`${window.location.origin}/claim/${selectedEvent._id}`);
      setTimeLeft(600);
      setShowCertModal(false);
      setShowQRModal(true);
      fetchEvents();
    } catch (err) {
      toast.error("Error ending event. Please try again.");
      console.error(err);
    } finally {
      setIsEnding(false);
    }
  };

  const downloadExcel = async (eventId) => {
    try {
      const response = await axios.get(`${API}/api/events/${eventId}/report`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Event_Report_${eventId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error("Failed to download report. Please try again.");
      console.error(err);
    }
  };

  const isMyEvent = (event) => (
    typeof event.organizerId === "string"
      ? event.organizerId === userId
      : event.organizerId?._id === userId
  );
  const visibleEvents = filter === "my" ? events.filter(isMyEvent) : events;

  const navItems = [
    { key: "events", label: "Events", icon: Calendar },
    { key: "add", label: "Add Event", icon: Plus },
    { key: "profile", label: "My Profile", icon: User },
  ];

  const handleNavClick = (key) => {
    if (key === "add") setForm({});
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

      {/* SIDEBAR MOBILE (slide-in) */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
            transition={{ type: "tween", duration: 0.25 }}
            className="fixed top-0 left-0 h-full w-64 bg-gray-900 text-white flex flex-col z-30 lg:hidden"
          >
            <SidebarContent
              menu={menu} navItems={navItems} handleNavClick={handleNavClick}
              showClose onClose={() => setSidebarOpen(false)}
            />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* SIDEBAR DESKTOP */}
      <aside className="hidden lg:flex w-64 bg-gray-900 text-white flex-col shrink-0">
        <SidebarContent menu={menu} navItems={navItems} handleNavClick={handleNavClick} />
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* MOBILE TOP BAR */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-gray-900 text-white shrink-0">
          <span className="text-lg font-bold">Organizer Panel</span>
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-gray-700 transition-colors">
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <main className="flex-1 bg-gray-50 overflow-y-auto">
          <div className="p-4 lg:p-8">

            {/* EVENTS */}
            {menu === "events" && (
              <>
                <div className="mb-5 lg:mb-8">
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">Event Management</h1>
                  <p className="text-sm text-gray-500">Manage your events and track registrations</p>
                </div>

                <div className="flex gap-3 mb-5 lg:mb-8">
                  {["all", "my"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filter === f ? "bg-indigo-600 text-white shadow-lg" : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                      }`}
                    >
                      {f === "all" ? "All Events" : "My Events"}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                  {visibleEvents.map((e) => (
                    <motion.div
                      key={e._id}
                      whileHover={{ scale: 1.02 }}
                      className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer relative border border-gray-100"
                      onClick={() => setSelectedEvent(e)}
                    >
                      {e.status === "ended" && (
                        <span className="absolute top-3 right-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full z-10 font-medium shadow">
                          Completed
                        </span>
                      )}
                      <div className="h-40 lg:h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                        {e.images?.[0] ? (
                          <img src={`${API}${e.images[0]}`} className="h-full w-full object-cover" alt="event" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-gray-400">
                            <Calendar size={40} />
                          </div>
                        )}
                      </div>
                      <div className="p-4 lg:p-6">
                        <h4 className="font-bold text-base lg:text-lg text-gray-900 mb-1 truncate">{e.title}</h4>
                        <p className="text-xs lg:text-sm text-gray-500 mb-3">
                          Registered: <span className="font-semibold text-indigo-600">{e.registeredStudents?.length || 0}</span> students
                        </p>
                        {isMyEvent(e) && (
                          <div className="flex gap-3 pt-3 border-t border-gray-100">
                            <button
                              className="flex items-center gap-1 text-blue-600 text-xs font-medium hover:text-blue-700 transition-colors"
                              onClick={(ev) => { ev.stopPropagation(); setForm({ ...e }); setMenu("add"); }}
                            >
                              <Edit size={14} /> Edit
                            </button>
                            <button
                              onClick={(ev) => { ev.stopPropagation(); deleteEvent(e._id); }}
                              className="flex items-center gap-1 text-red-600 text-xs font-medium hover:text-red-700 transition-colors"
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </>
            )}

            {/* PROFILE */}
            {menu === "profile" && (
              <div className="max-w-2xl mx-auto">
                <div className="mb-5">
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">My Profile</h1>
                  <p className="text-sm text-gray-500">Manage your organizer account information</p>
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
                      onClick={handleUpdateProfile}
                      className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-lg"
                    >
                      Save Changes
                    </button>
                  </div>
                </motion.div>
              </div>
            )}

            {/* ADD / EDIT EVENT */}
            {menu === "add" && (
              <div className="max-w-2xl mx-auto">
                <div className="mb-5">
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
                    {form._id ? "Edit Event" : "Create New Event"}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {form._id ? "Update your event details" : "Fill in the details to create a new event"}
                  </p>
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-5 lg:p-6 rounded-2xl shadow-lg border border-gray-100"
                >
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                      <input
                        className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        placeholder="Enter event title"
                        value={form.title || ""}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Event Description</label>
                      <textarea
                        className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors h-24 resize-none"
                        placeholder="Describe your event..."
                        value={form.description || ""}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input
                          type="date"
                          className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                          value={form.startDate || ""}
                          onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <input
                          type="date"
                          className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                          value={form.endDate || ""}
                          onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Event Images</label>
                      <input
                        type="file" multiple accept="image/*"
                        className="w-full p-3 border border-gray-200 rounded-xl text-sm file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        onChange={(e) => setForm({ ...form, images: e.target.files })}
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => setMenu("events")}
                        className="px-5 py-2 text-sm text-gray-600 font-medium hover:text-gray-800 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={createEvent}
                        className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-lg"
                      >
                        {form._id ? "Update Event" : "Create Event"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* EVENT DETAIL MODAL */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-3 lg:p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white w-full max-w-4xl rounded-2xl relative flex flex-col lg:flex-row max-h-[92vh] overflow-hidden shadow-2xl"
            >
              <button
                onClick={() => setSelectedEvent(null)}
                className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-gray-100 text-gray-600 shadow"
              >
                <X size={16} />
              </button>

              {/* Image */}
              <div className="w-full lg:w-1/2 h-48 lg:h-auto bg-gradient-to-br from-gray-100 to-gray-200 shrink-0">
                {selectedEvent.images?.[0] ? (
                  <img src={`${API}${selectedEvent.images[0]}`} className="h-full w-full object-cover" alt="selected" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-gray-400"><Calendar size={48} /></div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 p-5 lg:p-8 flex flex-col justify-between overflow-y-auto">
                <div>
                  <h2 className="text-xl lg:text-3xl font-bold mb-4 text-gray-900">{selectedEvent.title}</h2>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Registered Students</p>
                        <p className="text-2xl font-bold text-indigo-600">{selectedEvent.registeredStudents?.length || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Status</p>
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                          selectedEvent.status === 'ended' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {selectedEvent.status?.toUpperCase() || 'ACTIVE'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  {isMyEvent(selectedEvent) && selectedEvent.status !== "ended" && (
                    <button
                      onClick={() => setShowCertModal(true)}
                      className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-lg flex items-center justify-center gap-2"
                    >
                      <Award size={18} /> Issue Certificates
                    </button>
                  )}
                  {isMyEvent(selectedEvent) && selectedEvent.status === "ended" && (
                    <button
                      onClick={() => downloadExcel(selectedEvent._id)}
                      className="w-full bg-green-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-green-700 transition-colors shadow-lg flex items-center justify-center gap-2"
                    >
                      <Download size={18} /> Download Excel Report
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CERT MODAL */}
      <AnimatePresence>
        {showCertModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-3 lg:p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white w-full max-w-4xl rounded-2xl p-5 lg:p-8 relative max-h-[95vh] overflow-y-auto"
            >
              <button onClick={() => setShowCertModal(false)} className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600">
                <X size={16} />
              </button>
              <h2 className="text-xl lg:text-2xl font-bold mb-1">Configure Certificate</h2>
              <p className="text-xs text-gray-500 mb-5">Drag placeholders. A 10-minute claim QR will be generated.</p>

              <div className="flex flex-col sm:flex-row gap-4 mb-5">
                <input type="file" accept="image/*" className="text-sm" onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) { setTemplateFile(file); setTemplatePreview(URL.createObjectURL(file)); }
                }} />
                {templatePreview && (
                  <div className="flex items-center gap-3 bg-indigo-50 p-3 rounded-lg border border-indigo-100 flex-1">
                    <label className="text-xs font-bold text-indigo-700 whitespace-nowrap">Font Size:</label>
                    <input
                      type="range" min="10" max="150" value={nameFontSize}
                      onChange={(e) => setNameFontSize(e.target.value)}
                      className="flex-1 h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="font-bold text-indigo-700 text-sm w-8 text-right">{nameFontSize}</span>
                  </div>
                )}
              </div>

              {templatePreview && (
                <div className="relative border-4 border-dashed rounded-xl overflow-hidden bg-gray-50 flex justify-center shadow-inner">
                  <img ref={imgRef} src={templatePreview} alt="Template" className="max-w-full h-auto select-none" />
                  <Draggable nodeRef={nameRef} bounds="parent" position={namePosition} onStop={(e, data) => setNamePosition({ x: data.x, y: data.y })}>
                    <div ref={nameRef} className="absolute cursor-move font-bold bg-white/60 px-3 py-1 border-2 border-blue-600 rounded-lg shadow-lg" style={{ fontSize: `${nameFontSize}px`, color: '#1e40af' }}>
                      [ Student Name ]
                    </div>
                  </Draggable>
                  <Draggable nodeRef={codeRef} bounds="parent" position={codePosition} onStop={(e, data) => setCodePosition({ x: data.x, y: data.y })}>
                    <div ref={codeRef} className="absolute cursor-move font-mono font-bold text-lg text-red-600 bg-white/60 px-2 border-2 border-red-600 rounded-md shadow-lg">
                      ID: 000001
                    </div>
                  </Draggable>
                </div>
              )}

              <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
                <button onClick={() => setShowCertModal(false)} className="px-5 py-2 text-sm text-gray-500 font-semibold order-2 sm:order-1">
                  Cancel
                </button>
                <button
                  disabled={!templateFile || isEnding}
                  className="bg-green-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold active:scale-95 shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed order-1 sm:order-2"
                  onClick={handleEndEvent}
                >
                  {isEnding ? "Starting Timer..." : "Generate QR & End Event"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR MODAL */}
      <AnimatePresence>
        {showQRModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              className="bg-white p-6 lg:p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl"
            >
              <h2 className="text-xl lg:text-2xl font-bold text-gray-800">Scan to Claim</h2>
              <p className="text-gray-500 text-sm mb-5 font-medium">Valid for the next 10 minutes</p>
              <div className="bg-white p-4 border-2 border-gray-100 rounded-2xl shadow-inner inline-block mb-5">
                <QRCode value={claimUrl} size={180} />
              </div>
              <div className="text-3xl font-mono font-bold text-indigo-600 mb-2">
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </div>
              <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden mb-6">
                <motion.div
                  initial={{ width: "100%" }} animate={{ width: "0%" }}
                  transition={{ duration: 600, ease: "linear" }}
                  className="bg-indigo-600 h-full"
                />
              </div>
              <button
                onClick={() => { setShowQRModal(false); setSelectedEvent(null); }}
                className="w-full bg-gray-900 text-white py-3 rounded-xl text-sm font-bold hover:bg-black transition"
              >
                Done
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Sidebar helper ─── */
function SidebarContent({ menu, navItems, handleNavClick, showClose, onClose }) {
  return (
    <div className="flex flex-col h-full p-6">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold text-white">Organizer Panel</h2>
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