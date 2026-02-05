/**
 * Circle Home Modal
 * 
 * Full circle view with members, tasks, and activity.
 * Opens when tapping a circle from Social View.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useCircles } from '../../hooks/supabase/useCircles';
import { Circle, Task, Profile } from '../../lib/supabase';

interface CircleHomeModalProps {
  visible: boolean;
  circleId: string | null;
  onClose: () => void;
  onOpenChallenge?: (challengeId: string) => void;
}

type TabType = 'tasks' | 'activity' | 'challenges';

interface CircleMember extends Profile {
  role?: string;
  isOnline?: boolean;
}

interface CircleActivity {
  id: string;
  user_name: string;
  user_avatar?: string;
  action: string;
  task_title?: string;
  created_at: string;
}

export function CircleHomeModal({ visible, circleId, onClose, onOpenChallenge }: CircleHomeModalProps) {
  const { getCircle, getCircleMembers, getCircleTasks, getCircleActivity } = useCircles();
  
  const [circle, setCircle] = useState<Circle | null>(null);
  const [members, setMembers] = useState<CircleMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activity, setActivity] = useState<CircleActivity[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('tasks');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadCircleData = useCallback(async () => {
    if (!circleId) return;
    
    try {
      const [circleData, membersData, tasksData, activityData] = await Promise.all([
        getCircle(circleId),
        getCircleMembers(circleId),
        getCircleTasks(circleId),
        getCircleActivity(circleId),
      ]);
      
      setCircle(circleData);
      setMembers(membersData || []);
      setTasks(tasksData || []);
      setActivity(activityData || []);
    } catch (error) {
      console.error('Error loading circle data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [circleId, getCircle, getCircleMembers, getCircleTasks, getCircleActivity]);

  useEffect(() => {
    if (visible && circleId) {
      setIsLoading(true);
      loadCircleData();
    }
  }, [visible, circleId, loadCircleData]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadCircleData();
  }, [loadCircleData]);

  const renderMember = ({ item }: { item: CircleMember }) => (
    <View className="items-center mr-3">
      <View className="relative">
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} className="w-12 h-12 rounded-full" />
        ) : (
          <View className="w-12 h-12 rounded-full bg-zinc-800 items-center justify-center">
            <Text className="text-white text-lg font-semibold">
              {item.display_name?.[0]?.toUpperCase() || '?'}
            </Text>
          </View>
        )}
        {item.isOnline && (
          <View className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-black" />
        )}
      </View>
      <Text className="text-zinc-400 text-xs mt-1" numberOfLines={1}>
        {item.display_name?.split(' ')[0] || 'User'}
      </Text>
    </View>
  );

  const renderTask = ({ item }: { item: Task }) => (
    <TouchableOpacity className="flex-row items-center py-3 border-b border-zinc-800">
      <View className={`w-5 h-5 rounded-full border-2 mr-3 ${
        item.status === 'completed' ? 'bg-purple-600 border-purple-600' : 'border-zinc-600'
      }`}>
        {item.status === 'completed' && (
          <Ionicons name="checkmark" size={14} color="#fff" style={{ marginLeft: 1 }} />
        )}
      </View>
      <View className="flex-1">
        <Text className={`text-base ${item.status === 'completed' ? 'text-zinc-500 line-through' : 'text-white'}`}>
          {item.title}
        </Text>
        {item.due_date && (
          <Text className="text-zinc-500 text-xs mt-0.5">
            Due {new Date(item.due_date).toLocaleDateString()}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderActivity = ({ item }: { item: CircleActivity }) => (
    <View className="flex-row items-start py-3 border-b border-zinc-800">
      {item.user_avatar ? (
        <Image source={{ uri: item.user_avatar }} className="w-8 h-8 rounded-full mr-3" />
      ) : (
        <View className="w-8 h-8 rounded-full bg-zinc-800 items-center justify-center mr-3">
          <Text className="text-white text-sm font-semibold">
            {item.user_name[0]?.toUpperCase()}
          </Text>
        </View>
      )}
      <View className="flex-1">
        <Text className="text-white text-sm">
          <Text className="font-semibold">{item.user_name}</Text>
          {' '}{item.action}
          {item.task_title && (
            <Text className="text-purple-400"> "{item.task_title}"</Text>
          )}
        </Text>
        <Text className="text-zinc-500 text-xs mt-1">
          {formatTimeAgo(item.created_at)}
        </Text>
      </View>
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'tasks':
        return (
          <FlatList
            data={tasks}
            renderItem={renderTask}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <View className="py-10 items-center">
                <Ionicons name="checkbox-outline" size={48} color="#52525b" />
                <Text className="text-zinc-500 mt-2">No tasks yet</Text>
              </View>
            }
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#a855f7" />
            }
          />
        );
      case 'activity':
        return (
          <FlatList
            data={activity}
            renderItem={renderActivity}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <View className="py-10 items-center">
                <Ionicons name="pulse-outline" size={48} color="#52525b" />
                <Text className="text-zinc-500 mt-2">No recent activity</Text>
              </View>
            }
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#a855f7" />
            }
          />
        );
      case 'challenges':
        return (
          <View className="py-10 items-center">
            <Ionicons name="trophy-outline" size={48} color="#52525b" />
            <Text className="text-zinc-500 mt-2">No active challenges</Text>
            <TouchableOpacity className="mt-4 px-4 py-2 bg-purple-600 rounded-lg">
              <Text className="text-white font-medium">Start a Challenge</Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-black">
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-zinc-800">
          <TouchableOpacity onPress={onClose} className="p-2 -ml-2">
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          
          <View className="items-center">
            {circle && (
              <>
                <Text className="text-2xl">{circle.emoji || '👥'}</Text>
                <Text className="text-white text-lg font-semibold">{circle.name}</Text>
              </>
            )}
          </View>
          
          <TouchableOpacity className="p-2 -mr-2">
            <Ionicons name="settings-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#a855f7" />
          </View>
        ) : (
          <>
            {/* Members Bar */}
            <View className="px-5 py-4 border-b border-zinc-800">
              <FlatList
                horizontal
                data={members}
                renderItem={renderMember}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                ListEmptyComponent={
                  <Text className="text-zinc-500">No members yet</Text>
                }
              />
              <Text className="text-zinc-500 text-xs mt-2">
                {members.length} member{members.length !== 1 ? 's' : ''}
                {members.filter(m => m.isOnline).length > 0 && 
                  ` • ${members.filter(m => m.isOnline).length} online`
                }
              </Text>
            </View>

            {/* Tab Bar */}
            <View className="flex-row px-5 py-2 border-b border-zinc-800">
              {(['tasks', 'activity', 'challenges'] as TabType[]).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  className={`flex-1 py-2 items-center ${
                    activeTab === tab ? 'border-b-2 border-purple-500' : ''
                  }`}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setActiveTab(tab);
                  }}
                >
                  <Text className={`capitalize ${
                    activeTab === tab ? 'text-white font-semibold' : 'text-zinc-500'
                  }`}>
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Tab Content */}
            <View className="flex-1 px-5">
              {renderTabContent()}
            </View>
          </>
        )}
      </SafeAreaView>
    </Modal>
  );
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}
