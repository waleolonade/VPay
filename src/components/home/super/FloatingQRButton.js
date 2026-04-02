import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '../../../styles/colors';

export default function FloatingQRButton({ onScanPress }) {
    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.scanBtn}
                activeOpacity={0.82}
                onPress={onScanPress}
            >
                <View style={styles.innerRing}>
                    <Ionicons name="qr-code-outline" size={26} color="#fff" />
                </View>
            </TouchableOpacity>
            <Text style={styles.label}>Scan QR</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 18,
        alignSelf: 'center',
        alignItems: 'center',
        zIndex: 999,
    },
    scanBtn: {
        backgroundColor: colors.primary,
        width: 62,
        height: 62,
        borderRadius: 31,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.45,
        shadowRadius: 16,
        elevation: 12,
        borderWidth: 3,
        borderColor: '#fff',
    },
    innerRing: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.12)',
    },
    label: {
        marginTop: 5,
        fontSize: 11,
        fontWeight: '700',
        color: colors.textMed,
        backgroundColor: 'rgba(255,255,255,0.92)',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 10,
        overflow: 'hidden',
        letterSpacing: 0.3,
    },
});
