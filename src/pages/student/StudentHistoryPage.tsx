import React, { useEffect } from 'react';
import { StudentRegistrationsPage } from './StudentRegistrationsPage';

export const StudentHistoryPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Participation History · Festofy';
  }, []);

  return <StudentRegistrationsPage defaultTab="past" />;
};
