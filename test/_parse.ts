import { strict as assert } from 'assert'

import { _indexOf, _regExpTest, _split } from '../src/_parse'

describe('_indexOf', () => {
    it('should return the index of the searchString', () => {
        assert.equal(_indexOf('abc', 'b', 0, 3), 1)
    })
    it('should return -1 if the searchString is not present', () => {
        assert.equal(_indexOf('abc', 'x', 0, 3), -1)
    })
    it('should return -1 if the searchString is before start', () => {
        assert.equal(_indexOf('abc', 'a', 1, 3), -1)
    })
    it('should return -1 if the searchString is after end', () => {
        assert.equal(_indexOf('abc', 'c', 0, 2), -1)
    })
})

describe('_regExpTest', () => {
    it('should return true if the regExp matches', () => {
        assert.equal(_regExpTest('abc', /b/y, 1), true)
    })
    it('should return false if the regExp does not match', () => {
        assert.equal(_regExpTest('abc', /x/y, 1), false)
    })
    it('should return false if the regExp matches before start', () => {
        assert.equal(_regExpTest('abc', /a/y, 1), false)
    })
    it('should return false if the regExp matches after start', () => {
        assert.equal(_regExpTest('abc', /c/y, 1), false)
    })
    it('should throw an Error if the regExp is not sticky', () => {
        assert.throws(() =>  _regExpTest('abc', /b/, 1), Error)
    })
})

describe('_split', () => {
    it('should return the spans', () => {
        assert.deepEqual(Array.from(_split('a,bc,d', ',', 0, 6)), [
            [ 0, 1 ],
            [ 2, 4 ],
            [ 5, 6 ],
        ])
    })
    it('should return a single span at the start', () => {
        assert.deepEqual(Array.from(_split('a,bc,d', ',', 0, 1)), [
            [ 0, 1 ],
        ])
    })
    it('should return a single span at the end', () => {
        assert.deepEqual(Array.from(_split('a,bc,d', ',', 5, 6)), [
            [ 5, 6 ],
        ])
    })
    it('should return a single span if the separator is not present', () => {
        assert.deepEqual(Array.from(_split('a,bc,d', '#', 0, 6)), [
            [ 0, 6 ],
        ])
    })
    it('should return empty spans for consecutive separators', () => {
        assert.deepEqual(Array.from(_split('a,,b', ',', 0, 4)), [
            [ 0, 1 ],
            [ 2, 2 ],
            [ 3, 4 ],
        ])
    })
    it('should return only empty spans for a string with only separators', () => {
        assert.deepEqual(Array.from(_split(',,', ',', 0, 2)), [
            [ 0, 0 ],
            [ 1, 1 ],
            [ 2, 2 ],
        ])
    })
    it('should return an empty span at the start', () => {
        assert.deepEqual(Array.from(_split(',a', ',', 0, 2)), [
            [ 0, 0 ],
            [ 1, 2 ],
        ])
    })
    it('should return an empty span at the end', () => {
        assert.deepEqual(Array.from(_split('a,', ',', 0, 2)), [
            [ 0, 1 ],
            [ 2, 2 ],
        ])
    })
    it('should return an empty span for an empty string', () => {
        assert.deepEqual(Array.from(_split('', ',', 0, 0)), [
            [ 0, 0 ],
        ])
    })
})
