import { zodResolver } from '@hookform/resolvers/zod';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { format, isSameDay } from 'date-fns';
import { Calendar, Clock, X } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';

import type { AuthenticatedStackParamList } from '../../../app/navigationTypes';
import { Button } from '../../../components/ui/Button';
import { Chip } from '../../../components/ui/Chip';
import { Input } from '../../../components/ui/Input';
import { OfflineBanner } from '../../../components/ui/OfflineBanner';
import { Text } from '../../../components/ui/Text';
import {
  type QuickDuePreset,
  buildQuickDueDate,
  mergeDatePart,
  mergeTimePart,
} from '../../../lib/dates';
import { triggerLightHaptic } from '../../../lib/haptics';
import { useIsOnline } from '../../../lib/useIsOnline';
import { useTheme } from '../../../theme/ThemeProvider';
import { radius, spacing, touchTarget } from '../../../theme/tokens';
import type { TaskPriority } from '../../../types/task';
import {
  useCreateTaskMutation,
  useDeleteTaskMutation,
  useTaskDetailQuery,
  useUpdateTaskMutation,
} from '../hooks';

const taskFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(120, 'Title must be at most 120 characters'),
  notes: z.string().max(2000, 'Notes must be at most 2000 characters'),
  priority: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  dueDate: z.date().nullable(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;
type Props = NativeStackScreenProps<AuthenticatedStackParamList, 'TaskModal'>;

const PRIORITY_CHOICES: Array<{ value: TaskPriority; label: string }> = [
  { value: 1, label: 'Low' },
  { value: 2, label: 'Med' },
  { value: 3, label: 'High' },
];

const QUICK_DUE_CHOICES: Array<{ id: QuickDuePreset; label: string }> = [
  { id: 'today', label: 'Today' },
  { id: 'tomorrow', label: 'Tomorrow' },
  { id: 'nextWeek', label: 'Next week' },
];

export function TaskModalScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const isOnline = useIsOnline();

  const taskId = route.params?.taskId;
  const initialTask = route.params?.initialTask;
  const defaultDuePreset = route.params?.defaultDuePreset;
  const isEditing = Boolean(taskId);

  const detailQuery = useTaskDetailQuery(taskId, initialTask);
  const existingTask = detailQuery.data ?? initialTask;

  const createMutation = useCreateTaskMutation();
  const updateMutation = useUpdateTaskMutation();
  const deleteMutation = useDeleteTaskMutation();

  const allowExitRef = useRef(false);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: existingTask?.title ?? '',
      notes: existingTask?.notes ?? '',
      priority: existingTask?.priority ?? 2,
      dueDate: existingTask?.dueDate
        ? new Date(existingTask.dueDate)
        : defaultDuePreset === 'today'
          ? buildQuickDueDate('today')
          : null,
    },
  });

  const hydratedIdRef = useRef<string | undefined>(existingTask?.id);

  useEffect(() => {
    if (existingTask && hydratedIdRef.current !== existingTask.id) {
      hydratedIdRef.current = existingTask.id;
      reset({
        title: existingTask.title,
        notes: existingTask.notes,
        priority: existingTask.priority,
        dueDate: existingTask.dueDate ? new Date(existingTask.dueDate) : null,
      });
    }
  }, [existingTask, reset]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!isDirty || allowExitRef.current) {
        return;
      }
      e.preventDefault();
      Alert.alert(
        'Discard changes?',
        'You have unsaved edits that will be lost.',
        [
          { text: 'Keep editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              allowExitRef.current = true;
              navigation.dispatch(e.data.action);
            },
          },
        ],
      );
    });
    return unsubscribe;
  }, [isDirty, navigation]);

  const currentDueDate = watch('dueDate');
  const currentPriority = watch('priority');

  const isSaving =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  const openDatePicker = () => {
    if (Platform.OS !== 'android') {
      return;
    }
    const base = currentDueDate ?? buildQuickDueDate('today');
    DateTimePickerAndroid.open({
      value: base,
      mode: 'date',
      onValueChange: (_event, selectedDate) => {
        setValue('dueDate', mergeDatePart(currentDueDate, selectedDate), {
          shouldDirty: true,
        });
      },
    });
  };

  const openTimePicker = () => {
    if (Platform.OS !== 'android') {
      return;
    }
    const base = currentDueDate ?? buildQuickDueDate('today');
    DateTimePickerAndroid.open({
      value: base,
      mode: 'time',
      onValueChange: (_event, selectedTime) => {
        setValue('dueDate', mergeTimePart(currentDueDate, selectedTime), {
          shouldDirty: true,
        });
      },
    });
  };

  const onSubmit = async (values: TaskFormValues) => {
    if (!isOnline) {
      return;
    }
    const payload = {
      title: values.title.trim(),
      notes: values.notes,
      priority: values.priority,
      dueDate: values.dueDate ? values.dueDate.toISOString() : null,
    };

    try {
      if (isEditing && taskId) {
        await updateMutation.mutateAsync({ id: taskId, input: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      triggerLightHaptic();
      allowExitRef.current = true;
      navigation.goBack();
    } catch {
      // Mutation hooks display the contextual error toast.
    }
  };

  const handleDelete = () => {
    if (!isEditing || !taskId || !isOnline) {
      return;
    }
    Alert.alert(
      'Delete task?',
      'This task will be permanently removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteMutation
              .mutateAsync(taskId)
              .then(() => {
                allowExitRef.current = true;
                navigation.goBack();
              })
              .catch(() => {});
          },
        },
      ],
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.root, { backgroundColor: colors.bg }]}>
      <View
        style={[
          styles.topBar,
          {
            borderBottomColor: colors.line,
            paddingTop: insets.top + spacing.sm,
          },
        ]}>
        <View style={styles.topBarCopy}>
          <Text variant="label" accent>
            {isEditing ? 'EDIT TASK' : 'NEW TASK'}
          </Text>
          <Text variant="title">
            {isEditing ? 'Update task' : 'Capture a task'}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close modal"
          hitSlop={8}
          onPress={() => {
            navigation.goBack();
          }}
          style={[styles.closeButton, { borderColor: colors.line }]}>
          <X size={20} color={colors.ink} />
        </Pressable>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.form,
          { paddingBottom: insets.bottom + spacing['2xl'] },
        ]}>
        <OfflineBanner visible={!isOnline} />

        <Controller
          control={control}
          name="title"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Title"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="What needs to happen?"
              autoFocus={!isEditing}
              maxLength={120}
              returnKeyType="next"
              error={errors.title?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="notes"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Notes"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Optional context, links, or checklist..."
              multiline
              numberOfLines={4}
              maxLength={2000}
              textAlignVertical="top"
              style={styles.notesInput}
              error={errors.notes?.message}
            />
          )}
        />

        <View style={styles.fieldGroup}>
          <Text variant="label" muted>
            Priority
          </Text>
          <View style={styles.rowWrap}>
            {PRIORITY_CHOICES.map((choice) => (
              <Chip
                key={choice.value}
                label={choice.label}
                selected={currentPriority === choice.value}
                onPress={() => {
                  setValue('priority', choice.value, { shouldDirty: true });
                }}
              />
            ))}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text variant="label" muted>
            Due date
          </Text>
          <View style={styles.rowWrap}>
            {QUICK_DUE_CHOICES.map((preset) => {
              const target = buildQuickDueDate(preset.id);
              const selected =
                currentDueDate !== null && isSameDay(currentDueDate, target);
              return (
                <Chip
                  key={preset.id}
                  label={preset.label}
                  selected={selected}
                  onPress={() => {
                    setValue('dueDate', target, { shouldDirty: true });
                  }}
                />
              );
            })}
            <Chip
              label="None"
              selected={currentDueDate === null}
              onPress={() => {
                setValue('dueDate', null, { shouldDirty: true });
              }}
            />
          </View>

          <View style={styles.pickerRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Pick due date"
              onPress={openDatePicker}
              style={({ pressed }) => [
                styles.pickerButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.line,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}>
              <Calendar size={17} color={colors.accent} />
              <Text variant="body" numberOfLines={1}>
                {currentDueDate
                  ? format(currentDueDate, 'EEE, MMM d')
                  : 'Select date'}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Pick due time"
              onPress={openTimePicker}
              style={({ pressed }) => [
                styles.pickerButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.line,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}>
              <Clock size={17} color={colors.accent} />
              <Text variant="body" numberOfLines={1}>
                {currentDueDate
                  ? format(currentDueDate, 'h:mm a')
                  : 'Select time'}
              </Text>
            </Pressable>
          </View>
        </View>

        {!isOnline ? (
          <Text variant="caption" danger>
            You are offline. Reconnect to save or delete tasks.
          </Text>
        ) : null}

        <View style={styles.actions}>
          <Button
            label={isEditing ? 'Save changes' : 'Create task'}
            loading={createMutation.isPending || updateMutation.isPending}
            disabled={isSaving || !isOnline}
            onPress={() => {
              handleSubmit(onSubmit)().catch(() => {});
            }}
          />

          {isEditing ? (
            <Button
              label="Delete task"
              variant="danger"
              loading={deleteMutation.isPending}
              disabled={isSaving || !isOnline}
              onPress={handleDelete}
            />
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  topBarCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  closeButton: {
    minWidth: touchTarget.min,
    minHeight: touchTarget.min,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.xl,
    gap: spacing.xl,
  },
  notesInput: {
    minHeight: 112,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  fieldGroup: {
    gap: spacing.sm,
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  pickerButton: {
    flex: 1,
    minHeight: touchTarget.control,
    borderRadius: radius.input,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
});
