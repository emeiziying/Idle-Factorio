import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  PanGestureHandler,
  State,
} from 'react-native';
import {useGame} from '../context/GameContext';
import {items} from '../data/gameData';

const CraftingQueueBubble: React.FC = () => {
  const {state, removeFromCraftingQueue} = useGame();
  const [isExpanded, setIsExpanded] = useState(false);

  if (state.craftingQueue.length === 0) {
    return null;
  }

  const handleTaskPress = (taskId: string) => {
    removeFromCraftingQueue(taskId);
  };

  const renderTask = (task: any) => {
    const item = items[task.itemId];
    if (!item) return null;

    const progressPercentage = task.progress * 100;

    return (
      <TouchableOpacity
        key={task.id}
        style={styles.taskItem}
        onPress={() => handleTaskPress(task.id)}>
        <View style={styles.taskIconContainer}>
          <Text style={styles.taskIcon}>📦</Text>
          <View style={styles.progressRing}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progressPercentage}%`,
                },
              ]}
            />
          </View>
        </View>
        <Text style={styles.taskName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.taskProgress}>{Math.round(progressPercentage)}%</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.bubble}
        onPress={() => setIsExpanded(!isExpanded)}>
        <Text style={styles.bubbleIcon}>⚙️</Text>
        <Text style={styles.bubbleCount}>{state.craftingQueue.length}</Text>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.expandedContainer}>
          <Text style={styles.expandedTitle}>制作队列</Text>
          <View style={styles.taskList}>
            {state.craftingQueue.map(renderTask)}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 1000,
  },
  bubble: {
    backgroundColor: '#2563EB',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  bubbleIcon: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  bubbleCount: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#EF4444',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    textAlign: 'center',
  },
  expandedContainer: {
    position: 'absolute',
    bottom: 70,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  expandedTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
    textAlign: 'center',
  },
  taskList: {
    gap: 8,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
  taskIconContainer: {
    position: 'relative',
    marginRight: 12,
  },
  taskIcon: {
    fontSize: 20,
  },
  progressRing: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
  },
  taskName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  taskProgress: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
});

export default CraftingQueueBubble; 