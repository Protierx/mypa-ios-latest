/**
 * MYPA Premium Subscription Screen
 * 
 * Premium paywall with clear value proposition.
 * Features free vs pro comparison.
 * 
 * Pricing:
 * - Free: Basic features
 * - Pro ($6.99/mo): Full AI power, unlimited everything
 * - Family ($12.99/mo): 5 accounts, shared features
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  X,
  Check,
  Crown,
  Zap,
  Brain,
  Users,
  Mic,
  Calendar,
  BarChart3,
  Shield,
  Sparkles,
  ChevronRight,
  Star,
} from 'lucide-react-native';
import { MYPAOrb } from '../../components/MYPAOrb';

const { width, height } = Dimensions.get('window');

type PlanType = 'free' | 'pro' | 'family';

interface SubscriptionScreenProps {
  visible?: boolean;
  onClose: () => void;
  onSubscribe?: (plan: PlanType) => void;
  showFreePlan?: boolean;
}

interface Feature {
  icon: any;
  title: string;
  free: string | boolean;
  pro: string | boolean;
  family: string | boolean;
}

const FEATURES: Feature[] = [
  {
    icon: Brain,
    title: 'Brain Dumps',
    free: '5/day',
    pro: 'Unlimited',
    family: 'Unlimited',
  },
  {
    icon: Mic,
    title: 'Voice Assistant',
    free: '10 min/day',
    pro: 'Unlimited',
    family: 'Unlimited',
  },
  {
    icon: Sparkles,
    title: 'AI Task Scheduling',
    free: false,
    pro: true,
    family: true,
  },
  {
    icon: Calendar,
    title: 'Smart Calendar Sync',
    free: false,
    pro: true,
    family: true,
  },
  {
    icon: Users,
    title: 'Circles (Social)',
    free: '1 circle',
    pro: 'Unlimited',
    family: 'Unlimited',
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    free: false,
    pro: true,
    family: true,
  },
  {
    icon: Shield,
    title: 'Priority Support',
    free: false,
    pro: true,
    family: true,
  },
];

const PLANS: Record<PlanType, {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  gradient: [string, string];
  accent: string;
  badge?: string;
}> = {
  free: {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Get started with MYPA',
    gradient: ['#374151', '#1f2937'],
    accent: '#6b7280',
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: '$6.99',
    period: '/month',
    description: 'Full AI power unlocked',
    gradient: ['#8b5cf6', '#6366f1'],
    accent: '#a78bfa',
    badge: 'POPULAR',
  },
  family: {
    id: 'family',
    name: 'Family',
    price: '$12.99',
    period: '/month',
    description: '5 accounts included',
    gradient: ['#f59e0b', '#d97706'] as [string, string],
    accent: '#fbbf24',
  },
};

export function SubscriptionScreen({ 
  visible = true, 
  onClose, 
  onSubscribe,
  showFreePlan = false 
}: SubscriptionScreenProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('pro');
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSubscribe = () => {
    if (onSubscribe) {
      onSubscribe(selectedPlan);
    }
    // In production, this would trigger the in-app purchase flow
    console.log(`Subscribing to ${selectedPlan} plan`);
    onClose();
  };

  const renderPlanCard = (planKey: PlanType) => {
    const plan = PLANS[planKey];
    const isSelected = selectedPlan === planKey;
    
    return (
      <Pressable
        key={plan.id}
        style={[
          styles.planCard,
          isSelected && styles.planCardSelected,
        ]}
        onPress={() => setSelectedPlan(planKey)}
      >
        {plan.badge && (
          <View style={styles.badgeContainer}>
            <LinearGradient
              colors={['#f59e0b', '#d97706']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.badge}
            >
              <Star size={10} color="#fff" />
              <Text style={styles.badgeText}>{plan.badge}</Text>
            </LinearGradient>
          </View>
        )}
        
        <LinearGradient
          colors={isSelected ? plan.gradient : ['#1f2937', '#1f2937']}
          style={styles.planCardGradient}
        >
          <View style={styles.planHeader}>
            <Text style={[styles.planName, isSelected && { color: '#fff' }]}>
              {plan.name}
            </Text>
            <View style={styles.planPricing}>
              <Text style={[styles.planPrice, isSelected && { color: '#fff' }]}>
                {plan.price}
              </Text>
              <Text style={[styles.planPeriod, isSelected && { color: 'rgba(255,255,255,0.7)' }]}>
                {plan.period}
              </Text>
            </View>
          </View>
          
          <Text style={[styles.planDescription, isSelected && { color: 'rgba(255,255,255,0.8)' }]}>
            {plan.description}
          </Text>
          
          {/* Selection indicator */}
          <View style={[styles.selectIndicator, isSelected && styles.selectIndicatorActive]}>
            {isSelected && <Check size={16} color="#fff" />}
          </View>
        </LinearGradient>
      </Pressable>
    );
  };

  const renderFeatureValue = (value: string | boolean, isPro: boolean = false) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check size={18} color={isPro ? '#10b981' : '#6b7280'} />
      ) : (
        <X size={18} color="#4b5563" />
      );
    }
    return (
      <Text style={[styles.featureValue, isPro && styles.featureValuePro]}>
        {value}
      </Text>
    );
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0f172a', '#1e1b4b']}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <X size={24} color="rgba(255,255,255,0.6)" />
            </Pressable>
          </View>
          
          <ScrollView 
            ref={scrollRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Hero */}
            <Animated.View 
              style={[
                styles.heroSection,
                { 
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }]
                }
              ]}
            >
              <View style={styles.orbContainer}>
                <MYPAOrb size="md" />
                <View style={styles.crownContainer}>
                  <Crown size={20} color="#fbbf24" />
                </View>
              </View>
              
              <Text style={styles.heroTitle}>Unlock Full Power</Text>
              <Text style={styles.heroSubtitle}>
                Get unlimited AI assistance to organize your life
              </Text>
            </Animated.View>
            
            {/* Plan Cards */}
            <View style={styles.plansContainer}>
              {showFreePlan && renderPlanCard('free')}
              {renderPlanCard('pro')}
              {renderPlanCard('family')}
            </View>
            
            {/* Feature Comparison */}
            <View style={styles.featuresSection}>
              <Text style={styles.featuresTitle}>What you get</Text>
              
              <View style={styles.featuresList}>
                {FEATURES.map((feature, index) => {
                  const IconComponent = feature.icon;
                  const currentPlanValue = feature[selectedPlan];
                  const isIncluded = currentPlanValue === true || 
                    (typeof currentPlanValue === 'string' && currentPlanValue !== '5/day' && currentPlanValue !== '10 min/day' && currentPlanValue !== '1 circle');
                  
                  return (
                    <View key={index} style={styles.featureRow}>
                      <View style={styles.featureInfo}>
                        <View style={[
                          styles.featureIcon,
                          isIncluded && styles.featureIconActive
                        ]}>
                          <IconComponent size={18} color={isIncluded ? '#8b5cf6' : '#6b7280'} />
                        </View>
                        <Text style={styles.featureTitle}>{feature.title}</Text>
                      </View>
                      
                      <View style={styles.featureValueContainer}>
                        {renderFeatureValue(currentPlanValue, selectedPlan !== 'free')}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
            
            {/* Testimonial */}
            <View style={styles.testimonialSection}>
              <View style={styles.testimonialStars}>
                {[1,2,3,4,5].map(i => (
                  <Star key={i} size={16} color="#fbbf24" fill="#fbbf24" />
                ))}
              </View>
              <Text style={styles.testimonialText}>
                "MYPA Pro changed how I organize my day. The AI scheduling is like having a personal assistant!"
              </Text>
              <Text style={styles.testimonialAuthor}>— Sarah K., Designer</Text>
            </View>
            
            {/* Money back guarantee */}
            <View style={styles.guaranteeSection}>
              <Shield size={20} color="#10b981" />
              <Text style={styles.guaranteeText}>
                7-day free trial • Cancel anytime
              </Text>
            </View>
          </ScrollView>
          
          {/* CTA Button */}
          <View style={styles.ctaContainer}>
            <Pressable style={styles.ctaButton} onPress={handleSubscribe}>
              <LinearGradient
                colors={selectedPlan === 'free' ? ['#4b5563', '#374151'] : PLANS[selectedPlan].gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaGradient}
              >
                {selectedPlan !== 'free' && <Zap size={20} color="#fff" />}
                <Text style={styles.ctaText}>
                  {selectedPlan === 'free' 
                    ? 'Continue with Free'
                    : `Start Free Trial - ${PLANS[selectedPlan].price}${PLANS[selectedPlan].period}`
                  }
                </Text>
              </LinearGradient>
            </Pressable>
            
            <Text style={styles.ctaDisclaimer}>
              {selectedPlan === 'free' 
                ? 'Upgrade anytime for full features'
                : 'Billed monthly after trial. Cancel anytime.'
              }
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  
  // Hero
  heroSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  orbContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  crownContainer: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'rgba(251,191,36,0.2)',
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 22,
  },
  
  // Plans
  plansContainer: {
    gap: 12,
    marginBottom: 28,
  },
  planCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  planCardSelected: {
    borderColor: 'rgba(139,92,246,0.5)',
  },
  planCardGradient: {
    padding: 16,
    position: 'relative',
  },
  badgeContainer: {
    position: 'absolute',
    top: -1,
    right: 16,
    zIndex: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    gap: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
  },
  planPricing: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
  },
  planPeriod: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginLeft: 2,
  },
  planDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  selectIndicator: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectIndicatorActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  
  // Features
  featuresSection: {
    marginBottom: 24,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  featuresList: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  featureInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureIconActive: {
    backgroundColor: 'rgba(139,92,246,0.15)',
  },
  featureTitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
  },
  featureValueContainer: {
    minWidth: 70,
    alignItems: 'flex-end',
  },
  featureValue: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  featureValuePro: {
    color: '#10b981',
    fontWeight: '600',
  },
  
  // Testimonial
  testimonialSection: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  testimonialStars: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 12,
  },
  testimonialText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 22,
    marginBottom: 8,
  },
  testimonialAuthor: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  
  // Guarantee
  guaranteeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  guaranteeText: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '500',
  },
  
  // CTA
  ctaContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  ctaButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  ctaDisclaimer: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default SubscriptionScreen;
