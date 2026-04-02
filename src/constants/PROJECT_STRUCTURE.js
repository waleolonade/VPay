// Read the created file list for project structure summary
// This file acts as an index documenting the project structure
export const projectStructure = {
  "assets": ["icons", "images", "fonts"],
  "src": {
    "components": {
      "common": ["Button.js", "Input.js", "Header.js", "Loader.js", "Modal.js", "Toast.js"],
      "home": ["BalanceCard.js", "QuickActions.js", "BannerSlider.js", "RecentTransactions.js", "ServiceGrid.js"],
      "wallet": ["WalletCard.js"],
      "loans": ["LoanEligibility.js"]
    },
    "screens": {
      "auth": ["LoginScreen.js", "RegisterScreen.js"],
      "main": ["HomeScreen.js", "TransactionsScreen.js", "WalletScreen.js", "ProfileScreen.js", "MoreScreen.js"],
      "payments": ["TransferScreen.js", "AirtimeScreen.js"],
      "qr-payments": ["QRScannerScreen.js"],
      "loans": ["LoanDashboardScreen.js"],
      "savings": ["SavingsScreen.js"],
      "investments": ["InvestmentScreen.js"],
      "rewards": ["RewardsScreen.js"],
      "support": ["HelpCenterScreen.js"]
    },
    "navigation": ["AppNavigator.js", "AuthNavigator.js", "MainTabNavigator.js"],
    "services": ["api.js", "authService.js", "walletService.js", "transactionService.js", "loanService.js"],
    "utils": ["helpers.js", "validators.js"],
    "hooks": ["useAuth.js"],
    "context": ["AuthContext.js", "WalletContext.js", "ThemeContext.js"],
    "redux": {
      "slices": ["authSlice.js", "walletSlice.js", "transactionSlice.js"],
      "store.js": "Redux store configuration"
    },
    "styles": ["colors.js", "typography.js", "spacing.js", "globalStyles.js"],
    "constants": ["apiEndpoints.js", "validationRules.js"]
  }
};
