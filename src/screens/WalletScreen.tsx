import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { colors } from '../styles/colors';

interface Transaction {
  id: string;
  type: 'earned' | 'spent' | 'received';
  title: string;
  description: string;
  amount: string;
  date: string;
  iconName: string;
  iconColor: string;
}

const transactions: Transaction[] = [
  { id: '1', type: 'earned', title: 'Challenge Completed', description: '7-day streak bonus', amount: '+$15.00', date: 'Today', iconName: 'trophy', iconColor: '#F59E0B' },
  { id: '2', type: 'spent', title: 'Premium Feature', description: 'Advanced analytics', amount: '-$4.99', date: 'Yesterday', iconName: 'stats-chart', iconColor: '#8B5CF6' },
  { id: '3', type: 'received', title: 'Friend Referral', description: 'Sarah joined via your link', amount: '+$10.00', date: 'Jan 21', iconName: 'gift', iconColor: '#EC4899' },
  { id: '4', type: 'earned', title: 'Daily Goal', description: 'Completed all tasks', amount: '+$2.00', date: 'Jan 20', iconName: 'checkmark-circle', iconColor: '#10B981' },
  { id: '5', type: 'earned', title: 'Workout Bonus', description: '30 min cardio session', amount: '+$3.00', date: 'Jan 19', iconName: 'fitness', iconColor: '#F43F5E' },
  { id: '6', type: 'spent', title: 'Reward Redemption', description: 'Coffee voucher', amount: '-$5.00', date: 'Jan 18', iconName: 'cafe', iconColor: '#92400E' },
];

interface Milestone {
  id: string;
  title: string;
  current: number;
  target: number;
  reward: string;
  iconName: string;
  iconColor: string;
}

const milestones: Milestone[] = [
  { id: '1', title: '30-Day Streak', current: 7, target: 30, reward: '$50', iconName: 'fire', iconColor: '#F97316' },
  { id: '2', title: 'Challenge Champion', current: 8, target: 10, reward: '$25', iconName: 'trophy', iconColor: '#F59E0B' },
];

export function WalletScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color="#475569" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Wallet</Text>
          <TouchableOpacity style={styles.historyButton}>
            <Ionicons name="time-outline" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <View style={styles.balanceBadge}>
              <Ionicons name="trending-up" size={14} color="#10B981" />
              <Text style={styles.balanceBadgeText}>+23%</Text>
            </View>
          </View>
          <Text style={styles.balanceAmount}>$250.00</Text>
          <Text style={styles.balanceSubtext}>This month: +$127.00 earned</Text>
          
          <View style={styles.balanceActions}>
            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.actionText}>Send</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="arrow-down" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.actionText}>Receive</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="gift" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.actionText}>Redeem</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Time Saved Stats */}
        <View style={styles.timeCard}>
          <View style={styles.timeHeader}>
            <MaterialCommunityIcons name="clock-check" size={22} color="#8B5CF6" />
            <Text style={styles.timeTitle}>Time Saved This Week</Text>
          </View>
          <View style={styles.timeContent}>
            <View style={styles.timeStat}>
              <Text style={styles.timeValue}>4.5</Text>
              <Text style={styles.timeUnit}>hours</Text>
            </View>
            <View style={styles.timeDivider} />
            <View style={styles.timeDetails}>
              <View style={styles.timeDetail}>
                <Ionicons name="flash" size={14} color="#F59E0B" />
                <Text style={styles.timeDetailText}>23 tasks automated</Text>
              </View>
              <View style={styles.timeDetail}>
                <Ionicons name="trending-up" size={14} color="#10B981" />
                <Text style={styles.timeDetailText}>15% more than last week</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Earning Milestones */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Earning Milestones</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        
        {milestones.map((milestone) => (
          <View key={milestone.id} style={styles.milestoneCard}>
            <View style={[styles.milestoneIcon, { backgroundColor: milestone.iconColor + '20' }]}>
              {milestone.iconName === 'fire' ? (
                <MaterialCommunityIcons name="fire" size={22} color={milestone.iconColor} />
              ) : (
                <Ionicons name={milestone.iconName as any} size={22} color={milestone.iconColor} />
              )}
            </View>
            <View style={styles.milestoneContent}>
              <View style={styles.milestoneHeader}>
                <Text style={styles.milestoneTitle}>{milestone.title}</Text>
                <Text style={styles.milestoneReward}>{milestone.reward}</Text>
              </View>
              <View style={styles.milestoneProgress}>
                <View style={styles.milestoneProgressBar}>
                  <View style={[styles.milestoneProgressFill, { width: `${(milestone.current / milestone.target) * 100}%`, backgroundColor: milestone.iconColor }]} />
                </View>
                <Text style={styles.milestoneProgressText}>{milestone.current}/{milestone.target}</Text>
              </View>
            </View>
          </View>
        ))}

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIconBg, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="trending-up" size={18} color="#10B981" />
            </View>
            <Text style={styles.statValue}>$127.00</Text>
            <Text style={styles.statLabel}>Earned this month</Text>
            <View style={styles.statTrendBadge}>
              <Ionicons name="arrow-up" size={10} color="#10B981" />
              <Text style={styles.statTrendText}>23%</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconBg, { backgroundColor: '#FEF2F2' }]}>
              <Ionicons name="trending-down" size={18} color="#F43F5E" />
            </View>
            <Text style={styles.statValue}>$14.99</Text>
            <Text style={styles.statLabel}>Spent this month</Text>
            <View style={[styles.statTrendBadge, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="arrow-down" size={10} color="#10B981" />
              <Text style={[styles.statTrendText, { color: '#10B981' }]}>12%</Text>
            </View>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {transactions.map((transaction) => (
          <View key={transaction.id} style={styles.transactionItem}>
            <View style={[styles.transactionIcon, { backgroundColor: transaction.iconColor + '15' }]}>
              <Ionicons name={transaction.iconName as any} size={20} color={transaction.iconColor} />
            </View>
            <View style={styles.transactionContent}>
              <Text style={styles.transactionTitle}>{transaction.title}</Text>
              <Text style={styles.transactionDescription}>{transaction.description}</Text>
            </View>
            <View style={styles.transactionRight}>
              <Text style={[styles.transactionAmount, transaction.type === 'spent' ? styles.amountSpent : styles.amountEarned]}>
                {transaction.amount}
              </Text>
              <Text style={styles.transactionDate}>{transaction.date}</Text>
            </View>
          </View>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollView: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#0F172A' },
  historyButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  balanceCard: { backgroundColor: '#8B5CF6', marginHorizontal: 20, borderRadius: 24, padding: 24, marginBottom: 16 },
  balanceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  balanceLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  balanceBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  balanceBadgeText: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },
  balanceAmount: { fontSize: 44, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  balanceSubtext: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 20 },
  balanceActions: { flexDirection: 'row', justifyContent: 'space-around' },
  actionButton: { alignItems: 'center' },
  actionIconContainer: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  actionText: { fontSize: 12, color: '#FFFFFF', fontWeight: '500' },
  timeCard: { backgroundColor: '#FFFFFF', marginHorizontal: 20, borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  timeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  timeTitle: { fontSize: 15, fontWeight: '600', color: '#0F172A' },
  timeContent: { flexDirection: 'row', alignItems: 'center' },
  timeStat: { alignItems: 'center', paddingRight: 16 },
  timeValue: { fontSize: 32, fontWeight: '700', color: '#8B5CF6' },
  timeUnit: { fontSize: 13, color: '#64748B' },
  timeDivider: { width: 1, height: 40, backgroundColor: '#F1F5F9', marginHorizontal: 16 },
  timeDetails: { flex: 1, gap: 6 },
  timeDetail: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeDetailText: { fontSize: 13, color: '#64748B' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12, marginTop: 8 },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: '#0F172A' },
  seeAll: { fontSize: 14, fontWeight: '500', color: '#8B5CF6' },
  milestoneCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', marginHorizontal: 20, borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  milestoneIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  milestoneContent: { flex: 1 },
  milestoneHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  milestoneTitle: { fontSize: 15, fontWeight: '600', color: '#0F172A' },
  milestoneReward: { fontSize: 14, fontWeight: '600', color: '#10B981' },
  milestoneProgress: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  milestoneProgressBar: { flex: 1, height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
  milestoneProgressFill: { height: '100%', borderRadius: 3 },
  milestoneProgressText: { fontSize: 12, fontWeight: '500', color: '#64748B', width: 40 },
  statsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginBottom: 16, marginTop: 8 },
  statCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  statIconBg: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statValue: { fontSize: 20, fontWeight: '700', color: '#0F172A', marginBottom: 2 },
  statLabel: { fontSize: 12, color: '#64748B', marginBottom: 8 },
  statTrendBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: '#ECFDF5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start' },
  statTrendText: { fontSize: 11, fontWeight: '600', color: '#10B981' },
  transactionItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', marginHorizontal: 20, padding: 14, borderRadius: 14, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  transactionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  transactionContent: { flex: 1 },
  transactionTitle: { fontSize: 15, fontWeight: '600', color: '#0F172A', marginBottom: 2 },
  transactionDescription: { fontSize: 12, color: '#64748B' },
  transactionRight: { alignItems: 'flex-end' },
  transactionAmount: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  amountEarned: { color: '#10B981' },
  amountSpent: { color: '#F43F5E' },
  transactionDate: { fontSize: 11, color: '#94A3B8' },
});
