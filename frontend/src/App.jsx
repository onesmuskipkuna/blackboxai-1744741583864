import React from 'react';
import AppRoutes from './routes';

const App = () => {
  return (
    <div className="min-h-screen bg-gray-50 font-['Inter']">
      <div className="mx-auto">
        <AppRoutes />
      </div>
    </div>
  );
};

export default App;
