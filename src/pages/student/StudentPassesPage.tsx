import React, { useEffect } from 'react';
import { StudentRegistrationsPage } from './StudentRegistrationsPage';

export const StudentPassesPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Event Passes · Festofy';
  }, []);

  return <StudentRegistrationsPage defaultTab="passes" />;
};
