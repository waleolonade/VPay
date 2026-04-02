import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { notificationService } from '../../services/notificationService';
import { colors } from '../../styles/colors';

const TYPE_ICONS = {
  transaction: { name: 'cash-outline', color: colors.success },
  transfer:    { name: 'swap-horizontal-outline', color: colors.primary },
  loan:        { name: 'wallet-outline', color: colors.warning },
  savings:     { name: 'save-outline', color: colors.accent },
  security:    { name: 'shield-checkmark-outline', color: colors.danger },
  system:      { name: 'notifications-outline', color: colors.textMed },
  promo:       { name: 'gift-outline', color: colors.secondary },
};

function getIcon(type) {
  return TYPE_ICONS[type] || TYPE_ICONS.system;
}

function NotificationItem({ item, onPress }) {
  const icon = getIcon(item.type);
  return (
    <TouchableOpacity
      style={[styles.item, !item.isRead && styles.itemUnread]}
      onPress={() => onPress(item)}
      activeOpacity={0.75}
    >
      <View style={[styles.iconWrap, { backgroundColor: icon.color + '18' }]}>
        <Ionicons name={icon.name} size={22} color={icon.color} />
        {!item.isRead && <View style={styles.unreadDot} />}
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
        <Text style={styles.time}>
          {new Date(item.created_at || item.createdAt).toLocaleString([], {
            month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
          })}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadNotifications = useCallback(async (pageNum = 1, append = false) => {
    try {
      const res = await notificationService.getNotifications({ page: pageNum, limit: 20 });
      if (res.success) {
        const items = res.data || [];
        setNotifications((prev) => (append ? [...prev, ...items] : items));
        setHasMore(items.length === 20);
      }
    } catch (e) {
      console.error('Notifications fetch error:', e);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadNotifications(1);
      setLoading(false);
    })();
  }, [loadNotifications]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await loadNotifications(1);
    setRefreshing(false);
  };

  const handleLoadMore = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    const next = page + 1;
    setPage(next);
    await loadNotifications(next, true);
    setLoadingMore(false);
  };

  const handlePress = async (item) => {
    if (!item.isRead) {
      await notificationService.markAsRead(item.id || item._id);
      setNotifications((prev) =>
        prev.map((n) =>
          (n.id || n._id) === (item.id || item._id) ? { ...n, isRead: true } : n
        )
      );
    }
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id || item._id}
          renderItem={({ item }) => (
            <NotificationItem item={item} onPress={handlePress} />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={{ marginVertical: 12 }}
              />
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="notifications-off-outline" size={56} color={colors.border} />
              <Text style={styles.emptyText}>No notifications yet</Text>
            </View>
          }
          contentContainerStyle={notifications.length === 0 && styles.emptyContainer}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  markAllBtn: {
    paddingHorizontal: 4,
  },
  markAllText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemUnread: {
    backgroundColor: colors.primaryLight,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.danger,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 3,
  },
  body: {
    fontSize: 13,
    color: colors.textMed,
    lineHeight: 18,
    marginBottom: 5,
  },
  time: {
    fontSize: 11,
    color: colors.textLight,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 15,
    color: colors.textLight,
  },
});
