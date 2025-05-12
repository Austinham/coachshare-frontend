import React from 'react';
import AthleteList from '@/components/AthleteList';
import { Helmet } from 'react-helmet-async';

const Athletes: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Athletes - CoachShare</title>
      </Helmet>
      <AthleteList />
    </>
  );
};

export default Athletes; 