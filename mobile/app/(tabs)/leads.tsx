import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { fetchListings, fetchStatus, triggerRun } from '@/services/api';
import ListingCard from '@/components/ListingCard';
import type { Listing } from '@/constants/types';

export default function LeadsScreen() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [runMsg, setRunMsg] = useState('');
  const [search, setSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    try {
      const [data, status] = await Promise.all([
        fetchListings(undefined, search),
        fetchStatus(),
      ]);
      setListings(data);
      setIsRunning(status.running);
    } catch (e) {
      console.error('Load error:', e);
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  }, [search]);

  useFocusEffect(
    useCallback(() => {
      load();
      intervalRef.current = setInterval(() => load(), 30000);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }, [load])
  );

  const handleSearchChange = (text: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(text), 300);
  };

  const handleRunNow = async () => {
    if (isRunning) return;
    try {
      await triggerRun();
      setIsRunning(true);
      setRunMsg('Scraper running...');
      setTimeout(() => {
        setRunMsg('');
        load();
      }, 10000);
    } catch (e) {
      setRunMsg('Failed to start scraper');
      setTimeout(() => setRunMsg(''), 3000);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    load(true);
  };

  const ListHeader = (
    <View>
      {/* Page header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Fitness Buyer Hunter</Text>
          <Text style={styles.subtitle}>Houston, TX · {listings.length} leads</Text>
        </View>
        <View style={styles.headerRight}>
          {runMsg ? <Text style={styles.runMsg}>{runMsg}</Text> : null}
          <TouchableOpacity
            style={[styles.runBtn, isRunning && styles.runBtnActive]}
            onPress={handleRunNow}
            disabled={isRunning}
          >
            {isRunning ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Text style={styles.runBtnText}>▶ Hunt</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search leads..."
          placeholderTextColor={Colors.textDim}
          onChangeText={handleSearchChange}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
      </View>
    </View>
  );

  const EmptyComponent = loading ? (
    <View style={styles.empty}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.emptyText}>Loading leads...</Text>
    </View>
  ) : (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>🎯</Text>
      <Text style={styles.emptyTitle}>No leads found</Text>
      <Text style={styles.emptyText}>Tap Hunt to start scanning for buyers.</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <FlatList
        data={listings}
        keyExtractor={(item) => item.id || item.url}
        renderItem={({ item }) => <ListingCard listing={item} />}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={EmptyComponent}
        contentContainerStyle={listings.length === 0 ? styles.emptyContainer : styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
        keyboardShouldPersistTaps="handled"
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: 60,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  runMsg: {
    fontSize: FontSize.xs,
    color: Colors.primary,
  },
  runBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    minWidth: 76,
    alignItems: 'center',
  },
  runBtnActive: {
    backgroundColor: Colors.primaryDark,
    opacity: 0.8,
  },
  runBtnText: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.sm,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: Spacing.sm,
  },
  searchIcon: {
    fontSize: 15,
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSize.md,
    paddingVertical: 11,
  },
  listContent: {
    paddingBottom: Spacing.xl,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
