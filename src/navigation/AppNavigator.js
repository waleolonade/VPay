import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';
import { useAuth } from '../context/AuthContext';
import TransferScreen from '../screens/payments/TransferScreen';
import QRGeneratorScreen from '../screens/qr-payments/QRGeneratorScreen';
import QRScannerScreen from '../screens/qr-payments/QRScannerScreen';
import MoreScreen from '../screens/main/MoreScreen';
import BillsScreen from '../screens/payments/BillsScreen';
import TransactionsScreen from '../screens/main/TransactionsScreen';
import WalletScreen from '../screens/main/WalletScreen';
import TransactionDetailScreen from '../screens/main/TransactionDetailScreen';
import BankTransferScreen from '../screens/payments/BankTransferScreen';
import VPayToVPayScreen from '../screens/payments/VPayToVPayScreen';
import AirtimeScreen from '../screens/payments/AirtimeScreen';
import DataScreen from '../screens/payments/DataScreen';
import AutoSaveScreen from '../screens/main/AutoSaveScreen';
import SubscriptionsScreen from '../screens/main/SubscriptionsScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';
import TransferConfirmationScreen from '../screens/payments/TransferConfirmationScreen';
import TransferSuccessScreen from '../screens/payments/TransferSuccessScreen';
import CableTVScreen from '../screens/payments/CableTVScreen';
import ElectricityScreen from '../screens/payments/ElectricityScreen';
import BettingScreen from '../screens/payments/BettingScreen';
import InternetScreen from '../screens/payments/InternetScreen';
import LoanDashboardScreen from '../screens/loans/LoanDashboardScreen';
import ApplyLoanScreen from '../screens/loans/ApplyLoanScreen';
import SavingsScreen from '../screens/savings/SavingsScreen';
import CreateSavingsPlanScreen from '../screens/savings/CreateSavingsPlanScreen';
import SavingsDetailScreen from '../screens/savings/SavingsDetailScreen';
import InvestmentScreen from '../screens/investments/InvestmentScreen';
import StatementScreen from '../screens/main/StatementScreen';
import VirtualAccountFundScreen from '../screens/main/VirtualAccountFundScreen';
import BusinessRequestScreen from '../screens/business/BusinessRequestScreen';
import BusinessQRScannerScreen from '../screens/business/BusinessQRScannerScreen';
import BusinessDashboardScreen from '../screens/business/BusinessDashboardScreen';
import StaffManagementScreen from '../screens/business/StaffManagementScreen';
import BusinessInsightsScreen from '../screens/business/BusinessInsightsScreen';
import TransactionReceiptScreen from '../screens/main/TransactionReceiptScreen';
import InvoicesScreen from '../screens/business/InvoicesScreen';
import CreateInvoiceScreen from '../screens/business/CreateInvoiceScreen';

// Profile & KYC
import AccountDetailsScreen from '../screens/main/profile/AccountDetailsScreen';
import BvnVerificationScreen from '../screens/main/profile/BvnVerificationScreen';
import NinVerificationScreen from '../screens/main/profile/NinVerificationScreen';
import SecurityScreen from '../screens/main/profile/SecurityScreen';
import CardsScreen from '../screens/main/profile/CardsScreen';
import SettingsScreen from '../screens/main/profile/SettingsScreen';
import HelpCenterScreen from '../screens/main/profile/HelpCenterScreen';
import TransactionPinScreen from '../screens/main/profile/TransactionPinScreen';
import LinkBankAccountScreen from '../screens/main/profile/LinkBankAccountScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {!user ? (
          <Stack.Screen
            name="Auth"
            component={AuthNavigator}
          />
        ) : (
          <>
            <Stack.Screen
              name="Main"
              component={MainTabNavigator}
            />
            {/* Direct navigation screens triggered from Home */}
            <Stack.Screen name="SendMoney" component={TransferScreen} />
            <Stack.Screen name="RequestMoney" component={QRGeneratorScreen} />
            <Stack.Screen name="QRScanner" component={QRScannerScreen} />
            <Stack.Screen name="BusinessQRScanner" component={BusinessQRScannerScreen} />
            <Stack.Screen name="MoreServices" component={MoreScreen} />
            <Stack.Screen name="Bills" component={BillsScreen} />
            <Stack.Screen name="Transactions" component={TransactionsScreen} />
            <Stack.Screen name="Wallet" component={WalletScreen} />
            <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
            <Stack.Screen name="BankTransfer" component={BankTransferScreen} />
            <Stack.Screen name="VPayToVPay" component={VPayToVPayScreen} />
            <Stack.Screen name="Airtime" component={AirtimeScreen} />
            <Stack.Screen name="Data" component={DataScreen} />
            <Stack.Screen name="TransferConfirmation" component={TransferConfirmationScreen} />
            <Stack.Screen name="TransferSuccess" component={TransferSuccessScreen} />
            <Stack.Screen name="CableTV" component={CableTVScreen} />
            <Stack.Screen name="Electricity" component={ElectricityScreen} />
            <Stack.Screen name="Betting" component={BettingScreen} />
            <Stack.Screen name="Internet" component={InternetScreen} />
            <Stack.Screen name="AutoSave" component={AutoSaveScreen} />
            <Stack.Screen name="Subscriptions" component={SubscriptionsScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="Loans" component={LoanDashboardScreen} />
            <Stack.Screen name="ApplyLoan" component={ApplyLoanScreen} />
            <Stack.Screen name="Savings" component={SavingsScreen} />
            <Stack.Screen name="CreateSavingsPlan" component={CreateSavingsPlanScreen} options={{ headerShown: false }} />
            <Stack.Screen name="SavingsDetail" component={SavingsDetailScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Invoices" component={InvoicesScreen} options={{ headerShown: false }} />
            <Stack.Screen name="CreateInvoice" component={CreateInvoiceScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Investments" component={InvestmentScreen} />
            <Stack.Screen name="Statement" component={StatementScreen} />
            <Stack.Screen name="VirtualAccountFund" component={VirtualAccountFundScreen} />

            {/* Profile & KYC */}
            <Stack.Screen name="AccountDetails" component={AccountDetailsScreen} />
            <Stack.Screen name="Security" component={SecurityScreen} />
            <Stack.Screen name="Cards" component={CardsScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="HelpCenter" component={HelpCenterScreen} />
            <Stack.Screen name="TransactionPin" component={TransactionPinScreen} />
            <Stack.Screen name="LinkBankAccount" component={LinkBankAccountScreen} />

            <Stack.Screen name="BvnVerification" component={BvnVerificationScreen} />
            <Stack.Screen name="NinVerification" component={NinVerificationScreen} />
            <Stack.Screen name="BusinessRequest" component={BusinessRequestScreen} options={{ headerShown: false }} />
            <Stack.Screen name="BusinessDashboard" component={BusinessDashboardScreen} options={{ headerShown: false }} />
            <Stack.Screen name="StaffManagement" component={StaffManagementScreen} options={{ headerShown: false }} />
            <Stack.Screen name="BusinessInsights" component={BusinessInsightsScreen} options={{ headerShown: false }} />
            <Stack.Screen name="TransactionReceipt" component={TransactionReceiptScreen} options={{ headerShown: false }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
