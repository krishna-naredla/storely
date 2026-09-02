import React from 'react';
import { WorkPortfolioManager } from './WorkPortfolioManager';
import { BusinessProfile } from '../../types';

interface PortfolioManagerProps {
  business: BusinessProfile;
  onBusinessUpdated?: (updated: BusinessProfile) => void;
}

export const PortfolioManager: React.FC<PortfolioManagerProps> = (props) => {
  return <WorkPortfolioManager {...props} />;
};

export default PortfolioManager;
