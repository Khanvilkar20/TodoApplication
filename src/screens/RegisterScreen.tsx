import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import axios from 'axios';
import type { AuthStackParamList } from '../types/navigation';
import api from '../services/api';

type RegisterScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

type Props = {
  navigation: RegisterScreenNavigationProp;
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function RegisterScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleRegister() {
    setErrorMessage('');

    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      const msg = 'Please fill in all fields.';
      setErrorMessage(msg);
      Alert.alert('Missing Fields', msg);
      return;
    }
    if (!isValidEmail(email.trim())) {
      const msg = 'Please enter a valid email address.';
      setErrorMessage(msg);
      Alert.alert('Invalid Email', msg);
      return;
    }
    if (password.length < 6) {
      const msg = 'Password must be at least 6 characters.';
      setErrorMessage(msg);
      Alert.alert('Weak Password', msg);
      return;
    }
    if (password !== confirmPassword) {
      const msg = 'Passwords do not match.';
      setErrorMessage(msg);
      Alert.alert('Password Mismatch', msg);
      return;
    }

    try {
      setLoading(true);

      await api.post('/api/auth/register', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      Alert.alert(
        'Registration Successful',
        'Your account has been created. Please sign in.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
    } catch (error: unknown) {
      let message = 'Unable to connect to the server. Please check your network connection.';

      if (axios.isAxiosError(error) && error.response?.data?.message) {
        message = error.response.data.message;
      }

      setErrorMessage(message);
      Alert.alert('Registration Failed', message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Sign up to get started</Text>
          </View>

          {errorMessage ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="John Doe"
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (errorMessage) setErrorMessage('');
              }}
              autoCapitalize="words"
              autoCorrect={false}
              editable={!loading}
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errorMessage) setErrorMessage('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="At least 6 characters"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errorMessage) setErrorMessage('');
              }}
              secureTextEntry
              editable={!loading}
            />

            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Re-enter your password"
              placeholderTextColor="#9CA3AF"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (errorMessage) setErrorMessage('');
              }}
              secureTextEntry
              editable={!loading}
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.buttonText}>Register</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={loading}>
              <Text style={styles.link}>Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    marginBottom: 28,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#F87171',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 14,
  },
  form: {
    gap: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  button: {
    backgroundColor: '#4F46E5',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  link: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '600',
  },
});
