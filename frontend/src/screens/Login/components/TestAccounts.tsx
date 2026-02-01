import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { TestAccount } from '../types';
import { styles } from '../styles';

interface TestAccountsProps {
  accounts: TestAccount[];
  onQuickLogin: (email: string) => void;
}

export const TestAccounts: React.FC<TestAccountsProps> = ({
  accounts,
  onQuickLogin,
}) => (
  <View style={styles.testAccounts}>
    <Text style={styles.testTitle}>Quick Test Accounts</Text>
    <View style={styles.testButtons}>
      {accounts.map((account) => (
        <TouchableOpacity
          key={account.email}
          style={styles.testButton}
          onPress={() => onQuickLogin(account.email)}
        >
          <Text style={styles.testButtonText}>{account.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
    <Text style={styles.testHint}>Tap to login or create test account</Text>
  </View>
);
