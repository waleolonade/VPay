import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../styles/colors';
import Header from '../../../components/common/Header';

export default function HelpCenterScreen({ navigation }) {

    const SupportCard = ({ icon, title, desc, color, onPress }) => (
        <TouchableOpacity style={styles.supportCard} activeOpacity={0.8} onPress={onPress}>
            <View style={[styles.iconBox, { backgroundColor: `${color}15` }]}>
                <Ionicons name={icon} size={28} color={color} />
            </View>
            <Text style={styles.supportTitle}>{title}</Text>
            <Text style={styles.supportDesc}>{desc}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Header title="Help Center" onBackPress={() => navigation.goBack()} />

            <ScrollView contentContainerStyle={styles.content}>

                <View style={styles.heroBox}>
                    <Text style={styles.heroTitle}>How can we help you today?</Text>
                    <Text style={styles.heroSubtitle}>Choose a contact method below</Text>
                </View>

                <View style={styles.grid}>
                    <SupportCard
                        icon="chatbubbles"
                        title="Live Chat"
                        desc="Typically replies in 5 minutes"
                        color="#2962FF"
                        onPress={() => { }}
                    />
                    <SupportCard
                        icon="call"
                        title="Call Us"
                        desc="Available Mon-Fri, 9am - 5pm"
                        color="#00C853"
                        onPress={() => Linking.openURL('tel:1234567890')}
                    />
                    <SupportCard
                        icon="mail"
                        title="Email Support"
                        desc="support@vpay.com"
                        color="#FF6D00"
                        onPress={() => Linking.openURL('mailto:support@vpay.com')}
                    />
                    <SupportCard
                        icon="book"
                        title="Read FAQ"
                        desc="Browse our articles"
                        color="#AA00FF"
                        onPress={() => { }}
                    />
                </View>

                <TouchableOpacity style={styles.bugBtn}>
                    <Ionicons name="bug" size={20} color={colors.textLight} style={{ marginRight: 8 }} />
                    <Text style={styles.bugText}>Report a Technical Bug</Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    content: { padding: 16 },
    heroBox: { paddingVertical: 30, paddingHorizontal: 20, backgroundColor: '#0A1F44', borderRadius: 20, marginBottom: 24, alignItems: 'center' },
    heroTitle: { fontSize: 22, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 8 },
    heroSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    supportCard: { width: '48%', backgroundColor: '#fff', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    iconBox: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    supportTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 6, textAlign: 'center' },
    supportDesc: { fontSize: 12, color: colors.textLight, textAlign: 'center', lineHeight: 18 },
    bugBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, marginTop: 10, borderRadius: 12, backgroundColor: '#e2e8f0', alignSelf: 'center', paddingHorizontal: 24 },
    bugText: { color: colors.text, fontWeight: '600' }
});
