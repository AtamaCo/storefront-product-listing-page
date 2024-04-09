/*
Copyright 2024 Adobe
All Rights Reserved.

NOTICE: Adobe permits you to use, modify, and distribute this file in
accordance with the terms of the Adobe license agreement accompanying
it.
*/

import { render } from '@testing-library/preact';

import { OutOfStockForm } from './OutOfStockForm';

describe('WidgetSDK - UIKit/OutOfStockForm', () => {
  test('renders', () => {
    const { container } = render(
      <OutOfStockForm
        onClick={() => {
          return;
        }}
      />
    );

    const elem = container.querySelector('.ds-sdk-add-to-cart-button');

    expect(!!elem).toEqual(true);
  });
});
