// Test example for Button component
import React from 'react';
import { render } from '@testing-library/react-native';
import Button from '../../components/common/Button';

describe('Button Component', () => {
  it('should render correctly', () => {
    const { getByText } = render(
      <Button title="Test Button" onPress={() => {}} />
    );
    expect(getByText('Test Button')).toBeTruthy();
  });

  it('should call onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <Button title="Test Button" onPress={onPress} />
    );
    getByRole('button').props.onPress();
    expect(onPress).toHaveBeenCalled();
  });
});
