import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {iconData} from '../data/iconData';

const IconDemo: React.FC = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Factorio 图标系统演示</Text>
      <Text style={styles.subtitle}>
        当前包含 {iconData.length} 个图标
      </Text>
      
      <View style={styles.iconGrid}>
        {iconData.map((icon, index) => (
          <View key={icon.id} style={styles.iconItem}>
            <View
              style={[
                styles.iconDisplay,
                {backgroundColor: icon.color},
              ]}
            />
            <Text style={styles.iconName}>{icon.id}</Text>
            <Text style={styles.iconPosition}>{icon.position}</Text>
          </View>
        ))}
      </View>
      
      <View style={styles.info}>
        <Text style={styles.infoTitle}>使用说明</Text>
        <Text style={styles.infoText}>
          1. 图标数据已从Factorio 1.1.107提取
        </Text>
        <Text style={styles.infoText}>
          2. 精灵图文件已复制到assets目录
        </Text>
        <Text style={styles.infoText}>
          3. 修复TypeScript配置后可使用GameIcon组件
        </Text>
        <Text style={styles.infoText}>
          4. 当前显示的是图标的主色调
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  iconItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 16,
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconDisplay: {
    width: 32,
    height: 32,
    borderRadius: 4,
    marginBottom: 4,
  },
  iconName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 2,
  },
  iconPosition: {
    fontSize: 8,
    color: '#64748B',
    textAlign: 'center',
  },
  info: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
    lineHeight: 20,
  },
});

export default IconDemo; 