import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';
import LoadingIndicator from '../LoadingIndicator';

export default function BillPaymentForm({
  billerItems,
  selectedBiller,
  onConfirm,
  loading,
  onBack,
}) {
  const [selectedItem, setSelectedItem] = React.useState(null);
  const [customerId, setCustomerId] = React.useState('');
  const [amount, setAmount] = React.useState('');

  const handleProceed = () => {
    // If there are specific items to choose from but none is selected
    if (billerItems && billerItems.length > 0 && !selectedItem) {
      alert('Please select a payment item');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    // Auto-select if there's only one default item
    const itemToSubmit = selectedItem || (billerItems?.length === 1 ? billerItems[0] : null);

    onConfirm({
      item: itemToSubmit,
      customerId,
      amount,
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingIndicator text="Loading details..." />
      </View>
    );
  }

  const requiresCustomer = selectedBiller?.category !== 'Airtime' && selectedBiller?.category !== 'Data';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title} numberOfLines={1}>{selectedBiller?.name}</Text>
          <Text style={styles.subtitle}>Enter payment details</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.billerInfoCard}>
            <View style={styles.iconCircle}>
              <Ionicons name="business" size={28} color={colors.primary} />
            </View>
            <View style={styles.billerTextInfo}>
              <Text style={styles.billerCategoryText}>{selectedBiller?.category}</Text>
              <Text style={styles.billerNameText}>{selectedBiller?.name}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {billerItems && billerItems.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Select Package</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.itemsScroll} contentContainerStyle={styles.itemsScrollContent}>
                {billerItems.map((item, index) => {
                  const isSelected = selectedItem?.paymentitemid === item.paymentitemid || selectedItem?.billerid === item.billerid && selectedItem?.paymentitemname === item.paymentitemname;
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[styles.itemCard, isSelected && styles.itemCardSelected]}
                      onPress={() => {
                        setSelectedItem(item);
                        if (item.amount && item.amount > 0) setAmount(item.amount.toString());
                      }}
                    >
                      <Text style={[styles.itemName, isSelected && styles.itemNameSelected]} numberOfLines={2}>
                        {item.name || item.paymentitemname || 'Package'}
                      </Text>
                      {item.amount && parseInt(item.amount) > 0 ? (
                        <Text style={[styles.itemPrice, isSelected && styles.itemPriceSelected]}>
                          ₦{parseInt(item.amount).toLocaleString()}
                        </Text>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Amount to Pay</Text>
            <View style={[styles.inputContainer, styles.amountInputContainer]}>
              <Text style={styles.currencySymbol}>₦</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor={colors.textLight}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          {requiresCustomer && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Customer ID Number</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color={colors.textLight} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="E.g Meter Number, Phone, Account ID"
                  placeholderTextColor={colors.textLight}
                  value={customerId}
                  onChangeText={setCustomerId}
                />
              </View>
              <Text style={styles.hint}>
                <Ionicons name="information-circle-outline" size={12} color={colors.textLight} /> Required for {selectedBiller?.category} payments
              </Text>
            </View>
          )}

        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleProceed}
          activeOpacity={0.8}
          disabled={loading}
        >
          {loading ? (
            <LoadingIndicator />
          ) : (
            <Text style={styles.confirmButtonText}>Continue</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: colors.lightBg,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    marginBottom: 40,
  },
  billerInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.lightBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  billerTextInfo: {
    flex: 1,
  },
  billerCategoryText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  billerNameText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: -24,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
  },
  amountInputContainer: {
    paddingVertical: 4,
    backgroundColor: colors.lightBg,
    borderColor: 'transparent',
  },
  inputIcon: {
    marginRight: 12,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  amountInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 28,
    color: colors.text,
    fontWeight: '700',
  },
  hint: {
    fontSize: 13,
    color: colors.textLight,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemsScroll: {
    marginHorizontal: -24,
  },
  itemsScrollContent: {
    paddingHorizontal: 24,
    gap: 12,
  },
  itemCard: {
    width: 140,
    backgroundColor: colors.lightBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    marginRight: 12,
  },
  itemCardSelected: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  itemNameSelected: {
    color: colors.primary,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  itemPriceSelected: {
    color: colors.primary,
  },
  footer: {
    padding: 20,
    paddingBottom: 30,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  confirmButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 17,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    fontWeight: '500',
    color: colors.textLight,
  },
});
