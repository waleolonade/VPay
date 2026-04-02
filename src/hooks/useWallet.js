import { useState, useCallback, useEffect } from 'react';
import { walletService } from '../services/walletService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useWallet = () => {
  const [wallets, setWallets] = useState([]);
  const [activeWallet, setActiveWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWallets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await walletService.getWallets();
      const data = res.data?.data || res.data || [];
      
      // Map walletType to type for consistency
      const finalizedWallets = (data.length > 0 ? data : [
        { walletType: 'personal', balance: 0, accountNumber: 'PENDING', bankName: 'VFD Bank', name: 'Personal Wallet' }
      ]).map(w => ({
        ...w,
        type: w.walletType || w.type || 'personal'
      }));

      setWallets(finalizedWallets);
      
      // Restore last active wallet preference
      const lastActiveType = await AsyncStorage.getItem('lastActiveWalletType');
      const found = finalizedWallets.find(w => w.type === lastActiveType) || finalizedWallets[0];
      setActiveWallet(found);
    } catch (error) {
      console.error('Fetch wallets error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const switchWallet = async (wallet) => {
    setActiveWallet(wallet);
    await AsyncStorage.setItem('lastActiveWalletType', wallet.type);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchWallets();
  }, [fetchWallets]);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  return {
    wallets,
    activeWallet,
    loading,
    refreshing,
    switchWallet,
    onRefresh,
    fetchWallets
  };
};

export default useWallet;
