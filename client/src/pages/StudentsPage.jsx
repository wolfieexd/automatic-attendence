import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Download, Search, Filter, Users, TrendingUp } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import StudentTable from '../components/students/StudentTable';
import AddStudentForm from '../components/students/AddStudentForm';
import Spinner from '../components/common/Spinner';
import { studentsAPI, photosAPI } from '../services/api';

const StudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [filters, setFilters] = useState({
    department: '',
    year: '',
    search: '',
  });

  useEffect(() => {
    fetchStudents();
  }, [filters]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await studentsAPI.getAll(filters);
      setStudents(response.data.data);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (formData) => {
    try {
      let studentData;
      const photoFile = formData.get('photo');
      
      const studentObj = {
        studentId: formData.get('studentId'),
        name: formData.get('name'),
        email: formData.get('email'),
        department: formData.get('department'),
        year: parseInt(formData.get('year')),
        section: formData.get('section'),
        phone: formData.get('phone') || undefined
      };

      if (editingStudent) {
        const response = await studentsAPI.update(editingStudent.studentId, studentObj);
        studentData = response.data.data;
      } else {
        const response = await studentsAPI.create(studentObj);
        studentData = response.data.data;
      }

      if (photoFile) {
        try {
          const photoFormData = new FormData();
          photoFormData.append('photo', photoFile);
          
          const uploadResponse = await photosAPI.upload(studentData.studentId, photoFormData);
          console.log('Photo upload response:', uploadResponse);
        } catch (photoError) {
          console.error('Error uploading photo:', photoError);
          alert('Student was saved but there was an error uploading the photo. Please try updating the photo later.');
        }
      }

      fetchStudents();
      setIsModalOpen(false);
      setEditingStudent(null);
    } catch (error) {
      console.error('Error saving student:', error);
      if (error.response?.data?.error?.includes('duplicate key error')) {
        if (error.response.data.error.includes('studentId')) {
          alert('A student with this Student ID already exists');
        } else if (error.response.data.error.includes('email')) {
          alert('A student with this email already exists');
        } else {
          alert('Student ID or Email already exists');
        }
      } else {
        alert(error.response?.data?.error || 'Error saving student');
      }
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setIsModalOpen(true);
  };

  const handleDelete = async (student) => {
    if (window.confirm(`Are you sure you want to delete ${student.name}?`)) {
      try {
        await studentsAPI.delete(student.studentId);
        fetchStudents();
      } catch (error) {
        console.error('Error deleting student:', error);
        alert('Error deleting student');
      }
    }
  };

  const handleView = (student) => {
    alert(`View details for ${student.name} - Feature coming soon!`);
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

  // Calculate stats
  const totalStudents = students.length;
  const departmentCounts = students.reduce((acc, student) => {
    acc[student.department] = (acc[student.department] || 0) + 1;
    return acc;
  }, {});

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header Section */}
      <motion.div 
        className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
        variants={itemVariants}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <motion.div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(to bottom right, #3B82F6, #2563EB)' }}
              whileHover={{ scale: 1.05, rotate: 5 }}
            >
              <Users size={28} className="text-white" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Students</h1>
              <p className="text-gray-600 mt-1 font-medium">
                Manage your student database • {totalStudents} Total
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="secondary" className="flex items-center gap-2">
                <Download size={18} />
                Export
              </Button>
            </motion.div>
            
            <input 
              type="file" 
              id="zipUpload" 
              className="hidden" 
              accept=".zip" 
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                
                try {
                  setLoading(true);
                  const res = await studentsAPI.batchEnroll(file);
                  alert(res.data.message);
                  fetchStudents();
                } catch (error) {
                  alert(error.response?.data?.message || 'Error processing ZIP upload');
                } finally {
                  setLoading(false);
                  e.target.value = null; // reset input
                }
              }}
            />
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => document.getElementById('zipUpload').click()}
                variant="secondary"
                className="flex items-center gap-2 bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100"
              >
                <Users size={18} />
                Batch Enroll (ZIP)
              </Button>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => {
                  setEditingStudent(null);
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-2"
                style={{ background: 'linear-gradient(to right, #3B82F6, #2563EB)' }}
              >
                <UserPlus size={18} />
                Add Student
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Stats Cards */}
        {totalStudents > 0 && (
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {Object.entries(departmentCounts).map(([dept, count]) => (
              <motion.div
                key={dept}
                className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-200"
                whileHover={{ scale: 1.03, y: -2 }}
              >
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">{dept}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{count}</p>
                <p className="text-xs text-gray-600 mt-1">
                  {Math.round((count / totalStudents) * 100)}% of total
                </p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* Filters and Table Card */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden">
          {/* Filter Section */}
          <div className="p-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Filter size={20} className="text-gray-700" />
              <h2 className="font-bold text-gray-900">Filter Students</h2>
            </div>
            
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by name, ID, email..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                  style={{ focusRing: '2px solid #3B82F6' }}
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>

              {/* Department Select */}
              <select
                className="px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all appearance-none bg-white cursor-pointer"
                style={{ focusRing: '2px solid #3B82F6' }}
                value={filters.department}
                onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              >
                <option value="">All Departments</option>
                <option value="CSE">Computer Science (CSE)</option>
                <option value="ECE">Electronics (ECE)</option>
                <option value="ME">Mechanical (ME)</option>
                <option value="CE">Civil (CE)</option>
              </select>

              {/* Year Select */}
              <select
                className="px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all appearance-none bg-white cursor-pointer"
                style={{ focusRing: '2px solid #3B82F6' }}
                value={filters.year}
                onChange={(e) => setFilters({ ...filters, year: e.target.value })}
              >
                <option value="">All Years</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </motion.div>

            {/* Active Filters Badge */}
            <AnimatePresence>
              {(filters.search || filters.department || filters.year) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 flex items-center gap-2"
                >
                  <span className="text-sm text-gray-600 font-medium">Active filters:</span>
                  {filters.search && (
                    <motion.span 
                      className="px-3 py-1 text-xs font-semibold rounded-full"
                      style={{ backgroundColor: '#DBEAFE', color: '#1E40AF' }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    >
                      Search: {filters.search}
                    </motion.span>
                  )}
                  {filters.department && (
                    <motion.span 
                      className="px-3 py-1 text-xs font-semibold rounded-full"
                      style={{ backgroundColor: '#DBEAFE', color: '#1E40AF' }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    >
                      {filters.department}
                    </motion.span>
                  )}
                  {filters.year && (
                    <motion.span 
                      className="px-3 py-1 text-xs font-semibold rounded-full"
                      style={{ backgroundColor: '#DBEAFE', color: '#1E40AF' }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    >
                      Year {filters.year}
                    </motion.span>
                  )}
                  <button
                    onClick={() => setFilters({ department: '', year: '', search: '' })}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline"
                  >
                    Clear all
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Table Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div 
                  key="loading"
                  className="py-20"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Spinner />
                </motion.div>
              ) : students.length === 0 ? (
                <motion.div 
                  key="empty"
                  className="text-center py-20"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
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
                    <Users size={64} className="text-gray-300 mx-auto mb-4" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No students found</h3>
                  <p className="text-gray-500 mb-6">
                    {filters.search || filters.department || filters.year
                      ? 'Try adjusting your filters'
                      : 'Add your first student to get started'}
                  </p>
                  {!filters.search && !filters.department && !filters.year && (
                    <motion.button
                      className="text-white px-6 py-3 rounded-xl font-bold inline-flex items-center gap-2"
                      style={{ backgroundColor: '#3B82F6' }}
                      whileHover={{ scale: 1.05, backgroundColor: '#2563EB' }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setEditingStudent(null);
                        setIsModalOpen(true);
                      }}
                    >
                      <UserPlus size={20} />
                      Add First Student
                    </motion.button>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="table"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <StudentTable
                    students={students}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onView={handleView}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>
      </motion.div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingStudent(null);
        }}
        title={editingStudent ? 'Edit Student' : 'Add New Student'}
        size="lg"
      >
        <AddStudentForm
          onSubmit={handleAddStudent}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingStudent(null);
          }}
          initialData={editingStudent}
        />
      </Modal>
    </motion.div>
  );
};

export default StudentsPage;