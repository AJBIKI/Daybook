import { BookOpen } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Checkbox } from '../../components/ui/Checkbox';
import { Chip } from '../../components/ui/Chip';
import { EmptyState } from '../../components/ui/EmptyState';
import { FAB } from '../../components/ui/FAB';
import { Input } from '../../components/ui/Input';
import { OfflineBanner } from '../../components/ui/OfflineBanner';
import { PriorityBadge } from '../../components/ui/PriorityBadge';
import { ProgressRing } from '../../components/ui/ProgressRing';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Skeleton } from '../../components/ui/Skeleton';
import { StatCard } from '../../components/ui/StatCard';
import { TaskRow } from '../../components/ui/TaskRow';
import { Text } from '../../components/ui/Text';
import { useToast } from '../../components/ui/Toast';
import { useTheme } from '../../theme/ThemeProvider';
import { spacing, type ThemeMode } from '../../theme/tokens';
import type { Task } from '../../types/task';

const SAMPLE_TASKS: Task[] = [
  {
    id: '1',
    userId: 'demo',
    title: 'Finalize system architecture notes for interview prep',
    notes: '',
    priority: 3,
    dueDate: new Date(Date.now() - 3600 * 1000).toISOString(),
    completed: false,
    completedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    userId: 'demo',
    title: 'Walk through UI kit typography & spacing scale',
    notes: '',
    priority: 2,
    dueDate: new Date(Date.now() + 7200 * 1000).toISOString(),
    completed: true,
    completedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function GalleryScreen() {
  const { colors, mode, setMode } = useTheme();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();

  const [checked, setChecked] = useState(false);
  const [progress, setProgress] = useState(0.65);
  const [selectedChip, setSelectedChip] = useState<'all' | 'active' | 'done'>('all');
  const [inputVal, setInputVal] = useState('');
  const [tasks, setTasks] = useState<Task[]>(SAMPLE_TASKS);

  const toggleSampleTask = (target: Task) => {
    setTasks((prev) =>
      prev.map((item) =>
        item.id === target.id
          ? { ...item, completed: !item.completed }
          : item,
      ),
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: spacing.lg,
            paddingBottom: insets.bottom + 96,
          },
        ]}>
        <ScreenHeader
          eyebrow="PHASE 3 DEV GALLERY"
          title="Daybook UI Kit"
          subtitle="All primitives, variants, and states in one scroll."
          display
        />

        <Card style={styles.section}>
          <Text variant="label" muted>
            Theme Switcher ({mode})
          </Text>
          <View style={styles.rowWrap}>
            {(['system', 'light', 'dark'] as ThemeMode[]).map((item) => (
              <Chip
                key={item}
                label={item[0]?.toUpperCase() + item.slice(1)}
                selected={mode === item}
                onPress={() => {
                  setMode(item).catch(() => {});
                }}
              />
            ))}
          </View>
        </Card>

        <OfflineBanner visible />

        <Card style={styles.section}>
          <Text variant="label" muted>
            Typography
          </Text>
          <Text variant="display">Display · Fraunces 34/40</Text>
          <Text variant="title">Title · Fraunces 24/30</Text>
          <Text variant="heading">Heading · Inter SemiBold 17/24</Text>
          <Text variant="body">Body · Inter Regular 15/22</Text>
          <Text variant="bodyStrong">Body Strong · Inter Medium 15/22</Text>
          <Text variant="caption" muted>
            Caption · Inter Regular 13/18
          </Text>
          <Text variant="label" accent>
            Label · Inter SemiBold 12/16
          </Text>
        </Card>

        <Card style={styles.section}>
          <Text variant="label" muted>
            Buttons
          </Text>
          <Button
            label="Primary"
            onPress={() => {
              showToast('Primary pressed', 'success');
            }}
          />
          <Button
            label="Secondary"
            variant="secondary"
            onPress={() => {
              showToast('Secondary pressed', 'info');
            }}
          />
          <Button
            label="Ghost"
            variant="ghost"
            onPress={() => {
              showToast('Ghost pressed', 'info');
            }}
          />
          <Button
            label="Danger"
            variant="danger"
            onPress={() => {
              showToast('Danger toast sample', 'error');
            }}
          />
          <Button label="Loading" loading onPress={() => {}} />
          <Button label="Disabled" disabled onPress={() => {}} />
        </Card>

        <Card style={styles.section}>
          <Text variant="label" muted>
            Inputs
          </Text>
          <Input
            label="Default"
            value={inputVal}
            onChangeText={setInputVal}
            placeholder="Write a task title..."
            helperText="Supports system font scaling cleanly."
          />
          <Input
            label="Error state"
            value="Bad input"
            onChangeText={() => {}}
            error="Title is required"
          />
          <Input
            label="Disabled"
            value="Read-only field"
            editable={false}
          />
        </Card>

        <Card style={styles.section}>
          <Text variant="label" muted>
            Chips, Checkbox & Priority Badges
          </Text>
          <View style={styles.rowWrap}>
            {(['all', 'active', 'done'] as const).map((status) => (
              <Chip
                key={status}
                label={status}
                selected={selectedChip === status}
                onPress={() => {
                  setSelectedChip(status);
                }}
              />
            ))}
            <Chip label="Disabled" disabled onPress={() => {}} />
          </View>
          <View style={styles.rowCenter}>
            <Checkbox
              checked={checked}
              accessibilityLabel="Sample animated checkbox"
              onToggle={() => {
                setChecked((v) => !v);
              }}
            />
            <PriorityBadge priority={1} />
            <PriorityBadge priority={2} />
            <PriorityBadge priority={3} />
          </View>
        </Card>

        <Card style={styles.section}>
          <Text variant="label" muted>
            ProgressRing & StatCards
          </Text>
          <View style={styles.rowCenter}>
            <ProgressRing progress={progress} />
            <View style={styles.flexCol}>
              <Button
                label="Cycle progress"
                variant="secondary"
                onPress={() => {
                  setProgress((p) => (p >= 1 ? 0.25 : Number((p + 0.25).toFixed(2))));
                }}
              />
            </View>
          </View>
          <View style={styles.bentoRow}>
            <StatCard label="Overdue" value={2} tone="danger" onPress={() => {}} />
            <StatCard label="Upcoming" value={5} tone="accent" onPress={() => {}} />
          </View>
        </Card>

        <View style={styles.section}>
          <Text variant="label" muted>
            TaskRows
          </Text>
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onToggle={toggleSampleTask}
              onPress={(item) => {
                showToast(`Tapped "${item.title}"`, 'info');
              }}
            />
          ))}
        </View>

        <Card style={styles.section}>
          <Text variant="label" muted>
            Skeletons
          </Text>
          <Skeleton height={22} width="65%" />
          <Skeleton height={64} borderRadius={20} />
        </Card>

        <EmptyState
          icon={<BookOpen size={22} color={colors.accent} />}
          title="Nothing due yet"
          message="Your daybook is clear. Add a task whenever something comes to mind."
          actionLabel="Show Toast"
          onAction={() => {
            showToast('Toast notification works!', 'success');
          }}
        />
      </ScrollView>

      <FAB
        onPress={() => {
          showToast('FAB pressed', 'info');
        }}
        style={[styles.fabPosition, { bottom: insets.bottom + spacing.xl }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  fabPosition: {
    position: 'absolute',
    right: spacing.screen,
  },
  content: {
    paddingHorizontal: spacing.screen,
    gap: spacing.lg,
  },
  section: {
    gap: spacing.md,
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  flexCol: {
    flex: 1,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
