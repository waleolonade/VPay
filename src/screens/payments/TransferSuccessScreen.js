import React from 'react';
import { View, StyleSheet } from 'react-native';
import PaymentSuccessScreen from '../../components/bills/PaymentSuccessScreen';

export default function TransferSuccessScreen({ route, navigation }) {
    const { reference, amount, paymentDetails } = route.params;

    return (
        <View style={styles.container}>
            <PaymentSuccessScreen
                reference={reference}
                amount={amount}
                paymentDetails={paymentDetails}
                onDone={() => navigation.navigate('Main')}
                onViewStatus={() => navigation.navigate('Transactions')}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
