import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Camera, 
  Users, 
  CheckCircle2, 
  Clock, 
  Wifi, 
  Activity,
  Maximize2,
  FlipHorizontal,
  Zap,
  TrendingUp,
  UserPlus
} from 'lucide-react';
import { attendanceAPI, studentsAPI } from '../services/api';
import { registerStream, registerVideoElement, unregisterStream, unregisterVideoElement, forceCleanupAllCameraResources } from '../utils/cameraCleanup';
import QuickRegisterModal from './QuickRegisterModal';

const LiveAttendance = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [stream, setStream] = useState(null);
  const [markedStudents, setMarkedStudents] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMirrored, setIsMirrored] = useState(true);
  const [lastMarkedStudent, setLastMarkedStudent] = useState(null);
  const [sessionTime, setSessionTime] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [showQuickRegister, setShowQuickRegister] = useState(false);
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [capturedUrl, setCapturedUrl] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const eventSourceRef = useRef(null);
  const processingTimeoutRef = useRef(null);

  // Cleanup function
  const cleanup = () => {
    console.log('Cleaning up camera and resources...');
    
    // Clean up camera stream
    if (streamRef.current) {
      unregisterStream(streamRef.current);
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped track:', track.kind);
      });
      streamRef.current = null;
    }
    
    // Clean up video element
    if (videoRef.current) {
      unregisterVideoElement(videoRef.current);
      videoRef.current.srcObject = null;
      videoRef.current.pause();
    }
    
    // Clean up event source
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    // Clean up processing interval
    if (processingTimeoutRef.current) {
      clearInterval(processingTimeoutRef.current);
      processingTimeoutRef.current = null;
    }
    
    // Reset states
    setIsConnected(false);
    setStream(null);
    
    // Force cleanup of all camera resources
    forceCleanupAllCameraResources();
  };

  useEffect(() => {
    initWebcam();
    initAttendanceStream();

    // Add beforeunload listener for cleanup
    const handleBeforeUnload = () => {
      cleanup();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      cleanup();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [courseId]);

  // Session timer
  useEffect(() => {
    if (isConnected) {
      const timer = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isConnected]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const initWebcam = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640,
          height: 480,
          facingMode: 'user'
        } 
      });
      
      // Store stream in ref for proper cleanup
      streamRef.current = mediaStream;
      registerStream(mediaStream);
      setStream(mediaStream);
      setIsConnected(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        registerVideoElement(videoRef.current);
      }

      processingTimeoutRef.current = setInterval(processFrame, 5000);
    } catch (error) {
      console.error('Error accessing webcam:', error);
      alert('Could not access webcam. Please check permissions.');
    }
  };

  const initAttendanceStream = () => {
    eventSourceRef.current = attendanceAPI.streamLiveAttendance(courseId);
    
    eventSourceRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMarkedStudents(data);
    };

    eventSourceRef.current.onerror = () => {
      eventSourceRef.current.close();
      setTimeout(initAttendanceStream, 5000);
    };
  };

  const handleQuickRegisterClick = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    
    // Handle mirroring if active
    if (isMirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    
    ctx.drawImage(videoRef.current, 0, 0);
    
    canvas.toBlob((blob) => {
      if (blob) {
        setCapturedBlob(blob);
        setCapturedUrl(URL.createObjectURL(blob));
        setShowQuickRegister(true);
      }
    }, 'image/jpeg', 0.9);
  };

  const processFrame = async () => {
    if (!videoRef.current || isProcessing) return;

    setIsProcessing(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      console.log(`Processing frame: ${canvas.width}x${canvas.height}`);

      const blob = await new Promise(resolve => {
        canvas.toBlob(resolve, 'image/jpeg', 0.9);
      });

      console.log(`Frame blob size: ${blob.size} bytes`);

      const formData = new FormData();
      formData.append('photo', blob, 'frame.jpg');

      const response = await fetch('http://localhost:5001/verify', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      console.log('CV Engine face recognition response:', result);

      if (result.success && result.recognized && result.recognized.length > 0) {
        const recognizedStudentIds = result.recognized.map(r => r.student_id);

        const attendanceResponse = await attendanceAPI.markByFaceRecognition(courseId, recognizedStudentIds);
        console.log('Attendance marked:', attendanceResponse);

        // Try to fetch student details for each recognized id so we can show real names
        const studentFetches = result.recognized.map(r =>
          studentsAPI.getById(r.student_id)
            .then(res => ({
              id: r.student_id,
              name: res.data?.data?.name || `Student ${r.student_id}`,
              time: new Date().toLocaleTimeString(),
              confidence: r.confidence
            }))
            .catch(err => {
              // If fetching fails, fallback to ID-based name
              console.warn(`Failed to fetch student ${r.student_id}:`, err);
              return {
                id: r.student_id,
                name: `Student ${r.student_id}`,
                time: new Date().toLocaleTimeString(),
                confidence: r.confidence
              };
            })
        );

        const newMarkedStudents = await Promise.all(studentFetches);

        setMarkedStudents(prev => {
          const existingIds = prev.map(s => s.id);
          const uniqueNewStudents = newMarkedStudents.filter(s => !existingIds.includes(s.id));

          if (uniqueNewStudents.length > 0) {
            setLastMarkedStudent(uniqueNewStudents[0]);
            setTimeout(() => setLastMarkedStudent(null), 3000);
          }

          return [...prev, ...uniqueNewStudents];
        });
      }

    } catch (error) {
      console.error('Error processing frame:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Success Notification */}
        <AnimatePresence>
          {lastMarkedStudent && (
            <motion.div
              initial={{ opacity: 0, y: -50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -50, scale: 0.9 }}
              className="fixed top-6 right-6 z-50"
            >
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border-2 border-white">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5, repeat: 2 }}
                >
                  <CheckCircle2 size={24} />
                </motion.div>
                <div>
                  <p className="font-bold text-lg">Attendance Marked!</p>
                  <p className="text-sm text-green-100">
                    Student {lastMarkedStudent.id} • {Math.round(lastMarkedStudent.confidence * 100)}% confidence
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <motion.div 
          className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
          variants={itemVariants}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <motion.button
                onClick={() => {
                  cleanup();
                  // Additional cleanup before navigation
                  setTimeout(() => {
                    forceCleanupAllCameraResources();
                    navigate(-1);
                  }, 100);
                }}
                className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                whileHover={{ scale: 1.05, x: -3 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft size={20} className="text-gray-700" />
              </motion.button>
              
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">Live Attendance</h1>
                  <motion.div
                    className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold"
                    style={{ 
                      backgroundColor: isConnected ? '#DEF7EC' : '#FEE2E2',
                      color: isConnected ? '#047857' : '#DC2626'
                    }}
                    animate={isConnected ? {
                      scale: [1, 1.05, 1],
                    } : {}}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <Wifi size={14} />
                    {isConnected ? 'ACTIVE' : 'DISCONNECTED'}
                  </motion.div>
                </div>
                <p className="text-sm text-gray-500 mt-1">Course {courseId} • Real-time face recognition</p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4">
              <motion.div 
                className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-xl border border-blue-200"
                whileHover={{ scale: 1.05 }}
              >
                <Clock size={18} style={{ color: '#3B82F6' }} />
                <div>
                  <p className="text-xs text-gray-600 font-medium">Session</p>
                  <p className="text-lg font-bold text-gray-900">{formatTime(sessionTime)}</p>
                </div>
              </motion.div>
              
              <motion.div 
                className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-xl border border-green-200"
                whileHover={{ scale: 1.05 }}
              >
                <Users size={18} style={{ color: '#10B981' }} />
                <div>
                  <p className="text-xs text-gray-600 font-medium">Present</p>
                  <p className="text-lg font-bold text-gray-900">{markedStudents.length}</p>
                </div>
              </motion.div>

              <motion.div 
                className="flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-xl border border-purple-200"
                whileHover={{ scale: 1.05 }}
              >
                <Activity size={18} style={{ color: '#A855F7' }} />
                <div>
                  <p className="text-xs text-gray-600 font-medium">Status</p>
                  <p className="text-sm font-bold" style={{ color: isProcessing ? '#F97316' : '#10B981' }}>
                    {isProcessing ? 'Scanning' : 'Ready'}
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Feed */}
          <motion.div 
            className="lg:col-span-2"
            variants={itemVariants}
          >
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera size={20} className="text-gray-700" />
                    <h2 className="font-bold text-gray-900">Camera Feed</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.button
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors bg-purple-100 text-purple-700 hover:bg-purple-200"
                      onClick={handleQuickRegisterClick}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <UserPlus size={16} />
                      Quick Register
                    </motion.button>
                    
                    <motion.button
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: isMirrored ? '#3B82F6' : '#E5E7EB',
                        color: isMirrored ? 'white' : '#374151'
                      }}
                      onClick={() => setIsMirrored(!isMirrored)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FlipHorizontal size={16} />
                      Mirror
                    </motion.button>
                  </div>
                </div>
              </div>
              
              <div className="relative bg-black aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ transform: isMirrored ? 'scaleX(-1)' : 'none' }}
                />
                
                {/* Processing Overlay */}
                <AnimatePresence>
                  {isProcessing && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-blue-500/20 backdrop-blur-[1px] flex items-center justify-center"
                    >
                      <motion.div
                        className="bg-white rounded-2xl px-6 py-4 shadow-2xl flex items-center gap-3"
                        animate={{
                          scale: [1, 1.05, 1],
                        }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Zap size={24} style={{ color: '#3B82F6' }} />
                        </motion.div>
                        <div>
                          <p className="font-bold text-gray-900">Scanning Faces...</p>
                          <p className="text-sm text-gray-600">Processing frame</p>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Recording Indicator */}
                {isConnected && (
                  <motion.div
                    className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: '#EF4444' }}
                    animate={{
                      opacity: [1, 0.7, 1],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <div className="w-2 h-2 bg-white rounded-full" />
                    LIVE
                  </motion.div>
                )}

                {/* Grid Overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="w-full h-full" style={{
                    backgroundImage: `
                      linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: '50px 50px'
                  }} />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Attendance List */}
          <motion.div 
            className="lg:col-span-1"
            variants={itemVariants}
          >
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 h-full flex flex-col">
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={20} style={{ color: '#10B981' }} />
                    <h2 className="font-bold text-gray-900">Marked Students</h2>
                  </div>
                  <motion.span 
                    className="px-3 py-1 rounded-full text-xs font-bold"
                    style={{ backgroundColor: '#DEF7EC', color: '#047857' }}
                    animate={{
                      scale: markedStudents.length > 0 ? [1, 1.1, 1] : 1
                    }}
                    transition={{
                      duration: 0.3
                    }}
                  >
                    {markedStudents.length}
                  </motion.span>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <AnimatePresence mode="popLayout">
                  {markedStudents.length === 0 ? (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex flex-col items-center justify-center h-full py-12 text-center"
                    >
                      <motion.div
                        animate={{
                          y: [0, -10, 0]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <Users size={48} className="text-gray-300 mb-4" />
                      </motion.div>
                      <p className="text-gray-500 font-medium">No students marked</p>
                      <p className="text-sm text-gray-400 mt-2">Faces will be detected automatically</p>
                    </motion.div>
                  ) : (
                    <div className="space-y-3">
                      {markedStudents.map((student, index) => (
                        <motion.div
                          key={`${student.id}-${index}`}
                          initial={{ opacity: 0, x: -20, scale: 0.9 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          exit={{ opacity: 0, x: 20, scale: 0.9 }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-gradient-to-r from-green-50 to-white border border-green-200 rounded-xl p-4 hover:shadow-md transition-all"
                          whileHover={{ x: 3 }}
                        >
                          <div className="flex items-center gap-3">
                            <motion.div 
                              className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-lg"
                              style={{ backgroundColor: '#10B981' }}
                              whileHover={{ scale: 1.1, rotate: 5 }}
                            >
                              {student.name && student.name.length > 0 ? student.name.charAt(0).toUpperCase() : 'S'}
                            </motion.div>
                            <div className="flex-1">
                              <p className="font-bold text-gray-900">{student.name || 'Unknown Student'}</p>
                              <p className="text-xs text-gray-500">ID: {student.id}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Clock size={12} className="text-gray-400" />
                                <span className="text-xs text-gray-600">{student.time}</span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <CheckCircle2 size={20} style={{ color: '#10B981' }} />
                              {student.confidence && (
                                <motion.span 
                                  className="text-xs font-bold px-2 py-0.5 rounded"
                                  style={{ backgroundColor: '#DEF7EC', color: '#047857' }}
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ delay: 0.2 }}
                                >
                                  {Math.round(student.confidence * 100)}%
                                </motion.span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <style jsx>{`
        .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }
        .overflow-y-auto::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
      
      <QuickRegisterModal 
        isOpen={showQuickRegister}
        onClose={() => setShowQuickRegister(false)}
        imageBlob={capturedBlob}
        imageUrl={capturedUrl}
      />
    </motion.div>
  );
};

export default LiveAttendance;