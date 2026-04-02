import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';
import billsService from '../../services/billsPaymentService';
import { AuthContext, useAuth } from '../../context/AuthContext';
import BillsCategorySelector from '../../components/bills/BillsCategorySelector';
import BillerList from '../../components/bills/BillerList';
import BillPaymentForm from '../../components/bills/BillPaymentForm';
import BillPaymentConfirmation from '../../components/bills/BillPaymentConfirmation';
import PaymentSuccessScreen from '../../components/bills/PaymentSuccessScreen';

const SCREENS = {
  CATEGORY: 'category',
  BILLER_LIST: 'biller_list',
  PAYMENT_FORM: 'payment_form',
  CONFIRMATION: 'confirmation',
  SUCCESS: 'success',
};

export default function BillsScreen({ route, navigation }) {
  const initialCategory = route?.params?.initialCategory;
  const [currentScreen, setCurrentScreen] = useState(initialCategory ? SCREENS.BILLER_LIST : SCREENS.CATEGORY);
  const [categories, setCategories] = useState([]);
  const [billers, setBillers] = useState([]);
  const [billerItems, setBillerItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedBiller, setSelectedBiller] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [successData, setSuccessData] = useState(null);
  const { user } = useContext(AuthContext);

  // Initialize: fetch categories on mount
  useEffect(() => {
    if (initialCategory) {
      handleSelectCategory(initialCategory);
    } else {
      fetchCategories();
    }
  }, [initialCategory]);

  // Fetch categories from API
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const categoryList = await billsService.getCategories();
      setCategories(categoryList);
    } catch (error) {
      Alert.alert('Error', 'Failed to load bill categories. Please try again.');
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle category selection
  const handleSelectCategory = async (categoryName) => {
    setSelectedCategory(categoryName);
    setLoading(true);
    try {
      const billerList = await billsService.getBillers(categoryName);
      setBillers(billerList);
      setCurrentScreen(SCREENS.BILLER_LIST);
    } catch (error) {
      Alert.alert('Error', 'Failed to load billers. Please try again.');
      console.error('Error fetching billers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle biller selection
  const handleSelectBiller = async (biller) => {
    setSelectedBiller(biller);
    setLoading(true);
    try {
      const items = await billsService.getBillerItems(biller.id, biller.division, biller.product);
      setBillerItems(items);
      setCurrentScreen(SCREENS.PAYMENT_FORM);
    } catch (error) {
      Alert.alert('Error', 'Failed to load payment options. Please try again.');
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle payment form submission
  const handlePaymentSubmit = async (formData) => {
    // Validate customer if required (utilities, cable TV)
    if (formData.customerId && !['Airtime', 'Data'].includes(selectedCategory)) {
      setLoading(true);

      try {
        const validationResult = await billsService.validateCustomer({
          billerId: selectedBiller.id,
          customerId: formData.customerId,
          divisionId: selectedBiller.division,
          paymentItem: formData.item?.paymentCode || formData.item?.paymentcode || selectedBiller.id,
        });

        if (!validationResult || !validationResult.success) {
          Alert.alert('Validation Failed', validationResult?.message || 'Invalid customer ID');
          setLoading(false);
          return;
        }
      } catch (error) {
        Alert.alert('Error', 'Customer validation failed');
        setLoading(false);
        return;
      }
    }

    // Prepare payment data for confirmation
    const payment = {
      amount: formData.amount,
      customerId: formData.customerId,
      billerName: selectedBiller.name,
      billerCategory: selectedBiller.category,
      itemName: formData.item?.paymentitemname || formData.item?.name || 'Bill Payment',
      item: formData.item,
      convenienceFee: selectedBiller.convenienceFee || 0,
    };

    setPaymentData(payment);
    setCurrentScreen(SCREENS.CONFIRMATION);
  };

  // Handle payment confirmation
  const handleConfirmPayment = async (pin) => {
    setLoading(true);

    try {
      const reference = `VPay-${Date.now()}`;

      await billsService.payBill({
        billerId: selectedBiller.id,
        billerName: selectedBiller.name,
        billType: selectedBiller.category,
        customerNumber: paymentData.customerId || '',
        division: selectedBiller.division,
        paymentItem: paymentData.item?.paymentCode || paymentData.item?.paymentcode || '',
        productId: selectedBiller.product,
        amount: parseFloat(paymentData.amount),
        pin,
        phoneNumber: user?.phone || '',
        reference,
        walletType: route.params?.walletType || 'personal',
      });

      setSuccessData({
        reference,
        amount: paymentData.amount,
        status: 'completed',
        paymentDetails: paymentData,
      });
      setCurrentScreen(SCREENS.SUCCESS);
    } catch (error) {
      Alert.alert('Payment Failed', error?.message || 'Transaction failed. Please try again.');
      console.error('Payment error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle transaction status check
  const handleCheckStatus = async () => {
    if (!successData?.reference) return;

    setLoading(true);
    try {
      const status = await billsService.getTransactionStatus(successData.reference);
      Alert.alert(
        'Transaction Status',
        `Status: ${status.transactionStatus || 'Unknown'}\nAmount: ₦${status.amount || '0'}`
      );
    } catch (error) {
      Alert.alert('Error', 'Could not retrieve transaction status');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (currentScreen === SCREENS.CATEGORY) {
      navigation.goBack();
    } else if (currentScreen === SCREENS.BILLER_LIST) {
      if (initialCategory) {
        navigation.goBack();
      } else {
        setCurrentScreen(SCREENS.CATEGORY);
      }
    } else if (currentScreen === SCREENS.PAYMENT_FORM) {
      setCurrentScreen(SCREENS.BILLER_LIST);
    } else if (currentScreen === SCREENS.CONFIRMATION) {
      setCurrentScreen(SCREENS.PAYMENT_FORM);
    }
  };

  // Handle completion from success screen
  const handleDone = () => {
    setCurrentScreen(SCREENS.CATEGORY);
    setSelectedCategory(null);
    setSelectedBiller(null);
    setPaymentData(null);
    setSuccessData(null);
    setBillers([]);
    setBillerItems([]);
  };

  // Render current screen
  const renderScreen = () => {
    switch (currentScreen) {
      case SCREENS.CATEGORY:
        return (
          <SafeAreaView style={styles.container}>
              <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                  <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{useAuth().accountMode === 'business' ? 'Business Suite' : 'Pay Bills'}</Text>
                <View style={{ width: 40 }} />
              </View>
              {useAuth().accountMode === 'business' ? (
                <View style={styles.businessSuite}>
                  <Text style={styles.suiteHeader}>Operational Tools</Text>
                  <View style={styles.suiteGrid}>
                    <TouchableOpacity style={styles.suiteItem} onPress={() => navigation.navigate('StaffManagement')}>
                        <View style={[styles.suiteIcon, { backgroundColor: '#E3F2FD' }]}>
                            <Ionicons name="people-outline" size={28} color="#1565C0" />
                        </View>
                        <Text style={styles.suiteLabel}>Payroll & Staff</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.suiteItem} onPress={() => navigation.navigate('BusinessInsights')}>
                        <View style={[styles.suiteIcon, { backgroundColor: '#FFF3E0' }]}>
                            <Ionicons name="bar-chart-outline" size={28} color="#E65100" />
                        </View>
                        <Text style={styles.suiteLabel}>Insights</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.suiteItem} onPress={() => navigation.navigate('Invoices')}>
                        <View style={[styles.suiteIcon, { backgroundColor: '#E8F5E9' }]}>
                            <Ionicons name="document-text-outline" size={28} color="#2E7D32" />
                        </View>
                        <Text style={styles.suiteLabel}>Invoices</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.suiteItem}>
                        <View style={[styles.suiteIcon, { backgroundColor: '#F3E5F5' }]}>
                            <Ionicons name="cube-outline" size={28} color="#7B1FA2" />
                        </View>
                        <Text style={styles.suiteLabel}>Inventory</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <BillsCategorySelector
                  categories={categories}
                  loading={loading}
                  onSelectCategory={handleSelectCategory}
                />
              )}
          </SafeAreaView>
        );

      case SCREENS.BILLER_LIST:
        return (
          <SafeAreaView style={styles.container}>
            <View style={styles.header}>
              <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Select {selectedCategory}</Text>
              <View style={{ width: 40 }} />
            </View>
            <BillerList
              billers={billers}
              loading={loading}
              onSelectBiller={handleSelectBiller}
            />
          </SafeAreaView>
        );

      case SCREENS.PAYMENT_FORM:
        return (
          <SafeAreaView style={styles.container}>
            <BillPaymentForm
              billerItems={billerItems}
              selectedBiller={selectedBiller}
              onConfirm={handlePaymentSubmit}
              loading={loading}
              onBack={() => setCurrentScreen(SCREENS.BILLER_LIST)}
            />
          </SafeAreaView>
        );

      case SCREENS.CONFIRMATION:
        return (
          <SafeAreaView style={styles.container}>
            <BillPaymentConfirmation
              paymentDetails={paymentData}
              loading={loading}
              onConfirm={handleConfirmPayment}
              onCancel={() => setCurrentScreen(SCREENS.PAYMENT_FORM)}
            />
          </SafeAreaView>
        );

      case SCREENS.SUCCESS:
        return (
          <PaymentSuccessScreen
            reference={successData?.reference}
            amount={successData?.amount}
            paymentDetails={successData?.paymentDetails || {}}
            onDone={handleDone}
            onViewStatus={handleCheckStatus}
          />
        );

      default:
        return null;
    }
  };

  return <View style={styles.screenContainer}>{renderScreen()}</View>;
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: colors.lightBg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
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
  businessSuite: {
    padding: 24,
  },
  suiteHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textLight,
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  suiteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  suiteItem: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  suiteIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  suiteLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
});
