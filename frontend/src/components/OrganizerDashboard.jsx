import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import Draggable from "react-draggable";
import QRCode from "react-qr-code";
import toast, { Toaster } from 'react-hot-toast';
import { Calendar, Plus, User, LogOut, Edit, Trash2, Download, Award } from 'lucide-react'; 

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
  const nameRef = useRef(null);
  const codeRef = useRef(null);
  const imgRef = useRef(null);
  const token = localStorage.getItem("token");
  const userId = JSON.parse(atob(token.split(".")[1])).id;

  useEffect(() => {
    fetchEvents();
    if (menu === "profile") {
      axios.get("http://localhost:5000/api/organizer/profile", {
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
    axios.get("http://localhost:5000/api/events", {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => setEvents(res.data));
  };

  const handleUpdateProfile = async () => {
    try {
      await axios.put("http://localhost:5000/api/organizer/profile", profile, {
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
      await axios.delete(`http://localhost:5000/api/events/${id}`, {
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
        await axios.put(`http://localhost:5000/api/events/${form._id}`, fd, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
        });
      } else {
        await axios.post("http://localhost:5000/api/events", fd, {
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
    if (!templateFile) {
      toast.error("Please upload a certificate template first.");
      return;
    }
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
      await axios.post(`http://localhost:5000/api/events/${selectedEvent._id}/end`, fd, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });

      setClaimUrl(`http://localhost:3000/claim/${selectedEvent._id}`);
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
      const response = await axios.get(`http://localhost:5000/api/events/${eventId}/report`, {
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

  const isMyEvent = (event) => (typeof event.organizerId === "string" ? event.organizerId === userId : event.organizerId?._id === userId);
  const visibleEvents = filter === "my" ? events.filter(isMyEvent) : events;

  return (
    <div className="h-screen flex bg-white overflow-hidden">
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-white mb-8">Organizer Panel</h2>
          <nav className="space-y-2">
            <button 
              onClick={() => setMenu("events")} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                menu === "events" ? "bg-indigo-600 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <Calendar size={20} />
              Events
            </button>
            <button 
              onClick={() => { setMenu("add"); setForm({}); }} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                menu === "add" ? "bg-indigo-600 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <Plus size={20} />
              Add Event
            </button>
            <button 
              onClick={() => setMenu("profile")} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                menu === "profile" ? "bg-indigo-600 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <User size={20} />
              My Profile
            </button>
            <button 
              onClick={() => { localStorage.clear(); window.location.href = "/"; }} 
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors"
            >
              <LogOut size={20} />
              Logout
            </button>
          </nav>
        </div>
      </aside>

      <main className="flex-1 bg-gray-50 overflow-auto">
        <div className="p-8">
        {menu === "events" && (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Event Management</h1>
              <p className="text-gray-600">Manage your events and track registrations</p>
            </div>
            
            <div className="flex gap-4 mb-8">
              <button 
                onClick={() => setFilter("all")} 
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  filter === "all" ? "bg-indigo-600 text-white shadow-lg" : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                }`}
              >
                All Events
              </button>
              <button 
                onClick={() => setFilter("my")} 
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  filter === "my" ? "bg-indigo-600 text-white shadow-lg" : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                }`}
              >
                My Events
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleEvents.map((e) => (
                <motion.div 
                  key={e._id} 
                  whileHover={{ scale: 1.02 }} 
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer relative border border-gray-100" 
                  onClick={() => setSelectedEvent(e)}
                >
                  {e.status === "ended" && (
                    <span className="absolute top-3 right-3 bg-red-500 text-white text-xs px-3 py-1 rounded-full z-10 font-medium shadow-lg">
                      Completed
                    </span>
                  )}
                  <div className="h-48 bg-linear-to-br from-gray-100 to-gray-200">
                    {e.images?.[0] ? (
                      <img src={`http://localhost:5000${e.images[0]}`} className="h-full w-full object-cover" alt="event" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-gray-400">
                        <Calendar size={48} />
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h4 className="font-bold text-lg text-gray-900 mb-2 truncate">{e.title}</h4>
                    <p className="text-sm text-gray-600 mb-4">Registered: <span className="font-semibold text-indigo-600">{e.registeredStudents?.length || 0}</span> students</p>
                    {isMyEvent(e) && (
                      <div className="flex gap-3 pt-3 border-t border-gray-100">
                        <button 
                          className="flex items-center gap-2 text-blue-600 text-sm font-medium hover:text-blue-700 transition-colors" 
                          onClick={(ev) => { ev.stopPropagation(); setForm({ ...e }); setMenu("add"); }}
                        >
                          <Edit size={16} />
                          Edit
                        </button>
                        <button 
                          onClick={(ev) => { ev.stopPropagation(); deleteEvent(e._id); }} 
                          className="flex items-center gap-2 text-red-600 text-sm font-medium hover:text-red-700 transition-colors"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {menu === "profile" && (
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">My Profile</h1>
              <p className="text-gray-600">Manage your organizer account information</p>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100"
            >
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                  <input 
                    disabled 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 font-medium" 
                    value={profile.username || ""} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input 
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" 
                    value={profile.name || ""} 
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })} 
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input 
                    type="email"
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" 
                    value={profile.email || ""} 
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })} 
                    placeholder="Enter your email address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
                  <input 
                    type="tel"
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" 
                    value={profile.mobile || ""} 
                    onChange={(e) => setProfile({ ...profile, mobile: e.target.value })} 
                    placeholder="Enter your mobile number"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button 
                  onClick={handleUpdateProfile} 
                  className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {selectedEvent && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-6xl rounded-2xl p-8 relative flex flex-col lg:flex-row gap-8 max-h-[90vh] overflow-hidden shadow-2xl border border-gray-100">
              <button 
                onClick={() => setSelectedEvent(null)} 
                className="absolute top-4 right-4 text-2xl text-gray-400 hover:text-gray-600 transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
              >
                ✕
              </button>
              
              <div className="lg:w-1/2 h-64 lg:h-auto bg-linear-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden">
                {selectedEvent.images?.[0] ? (
                  <img src={`http://localhost:5000${selectedEvent.images[0]}`} className="h-full w-full object-cover" alt="selected" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-gray-400">
                    <Calendar size={64} />
                  </div>
                )}
              </div>
              
              <div className="lg:w-1/2 flex flex-col justify-between overflow-y-auto">
                <div>
                  <h2 className="text-3xl font-bold mb-4 text-gray-900">{selectedEvent.title}</h2>
                  <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Registered Students</p>
                        <p className="text-2xl font-bold text-indigo-600">{selectedEvent.registeredStudents?.length || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Status</p>
                        <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                          selectedEvent.status === 'ended' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {selectedEvent.status?.toUpperCase() || 'ACTIVE'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {isMyEvent(selectedEvent) && selectedEvent.status !== "ended" && (
                    <button 
                      onClick={() => setShowCertModal(true)} 
                      className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                    >
                      <Award size={20} />
                      Issue Certificates
                    </button>
                  )}
                  {isMyEvent(selectedEvent) && selectedEvent.status === "ended" && (
                    <button 
                      onClick={() => downloadExcel(selectedEvent._id)} 
                      className="w-full bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                    >
                      <Download size={20} />
                      Download Excel Report
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {showCertModal && (
          <div className="fixed inset-0 bg-black/70 z-60 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-5xl rounded-2xl p-8 relative max-h-[95vh] overflow-y-auto">
              <button onClick={() => setShowCertModal(false)} className="absolute top-4 right-4 text-2xl">✕</button>
              <h2 className="text-2xl font-bold mb-2">Configure Certificate</h2>
              <p className="text-sm text-gray-500 mb-6">Drag placeholders. A 10-minute claim QR will be generated.</p>
              
              <div className="flex flex-col md:flex-row gap-6 mb-6">
                <input type="file" accept="image/*" className="block text-sm" onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) { setTemplateFile(file); setTemplatePreview(URL.createObjectURL(file)); }
                }} />
                {templatePreview && (
                  <div className="flex-1 flex items-center gap-4 bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                    <label className="text-xs font-bold text-indigo-700 uppercase">Size:</label>
                    <input type="range" min="10" max="150" value={nameFontSize} onChange={(e) => setNameFontSize(e.target.value)} className="flex-1 h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer" />
                    <span className="font-bold text-indigo-700 w-8">{nameFontSize}</span>
                  </div>
                )}
              </div>

              {templatePreview && (
                <div className="relative border-4 border-dashed rounded-xl overflow-hidden bg-gray-50 flex justify-center shadow-inner">
                  <img ref={imgRef} src={templatePreview} alt="Template" className="max-w-full h-auto select-none" />
                  <Draggable nodeRef={nameRef} bounds="parent" position={namePosition} onStop={(e, data) => setNamePosition({ x: data.x, y: data.y })}>
                    <div ref={nameRef} className="absolute cursor-move font-bold bg-white/60 px-3 py-1 border-2 border-blue-600 rounded-lg shadow-lg" style={{ fontSize: `${nameFontSize}px`, color: '#1e40af' }}>[ Student Name ]</div>
                  </Draggable>
                  <Draggable nodeRef={codeRef} bounds="parent" position={codePosition} onStop={(e, data) => setCodePosition({ x: data.x, y: data.y })}>
                    <div ref={codeRef} className="absolute cursor-move font-mono font-bold text-lg text-red-600 bg-white/60 px-2 border-2 border-red-600 rounded-md shadow-lg">ID: 000001</div>
                  </Draggable>
                </div>
              )}

              <div className="mt-8 flex justify-end gap-4">
                <button onClick={() => setShowCertModal(false)} className="px-6 py-2 text-gray-500 font-semibold">Cancel</button>
                <button disabled={!templateFile || isEnding} className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold active:scale-95 shadow-lg disabled:bg-gray-400" onClick={handleEndEvent}>
                  {isEnding ? "Starting Timer..." : "Generate QR & End Event"}
                </button>
              </div>
            </div>
          </div>
        )}

        {showQRModal && (
          <div className="fixed inset-0 bg-black/90 z-70 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl">
              <h2 className="text-2xl font-bold text-gray-800">Scan to Claim</h2>
              <p className="text-gray-500 text-sm mb-6 font-medium">Valid for the next 10 minutes</p>
              
              <div className="bg-white p-4 border-2 border-gray-100 rounded-2xl shadow-inner inline-block mb-6">
                <QRCode value={claimUrl} size={200} />
              </div>

              <div className="text-3xl font-mono font-bold text-indigo-600 mb-2">
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </div>
              <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden mb-8">
                <motion.div 
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 600, ease: "linear" }}
                  className="bg-indigo-600 h-full"
                />
              </div>

              <button 
                onClick={() => { setShowQRModal(false); setSelectedEvent(null); }} 
                className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-black transition"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {menu === "add" && (
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{form._id ? "Edit Event" : "Create New Event"}</h1>
              <p className="text-gray-600">{form._id ? "Update your event details" : "Fill in the details to create a new event"}</p>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100"
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Event Title</label>
                  <input 
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" 
                    placeholder="Enter event title" 
                    value={form.title || ""} 
                    onChange={(e) => setForm({ ...form, title: e.target.value })} 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Event Description</label>
                  <textarea 
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors h-24 resize-none" 
                    placeholder="Describe your event..." 
                    value={form.description || ""} 
                    onChange={(e) => setForm({ ...form, description: e.target.value })} 
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input 
                      type="date" 
                      className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" 
                      value={form.startDate || ""} 
                      onChange={(e) => setForm({ ...form, startDate: e.target.value })} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                    <input 
                      type="date" 
                      className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" 
                      value={form.endDate || ""} 
                      onChange={(e) => setForm({ ...form, endDate: e.target.value })} 
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Event Images</label>
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*"
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" 
                    onChange={(e) => setForm({ ...form, images: e.target.files })} 
                  />
                </div>
                
                <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                  <button 
                    onClick={() => setMenu("events")} 
                    className="px-6 py-2 text-gray-600 font-medium hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={createEvent} 
                    className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl"
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
      
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '14px',
            fontWeight: '500'
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff'
            }
          },
          error: {
            iconTheme: {
              primary: '#EF4444', 
              secondary: '#fff'
            }
          }
        }}
      />
    </div>
  );
}