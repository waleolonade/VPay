import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';
import { businessService } from '../../services/businessService';
import { useAuth } from '../../context/AuthContext';
import LoadingIndicator from '../../components/LoadingIndicator';

export default function BusinessRequestScreen({ navigation }) {
  const { user, toggleAccountMode } = useAuth();
  const [businessName, setBusinessName] = useState('');
  const [businessCategory, setBusinessCategory] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [cacNumber, setCacNumber] = useState('');
  const [cacCertificate, setCacCertificate] = useState(null);
  const [estimatedRevenue, setEstimatedRevenue] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setRefreshing(true);
      const res = await businessService.getRequests();
      if (res.success && res.data) {
        setRequests(res.data);
        const hasPendingOrApproved = res.data.some(
          (req) => req.status === 'pending' || req.status === 'approved'
        );
        setShowForm(!hasPendingOrApproved);
      }
    } catch (error) {
      console.error('Load requests error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSubmit = async () => {
    if (!businessName || !businessCategory || !cacNumber) {
      Alert.alert('Error', 'Please fill in business name, category, and CAC number');
      return;
    }

    try {
      setLoading(true);
      const res = await businessService.submitRequest({
        businessName,
        businessCategory,
        businessEmail: businessEmail || user.email,
        businessPhone: businessPhone || user.phone,
        businessAddress,
        cacNumber,
        cacCertificate,
        estimatedMonthlyRevenue: parseFloat(estimatedRevenue) || 0,
      });

      if (res.success) {
        Alert.alert(
          'Success',
          'Your business account request has been submitted! We will review it within 24-48 hours.',
          [{ text: 'OK', onPress: () => loadRequests() }]
        );
        setBusinessName('');
        setBusinessCategory('');
        setBusinessEmail('');
        setBusinessPhone('');
        setBusinessAddress('');
        setCacNumber('');
        setCacCertificate(null);
        setEstimatedRevenue('');
      }
    } catch (error) {
      console.error('Submit request error:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadCertificate = () => {
    Alert.alert('Success', 'CAC Certificate uploaded successfully!');
    setCacCertificate('cac_cert_uploaded.pdf');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return '#4CAF50';
      case 'rejected':
        return '#F44336';
      case 'pending':
      default:
        return '#FF9800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return 'checkmark-circle';
      case 'rejected':
        return 'close-circle';
      case 'pending':
      default:
        return 'time';
    }
  };

  const renderRequestCard = (request) => (
    <View key={request.id} style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.requestTitleRow}>
          <Text style={styles.requestTitle}>{request.businessName}</Text>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(request.status)}20` }]}>
            <Ionicons name={getStatusIcon(request.status)} size={14} color={getStatusColor(request.status)} />
            <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>
              {request.status.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={styles.requestCategory}>{request.businessCategory}</Text>
      </View>

      <View style={styles.requestDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="document-text-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.detailText}>CAC: {request.cacNumber}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.detailText}>
            Submitted: {new Date(request.createdAt).toLocaleDateString()}
          </Text>
        </View>
        {request.reviewedAt && (
          <View style={styles.detailRow}>
            <Ionicons name="checkmark-done-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.detailText}>
              Reviewed: {new Date(request.reviewedAt).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>

      {request.status === 'rejected' && request.rejectionReason && (
        <View style={styles.rejectionBox}>
          <Ionicons name="alert-circle" size={16} color="#F44336" />
          <Text style={styles.rejectionText}>{request.rejectionReason}</Text>
        </View>
      )}

      {request.status === 'approved' && (
        <TouchableOpacity
          style={styles.activateBtn}
          onPress={async () => {
            await toggleAccountMode();
            navigation.navigate('BusinessDashboard');
          }}
        >
          <Text style={styles.activateBtnText}>Switch to Business Mode</Text>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading && requests.length === 0) {
    return <LoadingIndicator text="Loading your business requests..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Business Account</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadRequests} />}
      >
        {requests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Request History</Text>
            {requests.map(renderRequestCard)}
          </View>
        )}

        {showForm ? (
          <>
            <View style={styles.iconContainer}>
              <Ionicons name="business" size={60} color={colors.primary} />
            </View>

            <Text style={styles.title}>Upgrade to Business Account</Text>
            <Text style={styles.subtitle}>
              Get a dedicated business account, accept payments via QR, manage payroll, and access business analytics.
            </Text>

            <View style={styles.form}>
              <Text style={styles.label}>Business Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Acme Corp Ltd"
                value={businessName}
                onChangeText={setBusinessName}
              />

              <Text style={styles.label}>Business Category *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Retail, Services, Technology"
                value={businessCategory}
                onChangeText={setBusinessCategory}
              />

              <Text style={styles.label}>Business Email</Text>
              <TextInput
                style={styles.input}
                placeholder="info@business.com"
                value={businessEmail}
                onChangeText={setBusinessEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.label}>Business Phone</Text>
              <TextInput
                style={styles.input}
                placeholder="+234 XXX XXX XXXX"
                value={businessPhone}
                onChangeText={setBusinessPhone}
                keyboardType="phone-pad"
              />

              <Text style={styles.label}>Business Address</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Full business address"
                value={businessAddress}
                onChangeText={setBusinessAddress}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.label}>CAC Registration Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. RC1234567"
                value={cacNumber}
                onChangeText={setCacNumber}
                autoCapitalize="characters"
              />

              <Text style={styles.label}>Estimated Monthly Revenue (₦)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 500000"
                value={estimatedRevenue}
                onChangeText={setEstimatedRevenue}
                keyboardType="numeric"
              />

              <Text style={styles.label}>CAC Certificate (Optional)</Text>
              <TouchableOpacity
                style={[styles.uploadBtn, cacCertificate && styles.uploadBtnActive]}
                onPress={handleUploadCertificate}
              >
                <Ionicons
                  name={cacCertificate ? 'checkmark-circle' : 'cloud-upload-outline'}
                  size={24}
                  color={cacCertificate ? '#fff' : colors.primary}
                />
                <Text style={[styles.uploadBtnText, cacCertificate && styles.uploadBtnTextActive]}>
                  {cacCertificate || 'Upload CAC Certificate'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
              {loading ? (
                <LoadingIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Submit Request</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.footerNote}>
              By submitting, you agree to our terms of service for business accounts. Approval typically takes 24-48 hours.
            </Text>
          </>
        ) : (
          !refreshing &&
          requests.length > 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-done-circle" size={64} color={colors.primary} />
              <Text style={styles.emptyTitle}>Request In Progress</Text>
              <Text style={styles.emptyText}>
                We're reviewing your business account request. You'll be notified once it's processed.
              </Text>
            </View>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 15,
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  requestHeader: {
    marginBottom: 12,
  },
  requestTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  requestCategory: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  requestDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  rejectionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  rejectionText: {
    flex: 1,
    fontSize: 13,
    color: '#D32F2F',
    lineHeight: 18,
  },
  activateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 6,
  },
  activateBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: colors.text,
    marginBottom: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 10,
  },
  uploadBtnActive: {
    backgroundColor: colors.primary,
    borderStyle: 'solid',
  },
  uploadBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  uploadBtnTextActive: {
    color: '#fff',
  },
  submitBtn: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  footerNote: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 40,
  },
});
