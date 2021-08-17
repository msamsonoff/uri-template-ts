import { strict as assert } from 'assert'

import { _isDefinedArray, _isDefinedObject, _allowUnreserved, _allowUnreservedReserved } from '../src/_expand'

describe('_isDefinedArray', () => {
    it('should return false for an empty array', () => {
        assert.equal(_isDefinedArray([]), false)
    })
    it('should return true for a non-empty array', () => {
        assert.equal(_isDefinedArray([ true, 1, 'abc' ]), true)
    })
    it('should return true for a non-empty array filled with falsy values', () => {
        assert.equal(_isDefinedArray([ false, 0, '' ]), true)
    })
    it('should return true for an array filled with undefined values', () => {
        assert.equal(_isDefinedArray([ undefined, null ]), true)
    })
    it('should return true for an array filled with defined and undefined values', () => {
        assert.equal(_isDefinedArray([ false, true, undefined, 0, 1, null, '', 'abc' ]), true)
    })
})

describe('_isDefinedObject', () => {
    it('should return false for an empty object', () => {
        assert.equal(_isDefinedObject({}), false)
    })
    it('should return true for a non-empty object', () => {
        assert.equal(_isDefinedObject({ x: true, y: 1, z: 'abc' }), true)
    })
    it('should return true for a non-empty object filled with falsy values', () => {
        assert.equal(_isDefinedObject({ x: false, y: 0, z: '' }), true)
    })
    it('should return false for a non-empty object filled with undefined values', () => {
        assert.equal(_isDefinedObject({ x: undefined, y: null }), false)
    })
    it('should return true for a non-empty object filled with defined and undefined values', () => {
        assert.equal(_isDefinedObject({ s: false, t: true, u: undefined, v: 0, w: 1, x: null, y: '', z: 'abc' }), true)
    })
})

describe('_allowUnreserved', () => {
    it('should percent-encode disallowed characters', () => {
        assert.equal(_allowUnreserved('ab cd:ef'), 'ab%20cd%3Aef')
    })
    it('should percent-encode RFC3986 characters', () => {
        assert.equal(_allowUnreserved('!*\'()'), '%21%2A%27%28%29')
    })
    it('should not further encode percent-encoded characters', () => {
        assert.equal(_allowUnreserved('ab%20cd%3Aef'), 'ab%20cd%3Aef')
    })
    it('should percent-encode surrogate pairs as UTF-8 octets', () => {
        assert.equal(_allowUnreserved('x\uD800\uDFFFy'), 'x%F0%90%8F%BFy')
    })
})

describe('_allowUnreservedReserved', () => {
    it('should percent-encode disallowed characters', () => {
        assert.equal(_allowUnreservedReserved('ab cd:ef'), 'ab%20cd:ef')
    })
    it('should not percent-encode square brackets', () => {
        assert.equal(_allowUnreservedReserved('[]'), '[]')
    })
    it('should percent-encode surrogate pairs as UTF-8 octets', () => {
        assert.equal(_allowUnreservedReserved('x\uD800\uDFFFy'), 'x%F0%90%8F%BFy')
    })
})
