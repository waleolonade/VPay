import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Text, Dimensions } from 'react-native';
import { colors } from '../styles/colors';

const { width } = Dimensions.get('window');

/**
 * LoadingIndicator Component
 * Features dual rolling rings with branding colors and a pulsing logo.
 * Smart and professional design with no background.
 */
export default function LoadingIndicator({ text, fullScreen }) {
    const scaleValue = useRef(new Animated.Value(0.85)).current;
    const opacityValue = useRef(new Animated.Value(0.7)).current;
    const rotateValue = useRef(new Animated.Value(0)).current;
    const rotateReverseValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Pulse animation (zoom in and out + opacity fade)
        const pulse = Animated.loop(
            Animated.parallel([
                Animated.sequence([
                    Animated.timing(scaleValue, {
                        toValue: 1.15,
                        duration: 800,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(scaleValue, {
                        toValue: 0.85,
                        duration: 800,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ]),
                Animated.sequence([
                    Animated.timing(opacityValue, {
                        toValue: 1,
                        duration: 800,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(opacityValue, {
                        toValue: 0.7,
                        duration: 800,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ]),
            ])
        );

        // Rotation animations
        const rotate = Animated.loop(
            Animated.timing(rotateValue, {
                toValue: 1,
                duration: 2000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );

        const rotateReverse = Animated.loop(
            Animated.timing(rotateReverseValue, {
                toValue: 1,
                duration: 3000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );

        Animated.parallel([pulse, rotate, rotateReverse]).start();

        return () => {
            pulse.stop();
            rotate.stop();
            rotateReverse.stop();
        };
    }, []);

    const rotation = rotateValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const rotationReverse = rotateReverseValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['360deg', '0deg'],
    });

    const containerStyles = [
        styles.container,
        fullScreen && styles.fullScreenContainer
    ];

    return (
        <View style={containerStyles}>
            <View style={styles.animationContainer}>
                {/* Outer Rolling Ring (Primary Blue) */}
                <Animated.View 
                    style={[
                        styles.ring, 
                        styles.outerRing, 
                        { transform: [{ rotate: rotation }] }
                    ]} 
                />
                
                {/* Inner Rolling Ring (Success Green) */}
                <Animated.View 
                    style={[
                        styles.ring, 
                        styles.innerRing, 
                        { transform: [{ rotate: rotationReverse }] }
                    ]} 
                />

                {/* Pulsing Logo */}
                <Animated.Image
                    source={require('../../assets/loading.png')}
                    style={[
                        styles.logo,
                        {
                            transform: [{ scale: scaleValue }],
                            opacity: opacityValue
                        }
                    ]}
                    resizeMode="contain"
                />
            </View>
            
            {text && <Text style={styles.loadingText}>{text}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    fullScreenContainer: {
        flex: 1,
        backgroundColor: 'rgba(13, 31, 60, 0.7)', // Using a dark dimmed color for professional look
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        zIndex: 9999,
    },
    animationContainer: {
        width: 100,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    ring: {
        position: 'absolute',
        borderRadius: 100,
        borderWidth: 3,
        borderColor: 'transparent',
    },
    outerRing: {
        width: 100,
        height: 100,
        borderTopColor: colors.primary,
        borderBottomColor: colors.primary,
    },
    innerRing: {
        width: 75,
        height: 75,
        borderLeftColor: colors.success,
        borderRightColor: colors.success,
    },
    logo: {
        width: 45,
        height: 45,
    },
    loadingText: {
        marginTop: 24,
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF', // White text for better visibility on dark overlay
        textAlign: 'center',
        letterSpacing: 0.5,
    },
});
