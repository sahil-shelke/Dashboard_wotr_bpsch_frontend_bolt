import React from 'react';

const Loader: React.FC = () => {
  return (
    <div className="loader">
      <style>{`
        .loader {
          border: 4px solid #fefefe;
          border-top: 4px solid #FFB800;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Loader;
