import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  Modal, TextInput, Alert, RefreshControl, Dimensions 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';
import api from '../../services/api';
import LoadingIndicator from '../../components/LoadingIndicator';

const { width } = Dimensions.get('window');

export default function StaffManagementScreen({ navigation }) {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);

  // Form State
  const [form, setForm] = useState({
    name: '',
    phone: '',
    account_number: '',
    bank_name: '',
    base_salary: '',
  });

  const fetchStaff = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await api.get('/api/v1/business/payroll/staff');
      if (res.success) setStaff(res.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch staff list');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleSaveStaff = async () => {
    if (!form.name || !form.account_number || !form.bank_name || !form.base_salary) {
      Alert.alert('Required', 'Please fill all mandatory fields');
      return;
    }

    try {
      setLoading(true);
      if (selectedStaff) {
        await api.put(`/api/v1/business/payroll/staff/${selectedStaff.id}`, form);
      } else {
        await api.post('/api/v1/business/payroll/staff', form);
      }
      setModalVisible(false);
      resetForm();
      fetchStaff();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save staff');
    } finally {
      setLoading(false);
    }
  };

  const handlePayIndividual = (item) => {
    Alert.alert(
      'Confirm Payment',
      `Send ₦${parseFloat(item.base_salary).toLocaleString()} to ${item.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Pay Now', 
          onPress: async () => {
            try {
              setLoading(true);
              const res = await api.post('/api/v1/business/payroll/pay', { 
                staffId: item.id, 
                isBulk: false,
                narration: `Salary Payment to ${item.name}`
              });
              if (res.success) Alert.alert('Success', 'Payment processed successfully');
            } catch (err) {
              Alert.alert('Payment Failed', err.response?.data?.message || 'Transfer error');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handlePayAll = () => {
    const total = staff.filter(s => s.status === 'active').reduce((acc, s) => acc + parseFloat(s.base_salary), 0);
    if (total === 0) return;

    Alert.alert(
      'Bulk Payroll',
      `Process bulk salary for ${staff.length} staff?\nTotal: ₦${total.toLocaleString()}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Pay All Now', 
          onPress: async () => {
            try {
              setLoading(true);
              const res = await api.post('/api/v1/business/payroll/pay', { isBulk: true });
              if (res.success) Alert.alert('Success', `Bulk payment of ₦${total.toLocaleString()} completed!`);
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Bulk payment failed');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setForm({ name: '', phone: '', account_number: '', bank_name: '', base_salary: '' });
    setSelectedStaff(null);
  };

  const renderStaffItem = ({ item }) => (
    <View style={styles.staffCard}>
      <View style={styles.staffInfo}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name[0]}</Text>
        </View>
        <View style={styles.details}>
          <Text style={styles.staffName}>{item.name}</Text>
          <Text style={styles.staffSub}>{item.bank_name} • {item.account_number}</Text>
          <View style={styles.salaryBadge}>
             <Text style={styles.salaryText}>₦{parseFloat(item.base_salary).toLocaleString()}</Text>
          </View>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.payBtn} onPress={() => handlePayIndividual(item)}>
          <Text style={styles.payBtnText}>Pay</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.moreBtn} 
          onPress={() => {
            setSelectedStaff(item);
            setForm({ ...item, base_salary: item.base_salary.toString() });
            setModalVisible(true);
          }}
        >
          <Ionicons name="create-outline" size={20} color={colors.textLight} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Staff Management</Text>
        <TouchableOpacity onPress={() => { resetForm(); setModalVisible(true); }}>
          <Ionicons name="add-circle" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.bulkActionArea}>
        <View>
          <Text style={styles.bulkTitle}>Pay Active Team</Text>
          <Text style={styles.bulkSub}>{staff.length} Active Members</Text>
        </View>
        <TouchableOpacity style={styles.bulkBtn} onPress={handlePayAll}>
          <Text style={styles.bulkBtnText}>Pay All</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={staff}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderStaffItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchStaff} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="account-group-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No staff registered yet</Text>
          </View>
        }
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{selectedStaff ? 'Edit Staff' : 'Add New Staff'}</Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                        <Ionicons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>

                <TextInput 
                    style={styles.input} 
                    placeholder="Full Name" 
                    value={form.name} 
                    onChangeText={(v) => setForm({...form, name: v})} 
                />
                <TextInput 
                    style={styles.input} 
                    placeholder="Phone Number" 
                    value={form.phone} 
                    keyboardType="phone-pad"
                    onChangeText={(v) => setForm({...form, phone: v})} 
                />
                <TextInput 
                    style={styles.input} 
                    placeholder="Bank Name" 
                    value={form.bank_name} 
                    onChangeText={(v) => setForm({...form, bank_name: v})} 
                />
                <TextInput 
                    style={styles.input} 
                    placeholder="Account Number" 
                    value={form.account_number} 
                    keyboardType="numeric"
                    maxLength={10}
                    onChangeText={(v) => setForm({...form, account_number: v})} 
                />
                <TextInput 
                    style={styles.input} 
                    placeholder="Monthly Base Salary (₦)" 
                    value={form.base_salary} 
                    keyboardType="numeric"
                    onChangeText={(v) => setForm({...form, base_salary: v})} 
                />

                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveStaff}>
                    <Text style={styles.saveBtnText}>{selectedStaff ? 'Update Details' : 'Register Staff'}</Text>
                </TouchableOpacity>

                {selectedStaff && (
                    <TouchableOpacity 
                        style={styles.deleteBtn} 
                        onPress={() => {
                            Alert.alert('Delete', 'Permanently remove this staff?', [
                                { text: 'No' },
                                { text: 'Yes, Remove', onPress: async () => {
                                    await api.put(`/api/v1/business/payroll/staff/${selectedStaff.id}`, { status: 'inactive' });
                                    setModalVisible(false);
                                    fetchStaff();
                                }}
                            ])
                        }}
                    >
                        <Text style={styles.deleteBtnText}>Remove Staff Member</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
      </Modal>

      <LoadingIndicator visible={loading} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FD' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0'
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  bulkActionArea: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 24, backgroundColor: '#1a237e', margin: 16, borderRadius: 20,
    elevation: 4, shadowColor: '#1a237e', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8
  },
  bulkTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  bulkSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  bulkBtn: { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  bulkBtnText: { color: '#1a237e', fontWeight: '800' },
  list: { padding: 16 },
  staffCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10
  },
  staffInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { 
    width: 48, height: 48, borderRadius: 24, backgroundColor: `${colors.primary}15`,
    justifyContent: 'center', alignItems: 'center', marginRight: 12
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: colors.primary },
  staffName: { fontSize: 16, fontWeight: '700', color: colors.text },
  staffSub: { fontSize: 12, color: colors.textLight, marginTop: 2 },
  salaryBadge: { 
    marginTop: 6, backgroundColor: '#f0f0f0', paddingHorizontal: 8, 
    paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start' 
  },
  salaryText: { fontSize: 12, fontWeight: '700', color: '#1a237e' },
  actions: { flexDirection: 'row', alignItems: 'center' },
  payBtn: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, marginRight: 8 },
  payBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  moreBtn: { padding: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  input: {
    height: 56, backgroundColor: '#f5f7fa', borderRadius: 12, paddingHorizontal: 16,
    marginBottom: 12, fontSize: 16, color: colors.text
  },
  saveBtn: { 
    height: 56, backgroundColor: colors.primary, borderRadius: 12, 
    justifyContent: 'center', alignItems: 'center', marginTop: 12 
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  deleteBtn: { marginTop: 16, alignItems: 'center' },
  deleteBtnText: { color: '#f44336', fontWeight: '600' },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 16, color: colors.textLight, fontSize: 16 }
});
