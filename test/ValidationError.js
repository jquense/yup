import ValidationError from '../src/ValidationError'

describe('ValidationError', function() {
  describe('formatError', function() {
    it('should insert the params into the message', function() {
      const str = ValidationError.formatError('Some message ${param}', {
        param: 'here'
      })
      str.should.contain('here')
    })

    it(`should auto include any param named 'label' or 'path' as the 'path' param`, function() {
      const str = ValidationError.formatError('${path} goes here', {
        label: 'label'
      })
      str.should.contain('label')
    })

    it(`should use 'this' if a 'label' or 'path' param is not provided`, function() {
      const str = ValidationError.formatError('${path} goes here', {})
      str.should.contain('this')
    })

    it(`should return the validation function if only a message is provided`, function() {
      const str = ValidationError.formatError('${path} goes here')({})
      str.should.contain('this')
    })

    it(`should include 0 in the message if 0 is provided as a param`, function() {
      const str = ValidationError.formatError('${path} value is ${min}', {
        min: 0
      })
      str.should.contain('0')
    })
  })
})
