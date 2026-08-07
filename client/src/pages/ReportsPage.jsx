import React, { useState } from 'react';
import { Download, Calendar, Filter } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

const ReportsPage = () => {
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 mt-1">Generate and download attendance reports</p>
        </div>
      </div>

      <Card title="Generate Report">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Type
              </label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option>Student Attendance Summary</option>
                <option>Course Attendance Report</option>
                <option>Department-wise Report</option>
                <option>Daily Attendance Report</option>
                <option>Monthly Summary</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department
              </label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="">All Departments</option>
                <option>Computer Science</option>
                <option>Electronics</option>
                <option>Mechanical</option>
                <option>Civil</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="flex space-x-3">
            <Button variant="primary">
              <Filter size={18} className="mr-2" />
              Generate Report
            </Button>
            <Button variant="secondary">
              <Download size={18} className="mr-2" />
              Export to PDF
            </Button>
            <Button variant="secondary">
              <Download size={18} className="mr-2" />
              Export to Excel
            </Button>
            <Button 
              variant="secondary"
              className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
              onClick={async () => {
                try {
                  const { attendanceAPI } = await import('../services/api');
                  const res = await attendanceAPI.sendWarnings();
                  alert(res.data.message);
                } catch (err) {
                  alert('Failed to send warnings');
                }
              }}
            >
              Send Warning Emails
            </Button>
          </div>
        </div>
      </Card>

      <Card title="Recent Reports">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Calendar className="text-primary-600" size={20} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Monthly Attendance Report</p>
                  <p className="text-sm text-gray-500">Generated on Jan {i}, 2025</p>
                </div>
              </div>
              <Button size="sm" variant="secondary">
                <Download size={16} className="mr-1" />
                Download
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default ReportsPage;