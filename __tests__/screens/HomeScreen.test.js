// Test example for HomeScreen
import React from 'react';
import { render } from '@testing-library/react-native';
import HomeScreen from '../../screens/main/HomeScreen';

describe('HomeScreen', () => {
  it('should render correctly', () => {
    const navigation = { navigate: jest.fn() };
    const { getByText } = render(
      <HomeScreen navigation={navigation} />
    );
    expect(getByText('Recent Transactions')).toBeTruthy();
  });
});
