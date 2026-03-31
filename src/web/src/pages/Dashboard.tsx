import React from 'react';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  return (
    <div className="container">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text">Dashboard</h1>
        <p className="text-muted mt-1">Welcome to the AI Medical Imaging Analysis Platform</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Patients"
          value="127"
          trend="+12%"
          trendUp={true}
          icon="users"
        />
        <StatCard
          title="Active Studies"
          value="48"
          trend="+5%"
          trendUp={true}
          icon="study"
        />
        <StatCard
          title="Pending Analysis"
          value="12"
          trend="-2%"
          trendUp={false}
          icon="analysis"
        />
        <StatCard
          title="Reports Generated"
          value="324"
          trend="+18%"
          trendUp={true}
          icon="report"
        />
      </div>

      {/* Quick Actions */}
      <div className="card mb-6">
        <div className="card-header">
          <h2 className="text-lg font-semibold">Quick Actions</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/patients/new" className="btn btn-primary">
              Add Patient
            </Link>
            <Link to="/studies/new" className="btn btn-primary">
              Upload Study
            </Link>
            <Link to="/analysis/new" className="btn btn-secondary">
              New Analysis
            </Link>
            <Link to="/reports" className="btn btn-outline">
              View Reports
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Studies */}
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <h2 className="text-lg font-semibold">Recent Studies</h2>
            <Link to="/studies" className="text-sm text-primary hover:underline">
              View All
            </Link>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              <StudyItem
                patientName="李 小明"
                mrn="MRN-001"
                date="2024-01-15"
                modality="CT"
                status="Completed"
              />
              <StudyItem
                patientName="王 芳"
                mrn="MRN-002"
                date="2024-01-14"
                modality="MRI"
                status="Processing"
              />
              <StudyItem
                patientName="张 伟"
                mrn="MRN-003"
                date="2024-01-13"
                modality="X-Ray"
                status="Completed"
              />
            </div>
          </div>
        </div>

        {/* Recent Reports */}
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <h2 className="text-lg font-semibold">Recent Reports</h2>
            <Link to="/reports" className="text-sm text-primary hover:underline">
              View All
            </Link>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              <ReportItem
                patientName="李 小明"
                date="2024-01-15"
                status="Approved"
              />
              <ReportItem
                patientName="王 芳"
                date="2024-01-14"
                status="Draft"
              />
              <ReportItem
                patientName="张 伟"
                date="2024-01-13"
                status="Signed"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string;
  trend: string;
  trendUp: boolean;
  icon: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, trend, trendUp, icon }) => (
  <div className="card">
    <div className="card-body">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-muted mb-1">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          <p className={`text-sm mt-1 ${trendUp ? 'text-success' : 'text-danger'}`}>
            {trend}
          </p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <span className="text-primary">
            {icon === 'users' && '👥'}
            {icon === 'study' && '📁'}
            {icon === 'analysis' && '🔬'}
            {icon === 'report' && '📄'}
          </span>
        </div>
      </div>
    </div>
  </div>
);

interface StudyItemProps {
  patientName: string;
  mrn: string;
  date: string;
  modality: string;
  status: string;
}

const StudyItem: React.FC<StudyItemProps> = ({ patientName, mrn, date, modality, status }) => (
  <div className="flex items-center justify-between p-3 bg-background rounded-lg">
    <div>
      <p className="font-medium">{patientName}</p>
      <p className="text-sm text-muted">
        {mrn} • {modality} • {date}
      </p>
    </div>
    <span
      className={`px-2 py-1 text-xs font-medium rounded-full ${
        status === 'Completed'
          ? 'bg-success/10 text-success'
          : 'bg-warning/10 text-warning'
      }`}
    >
      {status}
    </span>
  </div>
);

interface ReportItemProps {
  patientName: string;
  date: string;
  status: string;
}

const ReportItem: React.FC<ReportItemProps> = ({ patientName, date, status }) => (
  <div className="flex items-center justify-between p-3 bg-background rounded-lg">
    <div>
      <p className="font-medium">{patientName}</p>
      <p className="text-sm text-muted">{date}</p>
    </div>
    <span
      className={`px-2 py-1 text-xs font-medium rounded-full ${
        status === 'Approved'
          ? 'bg-success/10 text-success'
          : status === 'Signed'
          ? 'bg-primary/10 text-primary'
          : 'bg-secondary/10 text-secondary'
      }`}
    >
      {status}
    </span>
  </div>
);

export default Dashboard;
