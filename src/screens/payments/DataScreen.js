import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { colors } from '../../styles/colors';
import billsService from '../../services/billsPaymentService';
import { detectNetwork } from '../../utils/networkUtils';

const PLAN_CATEGORIES = ['Daily', 'Weekly', 'Monthly', 'Other'];

export default function DataScreen({ navigation, route }) {
  const [billers, setBillers] = useState([]);
  const [selectedNetwork, setSelectedNetwork] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState(route.params?.phoneNumber || '');
  const [showNetworkGrid, setShowNetworkGrid] = useState(false);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [activeCategory, setActiveCategory] = useState('Monthly');
  const [isFetchingBillers, setIsFetchingBillers] = useState(false);
  const [isPlansLoading, setIsPlansLoading] = useState(false);
  const serviceCharge = 0;

  useEffect(() => {
    fetchBillers();
  }, []);

  useEffect(() => {
    if (selectedNetwork) {
      fetchPlans();
    }
  }, [selectedNetwork]);

  useEffect(() => {
    if (phoneNumber.length >= 4) {
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
      const res = await billsService.getBillers('Data');
      setBillers(res || []);
    } catch (err) {
      console.error('Error fetching data billers:', err);
    } finally {
      setIsFetchingBillers(false);
    }
  };

  const fetchPlans = async () => {
    setIsPlansLoading(true);
    try {
      const res = await billsService.getBillerItems(
        selectedNetwork.id,
        selectedNetwork.division,
        selectedNetwork.product
      );
      setPlans(res || []);
      setSelectedPlan(null);
    } catch (err) {
      console.error('Error fetching plans:', err);
    } finally {
      setIsPlansLoading(false);
    }
  };

  const categorizedPlans = useMemo(() => {
    const categories = {
      Daily: [],
      Weekly: [],
      Monthly: [],
      Other: [],
    };

    plans.forEach(plan => {
      const name = (plan.name || plan.paymentitemname || '').toLowerCase();
      if (name.includes('day') || name.includes('24hrs') || name.includes('1d')) categories.Daily.push(plan);
      else if (name.includes('week') || name.includes('7d')) categories.Weekly.push(plan);
      else if (name.includes('month') || name.includes('30d')) categories.Monthly.push(plan);
      else categories.Other.push(plan);
    });

    return categories;
  }, [plans]);

  // Set default category to the first one with items
  useEffect(() => {
    if (plans.length > 0) {
      if (categorizedPlans.Monthly.length > 0) setActiveCategory('Monthly');
      else if (categorizedPlans.Weekly.length > 0) setActiveCategory('Weekly');
      else if (categorizedPlans.Daily.length > 0) setActiveCategory('Daily');
      else setActiveCategory('Other');
    }
  }, [categorizedPlans, plans.length]);

  const handleContinue = () => {
    if (!selectedNetwork) return Alert.alert('Error', 'Please select a network');
    if (phoneNumber.length < 11) return Alert.alert('Error', 'Please enter a valid phone number');
    if (!selectedPlan) return Alert.alert('Error', 'Please select a data plan');

    navigation.navigate('TransferConfirmation', {
      type: 'data',
      details: {
        network: selectedNetwork,
        phoneNumber,
        plan: selectedPlan,
        amount: Number(selectedPlan.amount),
        serviceCharge,
        total: Number(selectedPlan.amount) + serviceCharge,
        billerId: selectedNetwork.id,
        billerName: selectedNetwork.name,
        division: selectedNetwork.division,
        productId: selectedNetwork.product,
        paymentItem: selectedPlan.paymentCode,
        walletType: route.params?.walletType || 'personal',
      }
    });
  };

  const renderPlanItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.planCard,
        selectedPlan?.paymentCode === item.paymentCode && styles.planCardActive
      ]}
      onPress={() => setSelectedPlan(item)}
    >
      <View style={styles.planInfo}>
        <Text style={[styles.planName, selectedPlan?.paymentCode === item.paymentCode && styles.planTextActive]}>
          {item.name || item.paymentitemname}
        </Text>
        <Text style={[styles.planValidity, selectedPlan?.paymentCode === item.paymentCode && styles.planTextActive]}>
          {item.validity || 'Direct Data'}
        </Text>
      </View>
      <View style={styles.planPriceContainer}>
        <Text style={[styles.planAmount, selectedPlan?.paymentCode === item.paymentCode && styles.planTextActive]}>
          ₦{Number(item.amount).toLocaleString()}
        </Text>
        {selectedPlan?.paymentCode === item.paymentCode && (
          <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginLeft: 8 }} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Buy Data</Text>
        <TouchableOpacity style={styles.historyButton}>
          <Ionicons name="receipt-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.inputSection}>
          <Text style={styles.sectionLabel}>Phone Number</Text>
          <Input
            placeholder="0801 234 5678"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            maxLength={11}
            icon="call-outline"
            rightContent={
              <View style={styles.inputRight}>
                {selectedNetwork && (
                  <TouchableOpacity
                    style={styles.inputNetworkBadge}
                    onPress={() => setShowNetworkGrid(!showNetworkGrid)}
                  >
                    <Ionicons name="wifi" size={14} color={colors.primary} />
                    <Text style={styles.inputNetworkName}>{selectedNetwork.name}</Text>
                    <Ionicons name="chevron-down" size={12} color={colors.textLight} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.contactBtn}>
                  <Ionicons name="person-add-outline" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
            }
          />
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
                    selectedNetwork?.id === network.id && styles.activeBillerBorder
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

        {selectedNetwork ? (
          <View style={styles.plansSection}>
            <View style={styles.plansHeader}>
              <Text style={styles.sectionTitle}>Select Plans</Text>
              <TouchableOpacity>
                <Text style={styles.linkText}>View All</Text>
              </TouchableOpacity>
            </View>

            {/* Categories Tabs */}
            <View style={styles.tabsContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {PLAN_CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.tab, activeCategory === cat && styles.activeTab]}
                    onPress={() => setActiveCategory(cat)}
                  >
                    <Text style={[styles.tabText, activeCategory === cat && styles.activeTabText]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {isPlansLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: 40 }} />
            ) : (
              <View style={styles.plansList}>
                {categorizedPlans[activeCategory]?.length > 0 ? (
                  categorizedPlans[activeCategory].map(plan => (
                    <View key={plan.id}>{renderPlanItem({ item: plan })}</View>
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="cube-outline" size={48} color={colors.textLight + '30'} />
                    <Text style={styles.emptyText}>No plans available in this category</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        ) : phoneNumber.length >= 4 && !isFetchingBillers ? (
          <View style={styles.hintContainer}>
            <Ionicons name="alert-circle-outline" size={20} color={colors.warning} />
            <Text style={styles.hintText}>Could not detect network. Please select manually.</Text>
            <TouchableOpacity onPress={() => setShowNetworkGrid(true)}>
              <Text style={[styles.linkText, { marginLeft: 8 }]}>Select Network</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {selectedPlan && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View>
                <Text style={styles.summaryTitle}>Confirm Payment</Text>
                <Text style={styles.summarySubtitle}>{selectedPlan.name || selectedPlan.paymentitemname}</Text>
              </View>
              <Text style={styles.summaryTotal}>₦{Number(selectedPlan.amount).toLocaleString()}</Text>
            </View>
            <Button
              title={`Pay ₦${Number(selectedPlan.amount).toLocaleString()}`}
              onPress={handleContinue}
              style={styles.payBtn}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
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
  historyButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  inputSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: 12,
  },
  inputRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputNetworkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '10',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  inputNetworkName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginHorizontal: 4,
  },
  contactBtn: {
    padding: 4,
  },
  manualSelectionContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  networkGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  networkCardSmall: {
    width: '23%',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeBillerBorder: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '05',
  },
  networkNameSmall: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },
  plansSection: {
    flex: 1,
  },
  plansHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  tabsContainer: {
    marginBottom: 16,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeTab: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
  },
  activeTabText: {
    color: '#fff',
  },
  plansList: {
    gap: 12,
  },
  planCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  planCardActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  planInfo: {
    flex: 1,
    marginRight: 12,
  },
  planName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  planValidity: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
  },
  planPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  planTextActive: {
    color: '#fff',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 12,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '10',
    padding: 12,
    borderRadius: 12,
    marginTop: 10,
  },
  hintText: {
    fontSize: 12,
    color: colors.text,
    flex: 1,
    marginLeft: 8,
  },
  summaryCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 14,
    color: colors.textLight,
  },
  summarySubtitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  summaryTotal: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
  },
  payBtn: {
    height: 56,
    borderRadius: 16,
  },
});
