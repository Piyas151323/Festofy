/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { PublicLayout } from './layouts/PublicLayout';
import { StudentLayout } from './layouts/StudentLayout';
import { OrganizerLayout } from './layouts/OrganizerLayout';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Public Pages
import { HomePage } from './pages/public/HomePage';
import { FestsPage } from './pages/public/FestsPage';
import { FestDetailPage } from './pages/public/FestDetailPage';
import { EventsPage } from './pages/public/EventsPage';
import { EventDetailPage } from './pages/public/EventDetailPage';
import { RegistrationPage } from './pages/public/RegistrationPage';
import { AuthPage } from './pages/public/AuthPage';

// Student Pages
import { StudentDashboardPage } from './pages/student/StudentDashboardPage';
import { StudentRegistrationsPage } from './pages/student/StudentRegistrationsPage';
import { StudentRegistrationDetailPage } from './pages/student/StudentRegistrationDetailPage';
import { StudentPassesPage } from './pages/student/StudentPassesPage';
import { StudentOrgApplyPage } from './pages/student/StudentOrgApplyPage';
import { StudentOrgRequestsPage } from './pages/student/StudentOrgRequestsPage';

// Organizer Pages
import { OrganizerConsolePage } from './pages/organizer/OrganizerConsolePage';
import { OrganizerFestsPage } from './pages/organizer/OrganizerFestsPage';
import { OrganizerEventsPage } from './pages/organizer/OrganizerEventsPage';
import { OrganizerParticipantsPage } from './pages/organizer/OrganizerParticipantsPage';
import { OrganizerAnalyticsPage } from './pages/organizer/OrganizerAnalyticsPage';

// Admin Layout & Pages
import { AdminLayout } from './layouts/AdminLayout';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminOrganizationRequestsPage } from './pages/admin/AdminOrganizationRequestsPage';
import { AdminOrganizationRequestDetailPage } from './pages/admin/AdminOrganizationRequestDetailPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/fests" element={<FestsPage />} />
            <Route path="/fests/:festId" element={<FestDetailPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:eventId" element={<EventDetailPage />} />
            <Route path="/events/:eventId/register" element={<RegistrationPage />} />
            <Route path="/auth" element={<AuthPage />} />
          </Route>

          {/* Student Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <StudentLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<StudentDashboardPage />} />
            <Route path="registrations" element={<StudentRegistrationsPage />} />
            <Route path="registrations/:registrationId" element={<StudentRegistrationDetailPage />} />
            <Route path="passes" element={<StudentPassesPage />} />
            <Route path="organizations" element={<StudentOrgRequestsPage />} />
            <Route path="organizations/apply" element={<StudentOrgApplyPage />} />
          </Route>

          {/* Student-accessible Club Organization Application Route */}
          <Route
            path="/organizer/apply"
            element={
              <ProtectedRoute>
                <StudentLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<StudentOrgApplyPage />} />
          </Route>

          {/* Organizer Protected Routes */}
          <Route
            path="/organizer"
            element={
              <ProtectedRoute allowedRoles={['organizer', 'admin']}>
                <OrganizerLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<OrganizerConsolePage />} />
            <Route path="fests" element={<OrganizerFestsPage />} />
            <Route path="events" element={<OrganizerEventsPage />} />
            <Route path="participants" element={<OrganizerParticipantsPage />} />
            <Route path="analytics" element={<OrganizerAnalyticsPage />} />
          </Route>

          {/* Main Admin Protected Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboardPage />} />
            <Route path="organization-requests" element={<AdminOrganizationRequestsPage />} />
            <Route path="organization-requests/:organizationId" element={<AdminOrganizationRequestDetailPage />} />
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
