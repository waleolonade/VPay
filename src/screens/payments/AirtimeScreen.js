import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { colors } from '../../styles/colors';
import billsService from '../../services/billsPaymentService';
import { detectNetwork } from '../../utils/networkUtils';

const NETWORKS = [
  { id: 'mtn', name: 'MTN', logo: require('../../../assets/images/networks/mtn.png'), color: '#FFCC00' },
  { id: 'airtel', name: 'Airtel', logo: require('../../../assets/images/networks/airtel.png'), color: '#FF0000' },
  { id: 'glo', name: 'Glo', logo: require('../../../assets/images/networks/glo.png'), color: '#00FF00' },
  { id: '9mobile', name: '9mobile', logo: require('../../../assets/images/networks/9mobile.png'), color: '#005723' },
];

const PRESET_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

export default function AirtimeScreen({ navigation, route }) {
  const [billers, setBillers] = useState([]);
  const [selectedNetwork, setSelectedNetwork] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState(route.params?.phoneNumber || '');
  const [showNetworkGrid, setShowNetworkGrid] = useState(false);
  const [amount, setAmount] = useState(route.params?.amount?.toString() || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingBillers, setIsFetchingBillers] = useState(false);
  const [items, setItems] = useState([]);
  const [isItemsLoading, setIsItemsLoading] = useState(false);
  const serviceCharge = 0;

  useEffect(() => {
    fetchBillers();
  }, []);

  useEffect(() => {
    if (selectedNetwork) {
      fetchItems();
    }
  }, [selectedNetwork]);

  useEffect(() => {
    if (phoneNumber.length >= 4 && billers.length > 0) {
      const detected = detectNetwork(phoneNumber);
      if (detected) {
        const networkBiller = billers.find(b => b.name.toLowerCase().includes(detected.toLowerCase()));
        if (networkBiller && networkBiller.id !== selectedNetwork?.id) {
          setSelectedNetwork(networkBiller);
          setShowNetworkGrid(false);
        }
      }
    }
  }, [phoneNumber, billers]);

  const fetchBillers = async () => {
    setIsFetchingBillers(true);
    try {
      const res = await billsService.getBillers('Airtime');
      setBillers(res || []);
    } catch (err) {
      console.error('Error fetching airtime billers:', err);
    } finally {
      setIsFetchingBillers(false);
    }
  };

  const fetchItems = async () => {
    if (!selectedNetwork) return;
    setIsItemsLoading(true);
    try {
      const res = await billsService.getBillerItems(
        selectedNetwork.id,
        selectedNetwork.division,
        selectedNetwork.product
      );
      // For Airtime, there's usually just one item (the top-up code)
      const paymentItems = res?.paymentitems || res || [];
      setItems(paymentItems);
    } catch (err) {
      console.error('Error fetching items:', err);
    } finally {
      setIsItemsLoading(false);
    }
  };

  const handleContinue = async () => {
    if (!selectedNetwork) return Alert.alert('Error', 'Please select a network');
    if (phoneNumber.length < 11) return Alert.alert('Error', 'Please enter a valid phone number');
    if (!amount || Number(amount) < 50) return Alert.alert('Error', 'Minimum amount is ₦50');

    // For Airtime, pick the first payment item if available, else fallback to billerId
    const activeItem = items[0];

    navigation.navigate('TransferConfirmation', {
      type: 'airtime',
      details: {
        network: selectedNetwork,
        phoneNumber,
        amount: Number(amount),
        serviceCharge,
        total: Number(amount) + serviceCharge,
        billerId: selectedNetwork.id,
        billerName: selectedNetwork.name,
        division: selectedNetwork.division,
        productId: selectedNetwork.product,
        paymentItem: activeItem?.paymentCode || activeItem?.id || selectedNetwork.id,
        walletType: route.params?.walletType || 'personal',
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Buy Airtime</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>Phone Number</Text>
          <Input
            placeholder="0801 234 5678"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            maxLength={11}
            icon="call-outline"
            rightContent={
              isFetchingBillers ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : selectedNetwork ? (
                <TouchableOpacity
                  style={styles.inputNetworkBadge}
                  onPress={() => setShowNetworkGrid(!showNetworkGrid)}
                >
                  <Text style={styles.inputNetworkName}>{selectedNetwork.name}</Text>
                  <Ionicons name="chevron-down" size={12} color={colors.textLight} />
                </TouchableOpacity>
              ) : null
            }
          />
          {!selectedNetwork && phoneNumber.length >= 4 && !isFetchingBillers && (
            <Text style={styles.detectionHint}>
              <Ionicons name="information-circle-outline" size={12} /> Detecting network provider...
            </Text>
          )}
        </View>

        {showNetworkGrid && (
          <View style={styles.manualSelectionContainer}>
            <View style={styles.selectionHeader}>
              <Text style={styles.selectionTitle}>Select Provider</Text>
              <TouchableOpacity onPress={() => setShowNetworkGrid(false)}>
                <Ionicons name="close" size={20} color={colors.textLight} />
              </TouchableOpacity>
            </View>
            <View style={styles.networkGrid}>
              {billers.map((network) => (
                <TouchableOpacity
                  key={network.id}
                  style={[
                    styles.networkCardSmall,
                    selectedNetwork?.id === network.id && { borderColor: colors.primary, borderWidth: 1 }
                  ]}
                  onPress={() => {
                    setSelectedNetwork(network);
                    setShowNetworkGrid(false);
                  }}
                >
                  <Text style={styles.networkNameSmall}>{network.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>Amount</Text>
          <Input
            placeholder="Enter Amount"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            icon="cash-outline"
            leftContent={<Text style={styles.currencyPrefix}>₦</Text>}
          />

          <View style={styles.presetGrid}>
            {PRESET_AMOUNTS.map((val) => (
              <TouchableOpacity
                key={val}
                style={[
                  styles.presetBtn,
                  amount === val.toString() && styles.presetBtnActive
                ]}
                onPress={() => setAmount(val.toString())}
              >
                <Text style={[
                  styles.presetText,
                  amount === val.toString() && styles.presetTextActive
                ]}>₦{val}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Network</Text>
            <Text style={styles.summaryValue}>{selectedNetwork?.name || 'Not Selected'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Phone</Text>
            <Text style={styles.summaryValue}>{phoneNumber || '—'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Amount</Text>
            <Text style={styles.summaryValue}>₦{Number(amount || 0).toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Service Charge</Text>
            <Text style={[styles.summaryValue, { color: colors.success }]}>
              {serviceCharge > 0 ? `+₦${serviceCharge}` : 'FREE'}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total to Pay</Text>
            <Text style={styles.totalValue}>₦{(Number(amount || 0) + serviceCharge).toLocaleString()}</Text>
          </View>
        </View>

        <Button
          title="Continue"
          onPress={handleContinue}
          style={styles.continueBtn}
          loading={isLoading}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  networkGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  networkCard: {
    width: '48%',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  networkIconPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  networkName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  inputSection: {
    marginBottom: 24,
  },
  currencyPrefix: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginRight: 4,
  },
  detectionHint: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 6,
    fontStyle: 'italic',
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  presetBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },
  presetBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  presetText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  presetTextActive: {
    color: '#fff',
  },
  summaryCard: {
    backgroundColor: colors.primary + '05',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.primary + '10',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textLight,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  continueBtn: {
    marginTop: 8,
  },
  inputNetworkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  inputNetworkName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginHorizontal: 4,
  },
  manualSelectionContainer: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
  },
  networkCardSmall: {
    width: '23%',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  networkNameSmall: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },
});
