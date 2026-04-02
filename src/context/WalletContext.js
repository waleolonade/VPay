import React, { createContext, useState } from 'react';

export const WalletContext = createContext();

export function WalletProvider({ children }) {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);

  const value = {
    balance,
    setBalance,
    transactions,
    setTransactions,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}
