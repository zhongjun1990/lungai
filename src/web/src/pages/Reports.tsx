import React from 'react';

const Reports: React.FC = () => {
  return (
    <div className="container">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text">Reports</h1>
        <p className="text-muted mt-1">View and manage AI analysis reports</p>
      </div>

      <div className="card">
        <div className="card-header flex justify-between items-center">
          <h2 className="text-lg font-semibold">Report List</h2>
          <button className="btn btn-primary">Generate Report</button>
        </div>
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background border-b border-border">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-sm text-text">Patient</th>
                  <th className="text-left py-3 px-4 font-medium text-sm text-text">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-sm text-text">Analysis</th>
                  <th className="text-left py-3 px-4 font-medium text-sm text-text">Findings</th>
                  <th className="text-left py-3 px-4 font-medium text-sm text-text">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-sm text-text">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[1, 2, 3].map((i) => (
                  <tr key={i} className="hover:bg-background">
                    <td className="py-3 px-4 text-sm text-text">
                      {i === 1 && '李小明 (MRN-001)'}
                      {i === 2 && '王芳 (MRN-002)'}
                      {i === 3 && '张伟 (MRN-003)'}
                    </td>
                    <td className="py-3 px-4 text-sm text-text">
                      {i === 1 && '2024-01-15 10:30:00'}
                      {i === 2 && '2024-01-14 15:45:00'}
                      {i === 3 && '2024-01-13 11:20:00'}
                    </td>
                    <td className="py-3 px-4 text-sm text-text">
                      {i === 1 && 'Lung Nodule Detection'}
                      {i === 2 && 'Chest X-Ray Classification'}
                      {i === 3 && 'Lung Nodule Detection'}
                    </td>
                    <td className="py-3 px-4 text-sm text-text">
                      {i === 1 && '2 nodules detected'}
                      {i === 2 && 'Normal'}
                      {i === 3 && '1 nodule detected'}
                    </td>
                    <td className="py-3 px-4 text-sm text-text">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          i === 1
                            ? 'bg-success/10 text-success'
                            : i === 2
                            ? 'bg-primary/10 text-primary'
                            : 'bg-warning/10 text-warning'
                        }`}
                      >
                        {i === 1 && 'Approved'}
                        {i === 2 && 'Signed'}
                        {i === 3 && 'Draft'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-text">
                      <div className="flex gap-2">
                        <button className="btn btn-secondary text-sm">
                          View
                        </button>
                        <button className="btn btn-outline text-sm">
                          Download
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
