import { useTheme } from '@/context/ThemeContext';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const { colors, theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.text, { color: colors.text }]}>
        Home
      </Text>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.accent }]}
        onPress={toggleTheme}
      >
        <Text style={styles.buttonText}>
          Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 24, marginBottom: 20 },
  button: { padding: 16, borderRadius: 12 },
  buttonText: { color: '#FFFFFF', fontSize: 16 },
});