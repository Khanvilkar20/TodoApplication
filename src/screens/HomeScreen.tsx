import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

export default function HomeScreen() {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Welcome!</Text>
        <Text style={styles.subtitle}>{user?.name ? `${user.name}` : 'User'}</Text>
        <Text style={styles.email}>{user?.email ?? ''}</Text>

        <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.8}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4F46E5',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 32,
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
