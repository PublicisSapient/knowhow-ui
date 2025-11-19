import { DynamicCurrencyPipe } from './dynamic-currency.pipe';

describe('DynamicCurrencyPipe', () => {
  it('create an instance', () => {
    const pipe = new DynamicCurrencyPipe();
    expect(pipe).toBeTruthy();
  });
});
