import React from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { Colors, Platform, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import type { Listing } from '@/constants/types';

function timeAgo(dateStr?: string | null) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;
  const diff = Date.now() - date.getTime();
  const min  = Math.floor(diff / 60000);
  const hr   = Math.floor(diff / 3600000);
  const day  = Math.floor(diff / 86400000);
  if (min < 60) return `${min}m ago`;
  if (hr < 24)  return `${hr}h ago`;
  if (day < 30) return `${day}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ListingCard({ listing }: { listing: Listing }) {
  const cfg = Platform[listing.platform as keyof typeof Platform] ?? Platform.Web;
  const posted = timeAgo(listing.posted_at);
  const found  = timeAgo(listing.found_at);

  return (
    <View style={[styles.card, listing.is_new && styles.cardNew]}>
      {/* Top row */}
      <View style={styles.topRow}>
        <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
          <Text style={[styles.badgeText, { color: cfg.color }]}>
            {listing.platform}
          </Text>
        </View>
        <View style={styles.topRight}>
          {listing.is_new && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          )}
          {posted && <Text style={styles.timeText}>📅 {posted}</Text>}
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title} numberOfLines={2}>
        {listing.title}
      </Text>

      {/* Snippet */}
      {listing.snippet ? (
        <Text style={styles.snippet} numberOfLines={3}>
          {listing.snippet}
        </Text>
      ) : null}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.foundTime}>{found ? `Found ${found}` : ''}</Text>
        <TouchableOpacity
          style={[styles.viewBtn, { backgroundColor: cfg.color }]}
          onPress={() => listing.url && Linking.openURL(listing.url)}
          activeOpacity={0.8}
        >
          <Text style={styles.viewBtnText}>View →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#334155',
    gap: Spacing.sm,
  },
  cardNew: {
    borderColor: Colors.primary,
    borderWidth: 1.5,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  badgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.3,
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  newBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  newBadgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.8,
  },
  timeText: {
    color: Colors.textDim,
    fontSize: FontSize.xs,
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    lineHeight: 22,
  },
  snippet: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  foundTime: {
    color: Colors.textDim,
    fontSize: FontSize.xs,
  },
  viewBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: Radius.md,
  },
  viewBtnText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
});
