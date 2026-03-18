import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Alert,
  Linking,
} from 'react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { getApiBase, setApiBase, triggerRun, fetchStatus } from '@/services/api';
import Constants from 'expo-constants';

export default function SettingsScreen() {
  const [apiUrl, setApiUrlState] = useState('');
  const [saved, setSaved] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [runMsg, setRunMsg] = useState('');

  useEffect(() => {
    getApiBase().then(setApiUrlState);
    fetchStatus().then(s => setIsRunning(s.running)).catch(() => {});
  }, []);

  const handleSave = async () => {
    const trimmed = apiUrl.trim().replace(/\/$/, '');
    if (!trimmed.startsWith('http')) {
      Alert.alert('Invalid URL', 'URL must start with https://');
      return;
    }
    await setApiBase(trimmed);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleRunNow = async () => {
    if (isRunning) return;
    try {
      await triggerRun();
      setIsRunning(true);
      setRunMsg('Scraper started — check Stats tab for results.');
      setTimeout(() => {
        setRunMsg('');
        fetchStatus().then(s => setIsRunning(s.running)).catch(() => {});
      }, 12000);
    } catch {
      setRunMsg('Failed to reach server. Check your API URL.');
      setTimeout(() => setRunMsg(''), 4000);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Fitness Buyer Hunter</Text>

      {/* API URL */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Backend URL</Text>
        <Text style={styles.sectionHint}>
          Your Netlify site URL — e.g. https://your-site.netlify.app/.netlify/functions
        </Text>
        <TextInput
          style={styles.input}
          value={apiUrl}
          onChangeText={setApiUrlState}
          placeholder="https://your-site.netlify.app/.netlify/functions"
          placeholderTextColor={Colors.textDim}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="done"
          onSubmitEditing={handleSave}
        />
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>{saved ? '✓ Saved' : 'Save URL'}</Text>
        </TouchableOpacity>
      </View>

      {/* Run scraper */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Manual Scrape</Text>
        <Text style={styles.sectionHint}>
          Trigger a scan right now across Craigslist, Reddit, and DuckDuckGo.
          Auto-scans run every 6 hours.
        </Text>
        {runMsg ? <Text style={styles.runMsg}>{runMsg}</Text> : null}
        <TouchableOpacity
          style={[styles.runBtn, isRunning && styles.runBtnDisabled]}
          onPress={handleRunNow}
          disabled={isRunning}
        >
          {isRunning ? (
            <View style={styles.runBtnInner}>
              <ActivityIndicator size="small" color={Colors.background} />
              <Text style={styles.runBtnText}>Scanning...</Text>
            </View>
          ) : (
            <Text style={styles.runBtnText}>▶ Run Hunt Now</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>App</Text>
          <Text style={styles.aboutValue}>Fitness Buyer Hunter</Text>
        </View>
        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>Version</Text>
          <Text style={styles.aboutValue}>{Constants.expoConfig?.version ?? '1.0.0'}</Text>
        </View>
        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>Market</Text>
          <Text style={styles.aboutValue}>Houston, TX</Text>
        </View>
        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>Sources</Text>
          <Text style={styles.aboutValue}>Craigslist, Reddit, Web</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.md,
    paddingTop: 60,
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#334155',
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionHint: {
    fontSize: FontSize.sm,
    color: Colors.textDim,
    lineHeight: 19,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    padding: Spacing.md,
    color: Colors.text,
    fontSize: FontSize.sm,
    borderWidth: 1,
    borderColor: '#334155',
  },
  saveBtn: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  saveBtnText: {
    color: Colors.text,
    fontWeight: FontWeight.semibold,
    fontSize: FontSize.sm,
  },
  runMsg: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    lineHeight: 19,
  },
  runBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  runBtnDisabled: {
    backgroundColor: Colors.primaryDark,
    opacity: 0.7,
  },
  runBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  runBtnText: {
    color: Colors.background,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.md,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  aboutLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  aboutValue: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontWeight: FontWeight.medium,
  },
});
