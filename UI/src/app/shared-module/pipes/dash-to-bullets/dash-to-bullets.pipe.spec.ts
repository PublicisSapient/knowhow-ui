import { DashToBulletsPipe } from './dash-to-bullets.pipe';

describe('DashToBulletsPipe', () => {
  let pipe: DashToBulletsPipe;

  beforeEach(() => {
    pipe = new DashToBulletsPipe();
  });

  it('should return empty array for empty input', () => {
    const result = pipe.transform('');
    expect(result).toEqual([]);
  });

  it('should return empty array for input with no dashes', () => {
    const result = pipe.transform('hello world');
    expect(result).toEqual([]);
  });

  it('should return empty array for input with dashes but no spaces after dashes', () => {
    const result = pipe.transform('-hello');
    expect(result).toEqual([]);
  });

  it('should return array with trimmed values for input with dashes and spaces after dashes', () => {
    const result = pipe.transform('- hello\n- world');
    expect(result).toEqual(['hello', 'world']);
  });

  it('should return array with trimmed values for input with multiple lines', () => {
    const result = pipe.transform('- hello\n  - world\n- foo');
    expect(result).toEqual(['hello', 'world', 'foo']);
  });

  it('should return array with trimmed values for input with leading and trailing whitespace', () => {
    const result = pipe.transform('  - hello\n  - world  ');
    expect(result).toEqual(['hello', 'world']);
  });
});
