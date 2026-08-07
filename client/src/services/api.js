import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3070';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Students API
export const studentsAPI = {
  getAll: (params) => api.get('/api/students', { params }),
  getById: (id) => api.get(`/api/students/${id}`),
  create: (data) => api.post('/api/students', data),
  update: (id, data) => api.put(`/api/students/${id}`, data),
  delete: (id) => api.delete(`/api/students/${id}`),
  // New endpoints for face recognition
  enroll: (data, photo) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      formData.append(key, data[key]);
    });
    formData.append('photo', photo);
    return api.post('/students/enroll', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  updatePhoto: (id, photo) => {
    const formData = new FormData();
    formData.append('photo', photo);
    return api.put(`/students/${id}/photo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  batchEnroll: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/students/batch-enroll', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
};

// Attendance API
export const attendanceAPI = {
  mark: (data) => api.post('/attendance/mark', data),
  getByCourse: (courseId, params) => api.get(`/attendance/course/${courseId}`, { params }),
  getByStudent: (studentId, params) => api.get(`/attendance/student/${studentId}`, { params }),
  update: (id, status) => api.put(`/attendance/${id}`, { status }),
  delete: (id) => api.delete(`/attendance/${id}`),
  exportCSV: (courseId) => api.get(`/attendance/export/${courseId}`, { responseType: 'blob' }),
  sendWarnings: () => api.post('/attendance/send-warnings'),
  getStats: () => api.get('/attendance/stats'),
  getLive: () => api.get('/attendance/live'),
  // Real-time attendance endpoints
  markByFaceRecognition: (courseId, recognizedIds) => 
    api.post('/api/attendance/mark/face-recognition', { courseId, studentIds: recognizedIds }),
  streamLiveAttendance: (courseId) => {
    const eventSource = new EventSource(`${API_BASE_URL}/attendance/stream/${courseId}`);
    return eventSource;
  },
};

// Courses API
export const coursesAPI = {
  getAll: (params) => api.get('/api/courses', { params }),
  getById: (id) => api.get(`/api/courses/${id}`),
  create: (data) => api.post('/api/courses', data),
  update: (id, data) => api.put(`/api/courses/${id}`, data),
  delete: (id) => api.delete(`/api/courses/${id}`),
};

// Photos API
export const photosAPI = {
  upload: (studentId, formData) => {
    return axios.post(`${API_BASE_URL}/api/photos/upload/${studentId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  get: (studentId) => `${API_BASE_URL}/api/photos/${studentId}/photo`,
};

export default api;