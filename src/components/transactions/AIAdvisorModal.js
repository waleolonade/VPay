import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '../../styles/colors';

const AIAdvisorModal = ({ visible, onClose, summary }) => {
  const [aiAdvice, setAiAdvice] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const loadAIAdvice = useCallback(async () => {
    setAiLoading(true);
    try {
      // Placeholder for AI service call
      const advice = [
        'Diversify your spending across multiple categories to manage budget better.',
        'Your average transfer amount has increased by 15% this month. Consider setting spending limits.',
        'You spent more on bills this month. Look for subscription services you can cancel.',
        'Your transaction frequency has increased. You may benefit from automated transfers.',
        'Consider setting aside 20% of your income for savings and investments.',
      ];
      const randomAdvice = advice[Math.floor(Math.random() * advice.length)];
      setAiAdvice(randomAdvice);
    } catch (error) {
      console.error('Load AI advice error:', error);
      setAiAdvice('Unable to load advice at this time. Please try again later.');
    } finally {
      setAiLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      loadAIAdvice();
    }
  }, [visible, loadAIAdvice]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>VPay AI Advisor</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color="#1e293b" />
            </TouchableOpacity>
          </View>
          {aiLoading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <Text style={styles.aiAdviceText}>{aiAdvice}</Text>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  aiAdviceText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#475569',
  },
});

export default AIAdvisorModal;
