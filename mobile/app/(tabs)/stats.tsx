import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Colors, Platform, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { fetchStats } from '@/services/api';
import type { Stats } from '@/constants/types';

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  const hr  = Math.floor(diff / 3600000);
  const day = Math.floor(diff / 86400000);
  if (min < 60) return `${min}m ago`;
  if (hr < 24)  return `${hr}h ago`;
  return `${day}d ago`;
}

export default function StatsScreen() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    try {
      const data = await fetchStats();
      setStats(data);
    } catch (e) {
      console.error('Stats error:', e);
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Could not load stats. Check your API URL in Settings.</Text>
      </View>
    );
  }

  const lastRunTime = stats.lastRun
    ? new Date(stats.lastRun.ran_at).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : 'Never';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(true); }}
          tintColor={Colors.primary}
        />
      }
    >
      <Text style={styles.title}>Stats</Text>
      <Text style={styles.subtitle}>Fitness Buyer Hunter · Houston, TX</Text>

      {/* Big numbers */}
      <View style={styles.row}>
        <View style={[styles.bigCard, { flex: 1 }]}>
          <Text style={styles.bigNumber}>{stats.total.toLocaleString()}</Text>
          <Text style={styles.bigLabel}>Total Leads</Text>
        </View>
        <View style={[styles.bigCard, styles.highlight, { flex: 1 }]}>
          <Text style={[styles.bigNumber, { color: Colors.primary }]}>{stats.newToday}</Text>
          <Text style={[styles.bigLabel, { color: Colors.primary }]}>New Today</Text>
        </View>
      </View>

      {/* By platform */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>By Platform</Text>
        {stats.byPlatform.length === 0 ? (
          <Text style={styles.noneText}>No data yet</Text>
        ) : (
          stats.byPlatform.map((p) => {
            const cfg = Platform[p.platform as keyof typeof Platform];
            const pct = stats.total > 0 ? (p.count / stats.total) * 100 : 0;
            return (
              <View key={p.platform} style={styles.platformRow}>
                <View style={styles.platformLabelRow}>
                  <Text style={[styles.platformName, { color: cfg?.color || Colors.textMuted }]}>
                    {p.platform}
                  </Text>
                  <Text style={styles.platformCount}>{p.count}</Text>
                </View>
                <View style={styles.barBg}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${pct}%` as any, backgroundColor: cfg?.color || Colors.textDim },
                    ]}
                  />
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Last scan */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Last Scan</Text>
        <Text style={styles.lastRunTime}>{lastRunTime}</Text>
        {stats.lastRun && (
          <>
            <Text style={styles.lastRunSub}>
              +{stats.lastRun.found_count} new leads found
            </Text>
            {stats.lastRun.error_msg && (
              <Text style={styles.errorMsg}>⚠ {stats.lastRun.error_msg}</Text>
            )}
          </>
        )}
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
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  center: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
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
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  bigCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  highlight: {
    borderColor: Colors.primary,
    backgroundColor: '#1C1208',
  },
  bigNumber: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  bigLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#334155',
    gap: Spacing.sm,
  },
  cardTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  platformRow: {
    gap: 6,
  },
  platformLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  platformName: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  platformCount: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  barBg: {
    height: 6,
    backgroundColor: '#1E293B',
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: Radius.full,
    minWidth: 4,
  },
  noneText: {
    fontSize: FontSize.sm,
    color: Colors.textDim,
  },
  lastRunTime: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  lastRunSub: {
    fontSize: FontSize.sm,
    color: Colors.success,
  },
  errorMsg: {
    fontSize: FontSize.sm,
    color: Colors.danger,
  },
  errorText: {
    color: Colors.textMuted,
    textAlign: 'center',
    fontSize: FontSize.sm,
    lineHeight: 22,
  },
});
