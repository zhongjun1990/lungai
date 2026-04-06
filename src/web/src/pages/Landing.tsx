import React from 'react';
import { Link } from 'react-router-dom';

const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="bg-surface border-b border-border">
        <div className="container">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-lg font-bold text-text">LungAI</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/pricing" className="btn btn-outline text-sm">
                Pricing
              </Link>
              <Link to="/login" className="btn btn-primary text-sm">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 bg-surface">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              AI-Powered Lung Nodule Detection
            </div>
            <h1 className="text-5xl font-bold text-text leading-tight mb-6">
              Detect Lung Nodules Earlier with AI
            </h1>
            <p className="text-xl text-text-secondary mb-8 leading-relaxed">
              Chest CT scan analysis powered by advanced deep learning.
              Built for radiologists and clinicians who need fast, accurate lung nodule detection.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/login" className="btn btn-primary text-base px-8 py-3">
                Get Started Free
              </Link>
              <Link to="/pricing" className="btn btn-outline text-base px-8 py-3">
                View Pricing
              </Link>
            </div>
            <p className="text-sm text-muted mt-4">
              No credit card required. Start analyzing CT scans today.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-text mb-4">
              Built for Clinical Workflows
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              From upload to report in minutes — designed to fit seamlessly into your radiology practice.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <FeatureCard
              icon={
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              }
              title="High Accuracy"
              description="Deep learning model trained on LUNA16 dataset. Target sensitivity ≥95%, specificity ≥90%."
            />
            <FeatureCard
              icon={
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              title="Fast Analysis"
              description="Upload a chest CT DICOM series and receive nodule detection results in under 5 minutes."
            />
            <FeatureCard
              icon={
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
              title="Auto Reports"
              description="Automatically generated detection reports with nodule location, size, and malignancy risk (Lung-RADS)."
            />
            <FeatureCard
              icon={
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              }
              title="DICOM Compatible"
              description="Full DICOM support for CT scan upload and PACS integration. Works with standard radiology workflows."
            />
            <FeatureCard
              icon={
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
              title="HIPAA Compliant"
              description="Enterprise-grade security with audit logging, encryption at rest, and role-based access control."
            />
            <FeatureCard
              icon={
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
              title="Team Collaboration"
              description="Multi-user support with role-based permissions. Radiologists, residents, and referring physicians."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-surface border-t border-border">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-text mb-4">How It Works</h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              From CT scan to actionable insight in three simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <StepCard
              number="01"
              title="Upload CT Scan"
              description="Upload your chest CT DICOM series through our secure web interface. Supports multi-slice CT scans."
            />
            <StepCard
              number="02"
              title="AI Analysis"
              description="Our YOLOv8+nnU-Net model analyzes each slice and identifies lung nodules with confidence scores."
            />
            <StepCard
              number="03"
              title="Review & Report"
              description="Review detected nodules on an interactive viewer. Auto-generated Lung-RADS reports ready for sign-off."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container">
          <div className="bg-primary rounded-2xl p-12 text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to improve your lung nodule detection?
            </h2>
            <p className="text-lg text-white/80 mb-8">
              Join radiologists using AI to catch lung nodules earlier.
              Free tier available for individual clinicians.
            </p>
            <Link to="/login" className="inline-flex items-center gap-2 bg-white text-primary font-semibold px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors">
              Start Free Trial
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-text">LungAI</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted">
              <Link to="/pricing" className="hover:text-text transition-colors">Pricing</Link>
              <Link to="/login" className="hover:text-text transition-colors">Sign In</Link>
              <a href="#" className="hover:text-text transition-colors">Privacy</a>
              <a href="#" className="hover:text-text transition-colors">Terms</a>
            </div>
            <p className="text-sm text-muted">
              &copy; 2026 LungAI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => (
  <div className="card p-6">
    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
      {icon}
    </div>
    <h3 className="text-lg font-semibold text-text mb-2">{title}</h3>
    <p className="text-text-secondary text-sm leading-relaxed">{description}</p>
  </div>
);

interface StepCardProps {
  number: string;
  title: string;
  description: string;
}

const StepCard: React.FC<StepCardProps> = ({ number, title, description }) => (
  <div className="text-center">
    <div className="text-5xl font-bold text-primary/20 mb-4">{number}</div>
    <h3 className="text-lg font-semibold text-text mb-2">{title}</h3>
    <p className="text-text-secondary text-sm leading-relaxed">{description}</p>
  </div>
);

export default Landing;
