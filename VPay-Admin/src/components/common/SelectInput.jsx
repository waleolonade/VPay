import React from 'react';
import Select from 'react-select';

const SelectInput = ({ label, error, options, ...props }) => {
  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      borderColor: error ? '#ef4444' : state.isFocused ? '#0ea5e9' : '#d1d5db',
      '&:hover': {
        borderColor: error ? '#ef4444' : '#0ea5e9',
      },
      boxShadow: state.isFocused ? '0 0 0 2px rgba(14, 165, 233, 0.2)' : 'none',
      minHeight: '42px',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#0ea5e9' : state.isFocused ? '#e0f2fe' : 'white',
      color: state.isSelected ? 'white' : '#111827',
    }),
  };

  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <Select 
        styles={customStyles} 
        options={options} 
        {...props} 
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default SelectInput;
