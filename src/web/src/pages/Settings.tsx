import React from 'react';

const Settings: React.FC = () => {
  return (
    <div className="container">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text">Settings</h1>
        <p className="text-muted mt-1">Manage your account and application settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Profile Settings */}
          <div className="card mb-6">
            <div className="card-header">
              <h2 className="text-lg font-semibold">Profile</h2>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    defaultValue="System Administrator"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-input"
                    defaultValue="admin@hospital.com"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <input
                    type="text"
                    className="form-input"
                    defaultValue="Administrator"
                    disabled
                  />
                </div>
                <div className="flex justify-end">
                  <button className="btn btn-primary">Save Changes</button>
                </div>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="card mb-6">
            <div className="card-header">
              <h2 className="text-lg font-semibold">Security</h2>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <input type="password" className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input type="password" className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <input type="password" className="form-input" />
                </div>
                <div className="flex justify-end">
                  <button className="btn btn-primary">Update Password</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          {/* System Info */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold">System Info</h2>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted">Version</span>
                  <span className="text-sm font-medium">1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted">Environment</span>
                  <span className="text-sm font-medium">Development</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted">API Status</span>
                  <span className="text-sm font-medium text-success">Connected</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
