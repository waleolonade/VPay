import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { colors } from '../../styles/colors';

const { width } = Dimensions.get('window');

export default function ErrorPopup({ visible, title = 'Error', message, onClose, type = 'error' }) {
    const scaleValue = useRef(new Animated.Value(0)).current;
    const opacityValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(scaleValue, {
                    toValue: 1,
                    friction: 6,
                    tension: 40,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityValue, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(scaleValue, {
                    toValue: 0.8,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityValue, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    if (!visible && opacityValue._value === 0) return null;

    const getIcon = () => {
        switch (type) {
            case 'network': return '📡';
            case 'lock': return '🔒';
            case 'warning': return '⚠️';
            default: return '❌';
        }
    };

    const getIconColor = () => {
        switch (type) {
            case 'network': return '#DC2626'; // Red
            case 'lock': return '#D97706';    // Orange/Amber
            case 'warning': return '#D97706';
            default: return colors.danger;
        }
    };

    return (
        <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <Animated.View style={[styles.popupCard, {
                    opacity: opacityValue,
                    transform: [{ scale: scaleValue }],
                }]}>

                    <View style={[styles.iconContainer, { backgroundColor: getIconColor() + '15' }]}>
                        <Text style={styles.icon}>{getIcon()}</Text>
                    </View>

                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>

                    <TouchableOpacity style={styles.button} onPress={onClose} activeOpacity={0.8}>
                        <Text style={styles.buttonText}>Okay</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.45)', // Sleek dark overlay
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    popupCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        width: width - 80,
        maxWidth: 320,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 8,
    },
    iconContainer: {
        width: 52,
        height: 52,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    icon: {
        fontSize: 24,
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.text,
        marginBottom: 8,
        textAlign: 'center',
        letterSpacing: -0.4,
    },
    message: {
        fontSize: 14,
        color: colors.textLight,
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
    },
    button: {
        backgroundColor: colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 14,
        width: '100%',
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '700',
    },
});
