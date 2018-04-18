import { default as makePath, getRelativePath } from '../../src/util/makePath';

describe('makePath utils ', () => {
  describe('makePath', () => {
    it('should be able to handle just a string', () => {
      expect(makePath`path`).to.equal('path');
    });
    it('should be able to handle interpolating values into a template', () => {
      const path = 'path',
        key = 'key';
      expect(makePath`${path}${key}`).to.equal('pathkey');
    });
    it('should be able to do complete string interpolation', () => {
      const path = 'path',
        key = 'key';
      expect(makePath`${path}.${key}`).to.equal('path.key');
    });
  });
  describe('getRelativePath', () => {
    it('should be able to handle relative paths', () => {
      const path = 'a.b.c',
        key = '../key';
      expect(getRelativePath(path, key)).to.equal('a.key');
    });
    it('should work for deep relative paths', () => {
      const path = 'a.b.c',
        key = '../../key';
      expect(getRelativePath(path, key)).to.equal('key');
    });
    it('should work for deep relative paths with an array', () => {
      const path = 'a.b[0].c',
        key = '../key';
      expect(getRelativePath(path, key)).to.equal('a.key');
    });
    it('should work for deep relative paths with an array', () => {
      const path = 'a.b[0].c',
        key = 'key';
      expect(getRelativePath(path, key)).to.equal('a.b[0].key');
    });
  });
});
