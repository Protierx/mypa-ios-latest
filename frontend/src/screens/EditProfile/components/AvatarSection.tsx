import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';

export const AvatarSection: React.FC = () => {
  return (
    <View style={styles.avatarSection}>
      <View style={styles.avatarContainer}>
        <Image
          source={require('../../../../assets/mypa-orb.png')}
          style={styles.avatar}
          resizeMode="cover"
        />
        <TouchableOpacity style={styles.cameraButton}>
          <Ionicons name="camera" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity>
        <Text style={styles.changePhotoText}>Change Photo</Text>
      </TouchableOpacity>
    </View>
  );
};
