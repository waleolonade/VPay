import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';

export default function MoreScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>More Services</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll}>
        <Text style={styles.sectionTitle}>Smart Finance</Text>

        <TouchableOpacity style={styles.menuRow} onPress={() => navigation.navigate('AutoSave')}>
          <View style={[styles.iconBox, { backgroundColor: `${colors.primary}15` }]}>
            <Ionicons name="flash" size={22} color={colors.primary} />
          </View>
          <View style={styles.menuText}>
            <Text style={styles.menuTitle}>Smart Auto-Save</Text>
            <Text style={styles.menuDesc}>AI-driven roundups & percentage savings</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuRow} onPress={() => navigation.navigate('Subscriptions')}>
          <View style={[styles.iconBox, { backgroundColor: `${colors.secondary}15` }]}>
            <Ionicons name="receipt" size={22} color={colors.secondary} />
          </View>
          <View style={styles.menuText}>
            <Text style={styles.menuTitle}>Subscription Manager</Text>
            <Text style={styles.menuDesc}>Track & manage recurring payments</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuRow} onPress={() => navigation.navigate('Statement')}>
          <View style={[styles.iconBox, { backgroundColor: `${colors.info}15` }]}>
            <Ionicons name="document-text" size={22} color={colors.info || '#17a2b8'} />
          </View>
          <View style={styles.menuText}>
            <Text style={styles.menuTitle}>Account Statement</Text>
            <Text style={styles.menuDesc}>Generate VFD stamped ledger</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
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
  scroll: { padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 15, marginTop: 10 },
  menuRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
  iconBox: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuText: { flex: 1 },
  menuTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 },
  menuDesc: { fontSize: 13, color: colors.textLight }
});
