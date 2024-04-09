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
        apiUrl='https://www'
        isOpen={true}
        productId={2}      
       />
    );

    const elem = container.querySelector('.ndg-modal-form');

    expect(!!elem).toEqual(true);
  });
});
