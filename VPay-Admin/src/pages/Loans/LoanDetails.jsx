import React from 'react';
import { useParams } from 'react-router-dom';
import Card from '../../components/common/Card';

const LoanDetails = () => {
  const { id } = useParams();
  
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Loan Details</h1>
      <Card>
        <p>Loan ID: {id}</p>
        <p className="text-gray-600 mt-2">Detailed loan information will be displayed here.</p>
      </Card>
    </div>
  );
};

export default LoanDetails;
