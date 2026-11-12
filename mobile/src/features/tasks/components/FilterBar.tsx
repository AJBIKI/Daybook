import { ArrowUpDown, Check, ChevronDown, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Card } from '../../../components/ui/Card';
import { Chip } from '../../../components/ui/Chip';
import { Input } from '../../../components/ui/Input';
import { Text } from '../../../components/ui/Text';
import { useTheme } from '../../../theme/ThemeProvider';
import { radius, spacing, touchTarget } from '../../../theme/tokens';
import type {
  SortOrder,
  TaskPriority,
  TaskSortBy,
  TaskStatusFilter,
} from '../../../types/task';

export type SortOptionId = 'newest' | 'dueSoon' | 'priority';

export interface SortOption {
  id: SortOptionId;
  label: string;
  sortBy: TaskSortBy;
  order: SortOrder;
}

export const DEFAULT_SORT_OPTION: SortOption = {
  id: 'newest',
  label: 'Newest',
  sortBy: 'createdAt',
  order: 'desc',
};

export const SORT_OPTIONS: SortOption[] = [
  DEFAULT_SORT_OPTION,
  { id: 'dueSoon', label: 'Due soon', sortBy: 'dueDate', order: 'asc' },
  { id: 'priority', label: 'Priority', sortBy: 'priority', order: 'desc' },
];

export type DuePresetFilter = 'overdue' | 'upcoming' | null;

export interface FilterBarProps {
  search: string;
  onSearchChange: (text: string) => void;
  status: TaskStatusFilter;
  onStatusChange: (status: TaskStatusFilter) => void;
  priority: TaskPriority | undefined;
  onPriorityChange: (priority: TaskPriority | undefined) => void;
  sortId: SortOptionId;
  onSortChange: (option: SortOption) => void;
  duePreset: DuePresetFilter;
  onClearDuePreset: () => void;
}

const STATUS_OPTIONS: Array<{ value: TaskStatusFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Done' },
];

const PRIORITY_OPTIONS: Array<{ value: TaskPriority; label: string }> = [
  { value: 3, label: 'High' },
  { value: 2, label: 'Med' },
  { value: 1, label: 'Low' },
];

export function FilterBar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  priority,
  onPriorityChange,
  sortId,
  onSortChange,
  duePreset,
  onClearDuePreset,
}: FilterBarProps) {
  const { colors } = useTheme();
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const currentSort =
    SORT_OPTIONS.find((item) => item.id === sortId) ?? DEFAULT_SORT_OPTION;

  return (
    <View style={styles.container}>
      <Input
        value={search}
        onChangeText={onSearchChange}
        placeholder="Search title or notes..."
        returnKeyType="search"
        autoCapitalize="none"
        rightSlot={
          search.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              hitSlop={8}
              onPress={() => {
                onSearchChange('');
              }}
              style={styles.clearButton}>
              <X size={18} color={colors.inkMuted} />
            </Pressable>
          ) : undefined
        }
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}>
        {STATUS_OPTIONS.map((item) => (
          <Chip
            key={item.value}
            label={item.label}
            selected={status === item.value}
            onPress={() => {
              onStatusChange(item.value);
            }}
          />
        ))}

        <View style={[styles.divider, { backgroundColor: colors.line }]} />

        {PRIORITY_OPTIONS.map((item) => {
          const isSelected = priority === item.value;
          return (
            <Chip
              key={item.value}
              label={item.label}
              selected={isSelected}
              onPress={() => {
                onPriorityChange(isSelected ? undefined : item.value);
              }}
            />
          );
        })}
      </ScrollView>

      <View style={styles.bottomControls}>
        {duePreset ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Clear ${duePreset} filter`}
            onPress={onClearDuePreset}
            style={({ pressed }) => [
              styles.presetPill,
              {
                backgroundColor: colors.accentSoft,
                borderColor: colors.accent,
                opacity: pressed ? 0.85 : 1,
              },
            ]}>
            <Text variant="caption" accent>
              {duePreset === 'overdue' ? 'Overdue only' : 'Upcoming only'}
            </Text>
            <X size={14} color={colors.accent} />
          </Pressable>
        ) : (
          <View />
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Sort by ${currentSort.label}`}
          accessibilityState={{ expanded: sortMenuOpen }}
          onPress={() => {
            setSortMenuOpen((prev) => !prev);
          }}
          style={({ pressed }) => [
            styles.sortTrigger,
            {
              backgroundColor: colors.surface,
              borderColor: sortMenuOpen ? colors.accent : colors.line,
              opacity: pressed ? 0.85 : 1,
            },
          ]}>
          <ArrowUpDown size={15} color={colors.inkMuted} />
          <Text variant="caption">{currentSort.label}</Text>
          <ChevronDown size={15} color={colors.inkMuted} />
        </Pressable>
      </View>

      {sortMenuOpen ? (
        <Card style={styles.sortMenu}>
          <Text variant="label" muted>
            Sort tasks by
          </Text>
          {SORT_OPTIONS.map((option) => {
            const active = option.id === sortId;
            return (
              <Pressable
                key={option.id}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => {
                  onSortChange(option);
                  setSortMenuOpen(false);
                }}
                style={({ pressed }) => [
                  styles.sortItem,
                  {
                    backgroundColor: active
                      ? colors.accentSoft
                      : 'transparent',
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}>
                <Text
                  variant="bodyStrong"
                  color={active ? colors.accent : colors.ink}>
                  {option.label}
                </Text>
                {active ? <Check size={18} color={colors.accent} /> : null}
              </Pressable>
            );
          })}
        </Card>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  clearButton: {
    minWidth: touchTarget.min,
    minHeight: touchTarget.min,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -spacing.sm,
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  divider: {
    width: 1,
    height: 24,
    marginHorizontal: spacing.xs,
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  presetPill: {
    minHeight: 40,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sortTrigger: {
    minHeight: touchTarget.min,
    borderRadius: radius.chip,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sortMenu: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  sortItem: {
    minHeight: touchTarget.min,
    borderRadius: radius.chip,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
