import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '../../styles/colors';

const CATEGORIES = [
  { label: 'All', value: '' },
  { label: 'Transfer', value: 'transfer' },
  { label: 'Bill Payment', value: 'bill' },
  { label: 'Airtime', value: 'airtime' },
  { label: 'Data', value: 'data' },
  { label: 'Wallet Fund', value: 'wallet_fund' },
];

const STATUSES = [
  { label: 'All', value: '' },
  { label: 'Success', value: 'success' },
  { label: 'Pending', value: 'pending' },
  { label: 'Failed', value: 'failed' },
];

const FilterModal = ({ visible, onClose, filters, setFilters, onApply, onClear }) => {
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [dateType, setDateType] = useState('from');
  const [tempYear, setTempYear] = useState(new Date().getFullYear());
  const [tempMonth, setTempMonth] = useState(new Date().getMonth());
  const [tempDay, setTempDay] = useState(new Date().getDate());

  const openDatePicker = (type) => {
    const existing = type === 'from' ? filters.fromDate : filters.toDate;
    const d = existing || new Date();
    setTempYear(d.getFullYear());
    setTempMonth(d.getMonth());
    setTempDay(d.getDate());
    setDateType(type);
    setDatePickerVisible(true);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Filters</Text>

        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Search</Text>
          <TouchableOpacity style={styles.searchInput}>
            <Ionicons name="search" size={20} color={colors.textLight} />
            <Text style={styles.searchPlaceholder}>{filters.search || 'Search transactions'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Category</Text>
          <TouchableOpacity style={styles.dropdown}>
            <Text style={styles.dropdownText}>{CATEGORIES.find(c => c.value === filters.category)?.label || 'All Categories'}</Text>
            <Ionicons name="chevron-down" size={16} color={colors.textLight} />
          </TouchableOpacity>
        </View>

        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Status</Text>
          <TouchableOpacity style={styles.dropdown}>
            <Text style={styles.dropdownText}>{STATUSES.find(s => s.value === filters.status)?.label || 'All Statuses'}</Text>
            <Ionicons name="chevron-down" size={16} color={colors.textLight} />
          </TouchableOpacity>
        </View>

        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Date Range</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => openDatePicker('from')}>
            <Ionicons name="calendar-outline" size={16} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.dateText}>
              {filters.fromDate ? filters.fromDate.toLocaleDateString() : 'From Date'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dateButton} onPress={() => openDatePicker('to')}>
            <Ionicons name="calendar-outline" size={16} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.dateText}>
              {filters.toDate ? filters.toDate.toLocaleDateString() : 'To Date'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.modalButtons}>
          <TouchableOpacity style={styles.clearButton} onPress={onClear}>
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyButton} onPress={onApply}>
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>

        <Modal visible={datePickerVisible} transparent animationType="slide">
          <View style={styles.dateModalOverlay}>
            <View style={styles.dateModalCard}>
              <View style={styles.dateModalHeader}>
                <Text style={styles.dateModalTitle}>
                  {dateType === 'from' ? 'From Date' : 'To Date'}
                </Text>
                <TouchableOpacity onPress={() => setDatePickerVisible(false)}>
                  <Ionicons name="close" size={22} color="#1e293b" />
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
                <View style={{ flex: 2 }}>
                  <Text style={styles.pickerLabel}>Month</Text>
                  <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                    {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                      <TouchableOpacity key={m} onPress={() => setTempMonth(i)}
                        style={[styles.pickerItem, tempMonth === i && styles.pickerItemActive]}>
                        <Text style={[styles.pickerItemText, tempMonth === i && styles.pickerItemTextActive]}>{m}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pickerLabel}>Day</Text>
                  <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                      <TouchableOpacity key={d} onPress={() => setTempDay(d)}
                        style={[styles.pickerItem, tempDay === d && styles.pickerItemActive]}>
                        <Text style={[styles.pickerItemText, tempDay === d && styles.pickerItemTextActive]}>{d}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                <View style={{ flex: 1.5 }}>
                  <Text style={styles.pickerLabel}>Year</Text>
                  <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                    {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map(y => (
                      <TouchableOpacity key={y} onPress={() => setTempYear(y)}
                        style={[styles.pickerItem, tempYear === y && styles.pickerItemActive]}>
                        <Text style={[styles.pickerItemText, tempYear === y && styles.pickerItemTextActive]}>{y}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.applyButton, { flex: undefined, marginTop: 0 }]}
                onPress={() => {
                  const chosen = new Date(tempYear, tempMonth, tempDay);
                  setFilters(prev => ({ ...prev, [dateType + 'Date']: chosen }));
                  setDatePickerVisible(false);
                }}
              >
                <Text style={styles.applyButtonText}>Confirm Date</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 24,
  },
  filterGroup: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: colors.lightBg,
    borderRadius: 12,
  },
  searchPlaceholder: {
    color: colors.textLight,
    fontSize: 16,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.lightBg,
    borderRadius: 12,
  },
  dropdownText: {
    fontSize: 16,
    color: colors.text,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.lightBg,
    borderRadius: 12,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 16,
    color: colors.text,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 24,
  },
  clearButton: {
    flex: 1,
    padding: 16,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    alignItems: 'center',
  },
  clearButtonText: {
    color: colors.textLight,
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.primary,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  dateModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  dateModalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  dateModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateModalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1e293b',
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  pickerScroll: {
    height: 180,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
  },
  pickerItem: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  pickerItemActive: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  pickerItemText: {
    fontSize: 14,
    color: '#475569',
  },
  pickerItemTextActive: {
    fontWeight: '700',
    color: '#2563eb',
  },
});

export default FilterModal;
