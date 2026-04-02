import React, { useRef, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { colors } from '../../styles/colors';
import { AuthContext } from '../../context/AuthContext';

const formatDate = (date) => {
  const d = date || new Date();
  return d.toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};
const formatTime = (date) => {
  const d = date || new Date();
  return d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

export default function PaymentSuccessScreen({ reference, amount, paymentDetails = {}, onDone, onViewStatus }) {
  const { user } = useContext(AuthContext);
  const [exporting, setExporting] = React.useState(false);
  const completedAt = useRef(new Date());

  const senderName = user
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'You'
    : 'You';
  const senderPhone = user?.phone || '—';
  const totalStr = parseFloat(amount || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 });
  const dateStr = formatDate(completedAt.current);
  const timeStr = formatTime(completedAt.current);

  // ─── Share as text ───────────────────────────────────────────────
  const shareAsText = async () => {
    try {
      await Share.share({
        message:
          `✅ VPay Payment Receipt\n\n` +
          `Biller: ${paymentDetails.billerName || '—'}\n` +
          `Service: ${paymentDetails.itemName || '—'}\n` +
          `Amount: ₦${totalStr}\n` +
          `Sender: ${senderName} (${senderPhone})\n` +
          `Date: ${dateStr}\n` +
          `Time: ${timeStr}\n` +
          `Reference: ${reference || '—'}\n\n` +
          `Powered by VPay`,
      });
    } catch (e) {
      console.error(e);
    }
  };

  // ─── Generate + Share PDF ─────────────────────────────────────────
  const shareAsPDF = async () => {
    setExporting(true);
    try {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background: #F0F4FF; color: #0D1F3C; }
            .page { max-width: 480px; margin: 0 auto; background: #fff; min-height: 100vh; }

            /* Header */
            .header { background: #0052CC; color: #fff; padding: 32px 28px 24px; text-align: center; }
            .header .logo { font-size: 28px; font-weight: 900; letter-spacing: -0.5px; }
            .header .tagline { font-size: 13px; opacity: 0.7; margin-top: 4px; }
            .status-badge { display: inline-block; background: rgba(255,255,255,0.2); color: #fff; padding: 5px 16px; border-radius: 20px; font-size: 12px; font-weight: 700; letter-spacing: 1px; margin-top: 12px; }

            /* Amount Block */
            .amount-block { text-align: center; padding: 28px; background: #EBF2FF; border-bottom: 1px solid #E4EBF5; }
            .amount-label { font-size: 12px; color: #7A8BA6; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
            .amount { font-size: 44px; font-weight: 900; color: #0052CC; letter-spacing: -1px; margin-top: 6px; }

            /* Sections */
            section { padding: 24px 28px; border-bottom: 1px solid #E4EBF5; }
            .section-title { font-size: 11px; color: #7A8BA6; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; }

            /* Party rows */
            .party { display: flex; align-items: center; background: #F7F9FC; border-radius: 12px; padding: 14px; margin-bottom: 8px; }
            .avatar { width: 42px; height: 42px; border-radius: 12px; background: #0052CC; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 800; margin-right: 14px; flex-shrink: 0; }
            .avatar.biller { background: #EBF0FF; color: #2962FF; }
            .party-label { font-size: 11px; color: #7A8BA6; font-weight: 600; }
            .party-name { font-size: 15px; font-weight: 800; color: #0D1F3C; margin-top: 2px; }
            .party-phone { font-size: 12px; color: #7A8BA6; margin-top: 1px; }

            /* Detail rows */
            .row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #F0F4FF; }
            .row:last-child { border-bottom: none; }
            .row-label { font-size: 13px; color: #7A8BA6; }
            .row-value { font-size: 13px; font-weight: 700; color: #0D1F3C; text-align: right; max-width: 60%; }
            .row-value.highlight { color: #0052CC; font-size: 15px; font-weight: 900; }

            /* Reference */
            .ref-box { background: #F0F4FF; border-radius: 12px; padding: 16px; text-align: center; }
            .ref-label { font-size: 11px; color: #7A8BA6; font-weight: 600; margin-bottom: 6px; }
            .ref-value { font-family: monospace; font-size: 14px; font-weight: 800; color: #0052CC; letter-spacing: 1px; }

            /* Footer */
            .footer { text-align: center; padding: 32px 28px; background: #F7F9FC; color: #B0BEC5; font-size: 11px; line-height: 1.7; }
            .footer strong { color: #7A8BA6; }
          </style>
        </head>
        <body>
          <div class="page">
            <!-- Header -->
            <div class="header">
              <div class="logo">VPay</div>
              <div class="tagline">Digital Payment Receipt</div>
              <div class="status-badge">✓ PAYMENT SUCCESSFUL</div>
            </div>

            <!-- Amount -->
            <div class="amount-block">
              <div class="amount-label">Amount Paid</div>
              <div class="amount">₦${totalStr}</div>
            </div>

            <!-- Parties -->
            <section>
              <div class="section-title">Transaction Parties</div>
              <div class="party">
                <div class="avatar">${senderName.charAt(0)}</div>
                <div>
                  <div class="party-label">Sent By</div>
                  <div class="party-name">${senderName}</div>
                  <div class="party-phone">${senderPhone}</div>
                </div>
              </div>
              <div class="party">
                <div class="avatar biller">🏢</div>
                <div>
                  <div class="party-label">Paid To</div>
                  <div class="party-name">${paymentDetails.billerName || '—'}</div>
                  <div class="party-phone">${paymentDetails.itemName || '—'}</div>
                </div>
              </div>
            </section>

            <!-- Details -->
            <section>
              <div class="section-title">Payment Information</div>
              ${paymentDetails.customerId ? `<div class="row"><span class="row-label">Customer ID</span><span class="row-value">${paymentDetails.customerId}</span></div>` : ''}
              <div class="row"><span class="row-label">Amount</span><span class="row-value">₦${totalStr}</span></div>
              <div class="row"><span class="row-label">Status</span><span class="row-value" style="color:#00C48C">✓ Completed</span></div>
              <div class="row"><span class="row-label">Date</span><span class="row-value">${dateStr}</span></div>
              <div class="row"><span class="row-label">Time</span><span class="row-value">${timeStr}</span></div>
            </section>

            <!-- Reference -->
            <section>
              <div class="section-title">Transaction Reference</div>
              <div class="ref-box">
                <div class="ref-label">Reference Number</div>
                <div class="ref-value">${reference || '—'}</div>
              </div>
            </section>

            <!-- Footer -->
            <div class="footer">
              <p>This is an automated receipt from <strong>VPay</strong>.</p>
              <p>No signature is required.</p>
              <p>For support: support@vpay.ng | 0800-VPAY-HELP</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html, base64: false });
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          UTI: '.pdf',
          mimeType: 'application/pdf',
          dialogTitle: 'Share Payment Receipt',
        });
      } else {
        Alert.alert('Not Supported', 'Sharing is not available on this device.');
      }
    } catch (error) {
      console.error('PDF export error:', error);
      Alert.alert('Export Failed', 'Could not generate the PDF receipt. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // ─── Detail Row Component ─────────────────────────────────────────
  const Row = ({ icon, label, value, highlight }) => (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Ionicons name={icon} size={15} color={colors.textLight} style={styles.rowIcon} />
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Text style={[styles.rowValue, highlight && { color: colors.success, fontSize: 14 }]}>{value}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Success Animation Block ── */}
        <View style={styles.successHero}>
          <View style={styles.checkRing}>
            <View style={styles.checkInner}>
              <Ionicons name="checkmark" size={40} color="#fff" />
            </View>
          </View>
          <Text style={styles.successTitle}>Payment Successful!</Text>
          <Text style={styles.successSubtitle}>Your transaction was completed</Text>
          <View style={styles.amountPill}>
            <Text style={styles.amountPillText}>₦{totalStr}</Text>
          </View>
        </View>

        {/* ── Party Card ── */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Transaction Parties</Text>

          {/* Sender */}
          <View style={styles.partyRow}>
            <View style={[styles.partyAvatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.partyAvatarText}>{senderName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.partyInfo}>
              <Text style={styles.partyRole}>Sent by</Text>
              <Text style={styles.partyName}>{senderName}</Text>
              <Text style={styles.partyPhone}>{senderPhone}</Text>
            </View>
          </View>

          <View style={styles.partyDivider}>
            <View style={styles.arrowLine} />
            <View style={styles.arrowBadge}>
              <Ionicons name="arrow-down" size={13} color={colors.primary} />
            </View>
            <View style={styles.arrowLine} />
          </View>

          {/* Receiver */}
          <View style={styles.partyRow}>
            <View style={[styles.partyAvatar, { backgroundColor: '#EBF0FF' }]}>
              <Ionicons name="business" size={20} color={colors.primary} />
            </View>
            <View style={styles.partyInfo}>
              <Text style={styles.partyRole}>Paid to</Text>
              <Text style={styles.partyName}>{paymentDetails.billerName || '—'}</Text>
              <Text style={styles.partyPhone}>{paymentDetails.itemName || '—'}</Text>
            </View>
          </View>
        </View>

        {/* ── Transaction Details Card ── */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Payment Details</Text>
          {paymentDetails.customerId && (
            <Row icon="person-circle-outline" label="Customer ID" value={paymentDetails.customerId} />
          )}
          <Row icon="cash-outline" label="Amount Paid" value={`₦${totalStr}`} />
          <Row icon="calendar-outline" label="Date" value={dateStr} />
          <Row icon="time-outline" label="Time" value={timeStr} />
          {paymentDetails.token && (
            <View style={styles.tokenBox}>
              <Text style={styles.tokenLabel}>METER TOKEN / PIN</Text>
              <Text style={styles.tokenValue}>{paymentDetails.token}</Text>
              {paymentDetails.token2 && <Text style={styles.tokenValue}>{paymentDetails.token2}</Text>}
            </View>
          )}
          <Row icon="checkmark-circle" label="Status" value="✓ Completed" highlight />
        </View>

        {/* ── Reference Number ── */}
        <View style={styles.refCard}>
          <View style={styles.refHeader}>
            <Text style={styles.sectionHeader}>Reference Number</Text>
            {paymentDetails.providerReference && (
              <Text style={styles.providerRef}>Ref: {paymentDetails.providerReference}</Text>
            )}
          </View>
          <View style={styles.refBox}>
            <Text style={styles.refValue}>{reference || '—'}</Text>
            <TouchableOpacity onPress={() => { }} style={{ padding: 4 }}>
              <Ionicons name="copy-outline" size={16} color={colors.textLight} />
            </TouchableOpacity>
          </View>
          <Text style={styles.refNote}>Keep this reference for your records or disputes</Text>
        </View>

        {/* ── Share Options ── */}
        <View style={styles.shareCard}>
          <Text style={styles.sectionHeader}>Share Receipt</Text>
          <View style={styles.shareRow}>
            <TouchableOpacity style={styles.shareBtn} onPress={shareAsText} activeOpacity={0.8}>
              <View style={[styles.shareIcon, { backgroundColor: '#EBF0FF' }]}>
                <Ionicons name="share-social-outline" size={22} color={colors.primary} />
              </View>
              <Text style={styles.shareBtnLabel}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.shareBtn} onPress={shareAsPDF} activeOpacity={0.8} disabled={exporting}>
              <View style={[styles.shareIcon, { backgroundColor: '#FFEBEA' }]}>
                {exporting ? (
                  <ActivityIndicator size="small" color="#E53935" />
                ) : (
                  <Ionicons name="document-text-outline" size={22} color="#E53935" />
                )}
              </View>
              <Text style={styles.shareBtnLabel}>{exporting ? 'Generating…' : 'PDF'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.shareBtn} onPress={onViewStatus} activeOpacity={0.8}>
              <View style={[styles.shareIcon, { backgroundColor: '#E6FDF7' }]}>
                <Ionicons name="refresh-circle-outline" size={22} color="#00C48C" />
              </View>
              <Text style={styles.shareBtnLabel}>Status</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ── Footer CTA ── */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.doneBtn} onPress={onDone} activeOpacity={0.85}>
          <Ionicons name="home-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.doneBtnText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4FF' },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 },

  // Hero
  successHero: {
    alignItems: 'center',
    paddingVertical: 28,
    marginBottom: 16,
  },
  checkRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(0,196,140,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  successTitle: { fontSize: 24, fontWeight: '900', color: colors.text, letterSpacing: -0.5 },
  successSubtitle: { fontSize: 14, color: colors.textLight, marginTop: 4 },
  amountPill: {
    backgroundColor: colors.primary,
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingVertical: 10,
    marginTop: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  amountPillText: { color: '#fff', fontWeight: '900', fontSize: 22, letterSpacing: -0.5 },

  // Cards
  card: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#0D1F3C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 4,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 14,
  },

  // Parties
  partyRow: { flexDirection: 'row', alignItems: 'center' },
  partyAvatar: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  partyAvatarText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  partyInfo: { flex: 1 },
  partyRole: { fontSize: 11, color: colors.textLight, fontWeight: '600' },
  partyName: { fontSize: 15, fontWeight: '800', color: colors.text, marginTop: 2 },
  partyPhone: { fontSize: 12, color: colors.textLight, marginTop: 1 },
  partyDivider: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingLeft: 12 },
  arrowLine: { flex: 1, height: 1, backgroundColor: colors.border },
  arrowBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },

  // Detail rows
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  rowIcon: { marginRight: 8 },
  rowLabel: { fontSize: 13, color: colors.textMed, fontWeight: '500' },
  rowValue: { fontSize: 13, fontWeight: '700', color: colors.text },

  // Reference
  refCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#0D1F3C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 4,
  },
  refBox: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.lightBg,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  refValue: { fontFamily: 'monospace', fontSize: 15, fontWeight: '800', color: colors.primary, letterSpacing: 1 },
  // Tokens
  tokenBox: {
    backgroundColor: '#FFF9E6',
    borderWidth: 1,
    borderColor: '#FFD700',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  tokenLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#856404',
    marginBottom: 6,
    letterSpacing: 1,
  },
  tokenValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#333',
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  refHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  providerRef: {
    fontSize: 10,
    color: colors.textLight,
    fontWeight: '600',
  },
  refNote: { fontSize: 11, color: colors.textLight, textAlign: 'center' },

  // Share
  shareCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#0D1F3C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 4,
  },
  shareRow: { flexDirection: 'row', justifyContent: 'space-around' },
  shareBtn: { alignItems: 'center', gap: 8 },
  shareIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareBtnLabel: { fontSize: 12, fontWeight: '700', color: colors.textMed },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 16,
    paddingBottom: 28,
  },
  doneBtn: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  doneBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
