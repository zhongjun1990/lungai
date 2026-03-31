import React from 'react';

const Patients: React.FC = () => {
  return (
    <div className="container">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text">Patients</h1>
        <p className="text-muted mt-1">Manage patient records</p>
      </div>

      <div className="card">
        <div className="card-header flex justify-between items-center">
          <h2 className="text-lg font-semibold">Patient List</h2>
          <button className="btn btn-primary">Add Patient</button>
        </div>
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background border-b border-border">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-sm text-text">MRN</th>
                  <th className="text-left py-3 px-4 font-medium text-sm text-text">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-sm text-text">Gender</th>
                  <th className="text-left py-3 px-4 font-medium text-sm text-text">Birth Date</th>
                  <th className="text-left py-3 px-4 font-medium text-sm text-text">Studies</th>
                  <th className="text-left py-3 px-4 font-medium text-sm text-text">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="hover:bg-background">
                    <td className="py-3 px-4 text-sm text-text">MRN-00{i}</td>
                    <td className="py-3 px-4 text-sm text-text">
                      {i === 1 && '李小明'}
                      {i === 2 && '王芳'}
                      {i === 3 && '张伟'}
                      {i === 4 && '刘红'}
                      {i === 5 && '陈明'}
                    </td>
                    <td className="py-3 px-4 text-sm text-text">
                      {i % 2 === 0 ? 'Female' : 'Male'}
                    </td>
                    <td className="py-3 px-4 text-sm text-text">
                      {i === 1 && '1980-01-15'}
                      {i === 2 && '1975-05-20'}
                      {i === 3 && '1990-08-12'}
                      {i === 4 && '1985-11-30'}
                      {i === 5 && '1978-03-18'}
                    </td>
                    <td className="py-3 px-4 text-sm text-text">{i}</td>
                    <td className="py-3 px-4 text-sm text-text">
                      <div className="flex gap-2">
                        <button className="btn btn-secondary text-sm">
                          View
                        </button>
                        <button className="btn btn-outline text-sm">
                          Edit
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

export default Patients;
