import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Camera, Save, Loader2 } from 'lucide-react';
import { studentsAPI } from '../services/api';

const QuickRegisterModal = ({ isOpen, onClose, imageBlob, imageUrl }) => {
  const [formData, setFormData] = useState({
    name: '',
    studentId: '',
    email: '',
    department: '',
    year: '',
    section: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // 1. Create student record in Node backend
      await studentsAPI.create(formData);
      
      // 2. Enroll face in CV engine
      const photoFile = new File([imageBlob], `${formData.studentId}_capture.jpg`, { type: 'image/jpeg' });
      await studentsAPI.enroll({ studentId: formData.studentId }, photoFile);
      
      onClose(); // Close on success
    } catch (err) {
      console.error('Registration failed:', err);
      setError(err.response?.data?.message || 'Failed to register student. Please check ID/Email are unique.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col md:flex-row"
      >
        {/* Left side: Camera Capture */}
        <div className="md:w-1/2 bg-gray-900 p-6 flex flex-col items-center justify-center relative">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <Camera size={20} />
            Captured Face
          </h3>
          <div className="relative w-full aspect-square rounded-xl overflow-hidden border-2 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            {imageUrl ? (
              <img src={imageUrl} alt="Captured face" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">No Image</div>
            )}
            
            {/* Overlay grid to make it look techy */}
            <div className="absolute inset-0 pointer-events-none" style={{
              backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.2) 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }} />
          </div>
          <p className="text-gray-400 text-sm mt-4 text-center">
            This image will be processed by the FaceNet model.
          </p>
        </div>

        {/* Right side: Form */}
        <div className="md:w-1/2 p-6 bg-gray-50 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Quick Register</h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Student ID *</label>
                <input required type="text" name="studentId" value={formData.studentId} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" placeholder="e.g. 20CS01" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
                <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" placeholder="John Doe" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Email Address *</label>
              <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" placeholder="john@example.com" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Department *</label>
                <input required type="text" name="department" value={formData.department} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" placeholder="CSE" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Year *</label>
                <input required type="number" name="year" value={formData.year} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" placeholder="1" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Section *</label>
              <input required type="text" name="section" value={formData.section} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" placeholder="A" />
            </div>

            <div className="mt-auto pt-4">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Enroll Face & Register
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default QuickRegisterModal;
