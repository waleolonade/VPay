import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BillPaymentConfirmation from '../../components/bills/BillPaymentConfirmation';
import billsService from '../../services/billsPaymentService';

export default function TransferConfirmationScreen({ route, navigation }) {
    const { type, details } = route.params;
    const [isLoading, setIsLoading] = useState(false);

    // Map our details to the format expected by BillPaymentConfirmation
    const paymentDetails = {
        amount: details.amount,
        convenienceFee: details.serviceCharge,
        billerName: details.billerName,
        itemName: type === 'airtime' ? `${details.network?.name} Airtime` : (details.plan?.name || details.plan?.paymentitemname),
        billerCategory: type,
        customerId: details.phoneNumber || details.customerId,
    };

    const handleConfirm = async (pin) => {
        setIsLoading(true);
        try {
            const result = await billsService.payBill({
                billerId: details.billerId,
                billerName: details.billerName,
                billType: type,
                customerNumber: details.phoneNumber || details.customerId,
                amount: details.amount,
                pin: pin,
                paymentItem: details.paymentItem || details.plan?.paymentCode || details.plan?.id || details.billerId,
                productId: details.productId || details.plan?.productId,
                division: details.division || details.plan?.division,
                phoneNumber: details.phoneNumber || details.customerId, // VFD often expects this
                walletType: details.walletType || 'personal',
            });

            if (result) {
                navigation.replace('TransferSuccess', {
                    reference: result.reference,
                    amount: details.amount + details.serviceCharge,
                    paymentDetails: {
                        ...paymentDetails,
                        ...result, // Pass everything: token, kct1, kct2, providerReference, etc.
                        providerReference: result.providerReference || result.reference
                    }
                });
            }
        } catch (err) {
            console.error('Payment error:', err);
            Alert.alert('Payment Failed', err.response?.data?.message || 'Something went wrong. Please check your PIN and balance.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <BillPaymentConfirmation
                paymentDetails={paymentDetails}
                loading={isLoading}
                onConfirm={handleConfirm}
                onCancel={() => navigation.goBack()}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
