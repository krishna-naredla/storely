import React, { useEffect } from 'react';
import { MasterLandingView } from './MasterLandingView';

interface LandingPageProps {
  onOpenAuth: (mode: 'login' | 'signup') => void;
  onExploreDemoStore: (slug: string) => void;
  onOpenMasterAdmin?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth, onOpenMasterAdmin }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <MasterLandingView onOpenAuth={onOpenAuth} onOpenMasterAdmin={onOpenMasterAdmin} />
  );
};
