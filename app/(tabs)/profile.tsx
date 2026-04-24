import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user, isAuthenticating, isLoading, signIn, signOut, error } = useAuth();

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['top', 'left', 'right']}
      >
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
        <TouchableOpacity onPress={() => router.push('/settings')}>
          <Ionicons name="settings" size={28} color={colors.text} />
        </TouchableOpacity>
      </View>

      {user ? (
        // Signed in: Show user profile
        <View style={styles.profileContainer}>
          {user.photoURL ? (
            <Image
              source={{ uri: user.photoURL }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.card }]}>
              <Ionicons name="person" size={48} color={colors.accent} />
            </View>
          )}

          <Text style={[styles.displayName, { color: colors.text }]}>
            {user.displayName || 'User'}
          </Text>

          {user.email && (
            <Text style={[styles.email, { color: colors.subtext }]}>
              {user.email}
            </Text>
          )}

          <TouchableOpacity
            style={[styles.signOutButton, { backgroundColor: colors.accent }]}
            onPress={signOut}
            disabled={isAuthenticating}
          >
            {isAuthenticating ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={[styles.buttonText, { color: colors.background }]}>
                Sign Out
              </Text>
            )}
          </TouchableOpacity>

          {error && (
            <Text style={[styles.errorText, { color: '#ef4444' }]}>
              {error}
            </Text>
          )}
        </View>
      ) : (
        // Guest mode: Show sign in button
        <View style={styles.guestContainer}>
          <View style={[styles.guestIconContainer, { backgroundColor: colors.card }]}>
            <Ionicons name="person-circle" size={80} color={colors.accent} />
          </View>

          <Text style={[styles.guestTitle, { color: colors.text }]}>
            Welcome to Your Todo App
          </Text>

          <Text style={[styles.guestSubtitle, { color: colors.subtext }]}>
            Sign in with your Google account to sync tasks across devices and access premium features.
          </Text>

          <TouchableOpacity
            style={[styles.googleButton, { backgroundColor: colors.accent }]}
            onPress={signIn}
            disabled={isAuthenticating}
          >
            {isAuthenticating ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <>
                <Ionicons name="logo-google" size={20} color={colors.background} />
                <Text style={[styles.buttonText, { color: colors.background, marginLeft: 8 }]}>
                  Continue with Google
                </Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={[styles.guestInfo, { color: colors.subtext }]}>
            You&apos;re using guest mode. Your tasks are saved locally on this device.
          </Text>

          {error && (
            <Text style={[styles.errorText, { color: '#ef4444' }]}>
              {error}
            </Text>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingVertical: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: { fontSize: 28, fontWeight: '600' },

  // Signed in styles
  profileContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  displayName: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    marginBottom: 24,
  },

  // Guest mode styles
  guestContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestIconContainer: {
    marginBottom: 24,
    borderRadius: 12,
    padding: 16,
  },
  guestTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  guestSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 32,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  guestInfo: {
    fontSize: 12,
    marginTop: 16,
    textAlign: 'center',
    paddingHorizontal: 8,
  },

  // Button styles
  googleButton: {
    flexDirection: 'row',
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  signOutButton: {
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    marginTop: 24,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Error styles
  errorText: {
    fontSize: 12,
    marginTop: 12,
    textAlign: 'center',
  },
});