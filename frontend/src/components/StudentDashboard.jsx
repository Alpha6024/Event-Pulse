import { useEffect, useState } from "react";
import axios from "axios";
import { Html5QrcodeScanner } from "html5-qrcode";
import { motion } from "framer-motion";
import toast, { Toaster } from 'react-hot-toast';
import { Calendar, User, LogOut, QrCode, Download, UserCheck, UserX, Search, X, Save } from 'lucide-react';

export default function StudentDashboard() {
  const [menu, setMenu] = useState("events");
  const [events, setEvents] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [profile, setProfile] = useState({});
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [search, setSearch] = useState("");
  const [showScanner, setShowScanner] = useState(false);

  const token = localStorage.getItem("token");
  if (!token) window.location.href = "/";

  const authHeader = {
    headers: { Authorization: `Bearer ${token}` },
  };

  const handleUnauthorized = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (menu === "events" || menu === "myEvents") {
          const res = await axios.get("http://localhost:5000/api/events", authHeader);
          setEvents(res.data);
          const myRes = await axios.get("http://localhost:5000/api/student/my-events", authHeader);
          setMyEvents(myRes.data);
        }
        if (menu === "profile") {
          const res = await axios.get("http://localhost:5000/api/student/profile", authHeader);
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
      scanner = new Html5QrcodeScanner("reader", { 
        fps: 10, 
        qrbox: { width: 250, height: 250 } 
      });

      scanner.render((decodedText) => {
       
        const parts = decodedText.split("/");
        const eventId = parts[parts.length - 1];
        
        if (eventId) {
          scanner.clear();
          setShowScanner(false);
          handleClaimCertificate(eventId);
        }
      }, (error) => {
       console.log(error);
       
      });
    }
    return () => { if (scanner) scanner.clear(); };
  }, [showScanner]);

  const handleClaimCertificate = async (eventId) => {
    try {
      await axios.post(`http://localhost:5000/api/events/${eventId}/claim`, {}, authHeader);
      toast.success("Certificate claimed successfully!");
      
      const myRes = await axios.get("http://localhost:5000/api/student/my-events", authHeader);
      setMyEvents(myRes.data);
  
      const event = myRes.data.find(e => e._id === eventId);
      if (event) downloadCertificate(eventId, event.title);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to claim certificate. Ensure the 10-min window is open.");
    }
  };

  const filterEvents = (list) =>
    list.filter(
      (e) =>
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.description.toLowerCase().includes(search.toLowerCase())
    );

  const registerEvent = async (id) => {
    try {
      await axios.post(`http://localhost:5000/api/events/register/${id}`, {}, authHeader);
      const [allRes, myRes] = await Promise.all([
        axios.get("http://localhost:5000/api/events", authHeader),
        axios.get("http://localhost:5000/api/student/my-events", authHeader),
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
      await axios.delete(`http://localhost:5000/api/events/unregister/${id}`, authHeader);
      const [allRes, myRes] = await Promise.all([
        axios.get("http://localhost:5000/api/events", authHeader),
        axios.get("http://localhost:5000/api/student/my-events", authHeader),
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
      const certUrl = `http://localhost:5000/uploads/cert-${eventId}-${userId}.png`;
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
      await axios.put("http://localhost:5000/api/student/profile", {
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

  const getCertificateCode = (event) => {
    const userId = JSON.parse(atob(token.split(".")[1])).id;
    const index = event.registeredStudents.findIndex(s => 
        (typeof s === 'string' ? s === userId : s._id === userId)
    );
    return index !== -1 ? String(index + 1).padStart(6, '0') : "N/A";
  };

  return (
    <div className="h-screen flex bg-white overflow-hidden">
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-white mb-8">Student Panel</h2>
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
              onClick={() => setMenu("myEvents")} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                menu === "myEvents" ? "bg-indigo-600 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <UserCheck size={20} />
              My Events
            </button>
            <button 
              onClick={() => setShowScanner(true)} 
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-green-400 hover:bg-green-900/20 hover:text-green-300 transition-colors"
            >
              <QrCode size={20} />
              Scan QR to Claim
            </button>
            <button 
              onClick={() => setMenu("profile")} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                menu === "profile" ? "bg-indigo-600 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <User size={20} />
              Profile
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
        {menu !== "profile" && (
          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search events..."
              className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}

        {menu === "events" && (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Available Events</h1>
              <p className="text-gray-600">Browse and register for upcoming events</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterEvents(events).map((e) => (
                <motion.div 
                  key={e._id} 
                  whileHover={{ scale: 1.02 }} 
                  onClick={() => setSelectedEvent(e)} 
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer relative border border-gray-100"
                >
                  {e.status === "ended" && (
                    <span className="absolute top-3 right-3 bg-red-500 text-white text-xs px-3 py-1 rounded-full z-10 font-medium shadow-lg">
                      Ended
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
                    <h3 className="font-bold text-lg text-gray-900 mb-2 truncate">{e.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{e.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {menu === "myEvents" && (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Events</h1>
              <p className="text-gray-600">Track your registered events and download certificates</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterEvents(myEvents).map((e) => (
                <motion.div 
                  key={e._id} 
                  whileHover={{ scale: 1.02 }} 
                  onClick={() => setSelectedEvent(e)} 
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer border border-gray-100"
                >
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
                    <h3 className="font-bold text-lg text-gray-900 mb-2 truncate">{e.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-1 mb-4">{e.description}</p>
                    
                    {e.status === "ended" && (
                      <div className="pt-4 border-t border-gray-100">
                        <button 
                          onClick={(ev) => { ev.stopPropagation(); downloadCertificate(e._id, e.title); }}
                          className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                        >
                          <Download size={16} />
                          Download Certificate
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
              <p className="text-gray-600">Manage your student account information</p>
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
                  onClick={updateProfile} 
                  className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <Save size={16} />
                  Save Changes
                </button>
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


      {showScanner && (
        <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-100 p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Scan Organizer QR</h2>
              <button onClick={() => setShowScanner(false)} className="text-gray-500 text-xl">✕</button>
            </div>
            <div id="reader" className="overflow-hidden rounded-lg"></div>
            <p className="text-center text-xs text-gray-500 mt-4">Point your camera at the certificate claim QR code</p>
          </div>
        </div>
      )}

        {selectedEvent && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] relative overflow-hidden border border-gray-100">
              <button 
                onClick={() => setSelectedEvent(null)} 
                className="absolute top-4 right-4 text-2xl text-gray-400 hover:text-gray-600 transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 z-20"
              >
                <X size={20} />
              </button>
              
              <div className="h-64 bg-linear-to-br from-gray-100 to-gray-200 shrink-0 relative">
                {selectedEvent.images?.[0] ? (
                  <img src={`http://localhost:5000${selectedEvent.images[0]}`} className="h-full w-full object-cover" alt="header" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-gray-400">
                    <Calendar size={64} />
                  </div>
                )}
              </div>
              
              <div className="p-8 overflow-y-auto flex-1">
                <h2 className="text-3xl font-bold mb-4 text-gray-900">{selectedEvent.title}</h2>
                <div className="mb-6">
                  <h4 className="font-bold text-gray-700 mb-2 text-sm uppercase tracking-wide">Description</h4>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{selectedEvent.description}</p>
                </div>
              </div>
              
              <div className="p-8 border-t border-gray-200 bg-gray-50 shrink-0">
                {selectedEvent.status === "ended" ? (
                  <div className="flex flex-col gap-4">
                    {isRegistered(selectedEvent._id) && (
                      <button 
                        onClick={() => downloadCertificate(selectedEvent._id, selectedEvent.title)} 
                        className="w-full bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 shadow-lg hover:shadow-xl transition-colors flex items-center justify-center gap-3"
                      >
                        <Download size={20} />
                        Download My Certificate
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex gap-4">
                    {!isRegistered(selectedEvent._id) ? (
                      <button 
                        onClick={() => registerEvent(selectedEvent._id)} 
                        className="flex-1 bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 shadow-lg transition-colors flex items-center justify-center gap-3"
                      >
                        <UserCheck size={20} />
                        Register Now
                      </button>
                    ) : (
                      <button 
                        onClick={() => unregisterEvent(selectedEvent._id)} 
                        className="flex-1 bg-red-500 text-white py-4 rounded-xl font-bold hover:bg-red-600 shadow-lg transition-colors flex items-center justify-center gap-3"
                      >
                        <UserX size={20} />
                        Cancel Registration
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
    </div>
  );
}