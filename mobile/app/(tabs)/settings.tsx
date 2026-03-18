import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { triggerRun, fetchStatus, fetchZip, saveZip } from '@/services/api';
import Constants from 'expo-constants';

export default function SettingsScreen() {
  const [isRunning, setIsRunning] = useState(false);
  const [runMsg, setRunMsg] = useState('');
  const [zip, setZip] = useState('');
  const [zipSaved, setZipSaved] = useState(false);
  const [zipError, setZipError] = useState('');

  useEffect(() => {
    fetchStatus().then(s => setIsRunning(s.running)).catch(() => {});
    fetchZip().then(z => setZip(z)).catch(() => {});
  }, []);

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
      setRunMsg('Failed to reach server.');
      setTimeout(() => setRunMsg(''), 4000);
    }
  };

  const handleSaveZip = async () => {
    if (!zip || zip.trim().length < 2) {
      setZipError('Enter a zip code or city name.');
      return;
    }
    setZipError('');
    try {
      await saveZip(zip);
      setZipSaved(true);
      setTimeout(() => setZipSaved(false), 3000);
    } catch {
      setZipError('Failed to save. Try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Fitness Buyer Hunter</Text>

        {/* Zip Code */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Search Location</Text>
          <Text style={styles.sectionHint}>
            Enter a zip code or city & state to find buyers near you. Used by all scans including auto-scans.
          </Text>
          <View style={styles.zipRow}>
            <TextInput
              style={styles.zipInput}
              value={zip}
              onChangeText={setZip}
              placeholder="e.g. 77001 or Houston, TX"
              placeholderTextColor={Colors.textMuted}
              keyboardType="default"
              maxLength={50}
              returnKeyType="done"
              onSubmitEditing={handleSaveZip}
            />
            <TouchableOpacity style={styles.zipBtn} onPress={handleSaveZip}>
              <Text style={styles.zipBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
          {zipSaved ? <Text style={styles.successMsg}>Zip saved! Next scan will use this location.</Text> : null}
          {zipError ? <Text style={styles.errorMsg}>{zipError}</Text> : null}
        </View>

        {/* Manual scrape */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Manual Hunt</Text>
          <Text style={styles.sectionHint}>
            Trigger a scan right now across Reddit using your zip code location.
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
            <Text style={styles.aboutLabel}>Sources</Text>
            <Text style={styles.aboutValue}>Reddit</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  zipRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  zipInput: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    color: Colors.text,
    fontSize: FontSize.md,
  },
  zipBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
  },
  zipBtnText: {
    color: Colors.background,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.sm,
  },
  successMsg: {
    fontSize: FontSize.sm,
    color: '#22C55E',
    lineHeight: 19,
  },
  errorMsg: {
    fontSize: FontSize.sm,
    color: '#EF4444',
    lineHeight: 19,
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
