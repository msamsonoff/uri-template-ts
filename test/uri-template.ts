import { strict as assert } from 'assert'

import { UriTemplate } from '../src/uri-template'
import { ItemType, ModifierLevel4Type, Operator, ProblemType } from '../src/types'

describe('UriTemplate', () => {

    it('should parse and expand an empty template', () => {
        const uriTemplate = UriTemplate.parse('')
        assert.deepEqual(uriTemplate.problems, [])
        assert.deepEqual(uriTemplate.items, [])
        const expanded = uriTemplate.expand({})
        assert.equal(expanded, '')
    })

    it('should parse and expand a literal, expression, and literal', () => {
        const uriTemplate = UriTemplate.parse('x{y}z')
        assert.deepEqual(uriTemplate.problems, [])
        assert.deepEqual(uriTemplate.items, [
            {
                type: ItemType.Literal,
                value: 'x',
            },
            {
                type: ItemType.Expression,
                variableList: [
                    {
                        varname: 'y',
                    },
                ],
            },
            {
                type: ItemType.Literal,
                value: 'z',
            },
        ])
        const expanded = uriTemplate.expand({
            y: 'Y',
        })
        assert.equal(expanded, 'xYz')
    })

    it('should parse and expand an expression, literal, and expression', () => {
        const uriTemplate = UriTemplate.parse('{x}y{z}')
        assert.deepEqual(uriTemplate.problems, [])
        assert.deepEqual(uriTemplate.items, [
            {
                type: ItemType.Expression,
                variableList: [
                    {
                        varname: 'x',
                    },
                ],
            },
            {
                type: ItemType.Literal,
                value: 'y',
            },
            {
                type: ItemType.Expression,
                variableList: [
                    {
                        varname: 'z',
                    },
                ],
            },
        ])
        const expanded = uriTemplate.expand({
            x: 'X',
            z: 'Z',
        })
        assert.equal(expanded, 'XyZ')
    })

    it('should parse and expand a single literal', () => {
        const uriTemplate = UriTemplate.parse('x')
        assert.deepEqual(uriTemplate.problems, [])
        assert.deepEqual(uriTemplate.items, [
            {
                type: ItemType.Literal,
                value: 'x',
            },
        ])
        const expanded = uriTemplate.expand({})
        assert.equal(expanded, 'x')
    })

    it('should parse and expand a single expression', () => {
        const uriTemplate = UriTemplate.parse('{x}')
        assert.deepEqual(uriTemplate.problems, [])
        assert.deepEqual(uriTemplate.items, [
            {
                type: ItemType.Expression,
                variableList: [
                    {
                        varname: 'x',
                    },
                ],
            },
        ])
        const expanded = uriTemplate.expand({
            x: 'X',
        })
        assert.equal(expanded, 'X')
    })

    it('should parse and expand an expression with multiple variables', () => {
        const uriTemplate = UriTemplate.parse('{x,y}')
        assert.deepEqual(uriTemplate.problems, [])
        assert.deepEqual(uriTemplate.items, [
            {
                type: ItemType.Expression,
                variableList: [
                    {
                        varname: 'x',
                    },
                    {
                        varname: 'y',
                    },
                ],
            },
        ])
        const expanded = uriTemplate.expand({
            x: 'X',
            y: 'Y',
        })
        assert.equal(expanded, 'X,Y')
    })

    it('should parse and expand multiple expressions with multiple variables', () => {
        const uriTemplate = UriTemplate.parse('{x}{y,z}')
        assert.deepEqual(uriTemplate.problems, [])
        assert.deepEqual(uriTemplate.items, [
            {
                type: ItemType.Expression,
                variableList: [
                    {
                        varname: 'x',
                    },
                ],
            },
            {
                type: ItemType.Expression,
                variableList: [
                    {
                        varname: 'y',
                    },
                    {
                        varname: 'z',
                    },
                ],
            },
        ])
        const expanded = uriTemplate.expand({
            x: 'X',
            y: 'Y',
            z: 'Z',
        })
        assert.equal(expanded, 'XY,Z')
    })

    it('should parse and expand varnames with dots', () => {
        const uriTemplate = UriTemplate.parse('{x.y.z}')
        assert.deepEqual(uriTemplate.problems, [])
        assert.deepEqual(uriTemplate.items, [
            {
                type: ItemType.Expression,
                variableList: [
                    {
                        varname: 'x.y.z',
                    },
                ],
            },
        ])
        const expanded = uriTemplate.expand({
            'x.y.z': 'X.Y.Z',
        })
        assert.equal(expanded, 'X.Y.Z')
    })

    it('should parse and expand a varname with percent-encoded characters', () => {
        const uriTemplate = UriTemplate.parse('{%20}')
        assert.deepEqual(uriTemplate.problems, [])
        assert.deepEqual(uriTemplate.items, [
            {
                type: ItemType.Expression,
                variableList: [
                    {
                        varname: '%20',
                    },
                ],
            },
        ])
        const expanded = uriTemplate.expand({
            '%20': 'SPACE',
        })
        assert.equal(expanded, 'SPACE')
    })

    it('should expand a prefix modifier', () => {
        const uriTemplate = UriTemplate.parse('{x:2}')
        assert.deepEqual(uriTemplate.problems, [])
        assert.deepEqual(uriTemplate.items, [
            {
                type: ItemType.Expression,
                variableList: [
                    {
                        varname: 'x',
                        modifierLevel4: {
                            type: ModifierLevel4Type.Prefix,
                            size: 2,
                        },
                    },
                ],
            },
        ])
        const expanded = uriTemplate.expand({
            x: 'ABCD',
        })
        assert.equal(expanded, 'AB')
    })

    it('should parse and expand an empty expression as a literal', () => {
        const uriTemplate = UriTemplate.parse('{}')
        assert.deepEqual(uriTemplate.problems, [
            {
                start: 0,
                end: 2,
                type: ProblemType.Error,
            },
        ])
        assert.deepEqual(uriTemplate.items, [
            {
                type: ItemType.Literal,
                value: '{}',
            },
        ])
        const expanded = uriTemplate.expand({})
        assert.equal(expanded, '{}')
    })

    it('should parse and expand an invalid expression as a literal', () => {
        const uriTemplate = UriTemplate.parse('{x')
        assert.deepEqual(uriTemplate.problems, [
            {
                start: 0,
                end: 2,
                type: ProblemType.Error,
            },
        ])
        assert.deepEqual(uriTemplate.items, [
            {
                type: ItemType.Literal,
                value: '{x',
            },
        ])
        const expanded = uriTemplate.expand({})
        assert.equal(expanded, '{x')
    })

    it('should parse an invalid operator expression as a literal', () => {
        const uriTemplate = UriTemplate.parse('{!x}')
        assert.deepEqual(uriTemplate.problems, [
            {
                start: 0,
                end: 4,
                type: ProblemType.Error,
            },
        ])
        assert.deepEqual(uriTemplate.items, [
            {
                type: ItemType.Literal,
                value: '{!x}',
            },
        ])
    })

    it('should parse an invalid prefix modifier as a literal', () => {
        const uriTemplate = UriTemplate.parse('{x:1y}')
        assert.deepEqual(uriTemplate.problems, [
            {
                start: 1,
                end: 5,
                type: ProblemType.Error,
            },
        ])
        assert.deepEqual(uriTemplate.items, [
            {
                type: ItemType.Literal,
                value: '{x:1y}',
            },
        ])
    })

    it('should parse an invalid explode modifier as a literal', () => {
        const uriTemplate = UriTemplate.parse('{x*y}')
        assert.deepEqual(uriTemplate.problems, [
            {
                start: 1,
                end: 4,
                type: ProblemType.Error,
            },
        ])
        assert.deepEqual(uriTemplate.items, [
            {
                type: ItemType.Literal,
                value: '{x*y}',
            },
        ])
    })

    it('should parse a varspec with both a prefix modifier and explode modifier as a literal', () => {
        const uriTemplate = UriTemplate.parse('{x:1*}')
        assert.deepEqual(uriTemplate.problems, [
            {
                start: 1,
                end: 5,
                type: ProblemType.Error,
            },
        ])
        assert.deepEqual(uriTemplate.items, [
            {
                type: ItemType.Literal,
                value: '{x:1*}',
            },
        ])
    })

    it('should parse a varname with invalid percent-encoded characters as a literal ', () => {
        const uriTemplate = UriTemplate.parse('{%0}')
        assert.deepEqual(uriTemplate.problems, [
            {
                start: 0,
                end: 4,
                type: ProblemType.Error,
            },
        ])
        assert.deepEqual(uriTemplate.items, [
            {
                type: ItemType.Literal,
                value: '{%0}',
            },
        ])
    })

    it('should parse and expand an expression without an operator', () => {
        const uriTemplate = UriTemplate.parse('{x}')
        assert.deepEqual(uriTemplate.problems, [])
        assert.deepEqual(uriTemplate.items, [
            {
                type: ItemType.Expression,
                variableList: [
                    {
                        varname: 'x',
                    },
                ],
            },
        ])
        const expanded = uriTemplate.expand({
            x: 'A :B',
        })
        assert.equal(expanded, 'A%20%3AB')
    })

    it('should parse and expand a reserved operator expression', () => {
        const uriTemplate = UriTemplate.parse('{+x}')
        assert.deepEqual(uriTemplate.problems, [])
        assert.deepEqual(uriTemplate.items, [
            {
                type: ItemType.Expression,
                operator: Operator.Reserved,
                variableList: [
                    {
                        varname: 'x',
                    },
                ],
            },
        ])
        const expanded = uriTemplate.expand({
            x: 'A :B',
        })
        assert.equal(expanded, 'A%20:B')
    })

    it('should parse and expand a fragment operator expression', () => {
        const uriTemplate = UriTemplate.parse('{#x}')
        assert.deepEqual(uriTemplate.problems, [])
        assert.deepEqual(uriTemplate.items, [
            {
                type: ItemType.Expression,
                operator: Operator.Fragment,
                variableList: [
                    {
                        varname: 'x',
                    },
                ],
            },
        ])
        const expanded = uriTemplate.expand({
            x: 'A :B',
        })
        assert.equal(expanded, '#A%20:B')
    })

    it('should parse and expand a label operator expression', () => {
        const uriTemplate = UriTemplate.parse('{.x}')
        assert.deepEqual(uriTemplate.problems, [])
        assert.deepEqual(uriTemplate.items, [
            {
                type: ItemType.Expression,
                operator: Operator.Label,
                variableList: [
                    {
                        varname: 'x',
                    },
                ],
            },
        ])
        const expanded = uriTemplate.expand({
            x: 'A :B',
        })
        assert.equal(expanded, '.A%20%3AB')
    })

    it('should parse and expand a path segment operator expression', () => {
        const uriTemplate = UriTemplate.parse('{/x}')
        assert.deepEqual(uriTemplate.problems, [])
        assert.deepEqual(uriTemplate.items, [
            {
                type: ItemType.Expression,
                operator: Operator.PathSegment,
                variableList: [
                    {
                        varname: 'x',
                    },
                ],
            },
        ])
        const expanded = uriTemplate.expand({
            x: 'A :B',
        })
        assert.equal(expanded, '/A%20%3AB')
    })

    it('should parse and expand a path parameter operator expression', () => {
        const uriTemplate = UriTemplate.parse('{;x}')
        assert.deepEqual(uriTemplate.problems, [])
        assert.deepEqual(uriTemplate.items, [
            {
                type: ItemType.Expression,
                operator: Operator.PathParameter,
                variableList: [
                    {
                        varname: 'x',
                    },
                ],
            },
        ])
        const expanded = uriTemplate.expand({
            x: 'A :B',
        })
        assert.equal(expanded, ';x=A%20%3AB')
    })

    it('should parse and expand a form query operator expression', () => {
        const uriTemplate = UriTemplate.parse('{?x}')
        assert.deepEqual(uriTemplate.problems, [])
        assert.deepEqual(uriTemplate.items, [
            {
                type: ItemType.Expression,
                operator: Operator.FormQuery,
                variableList: [
                    {
                        varname: 'x',
                    },
                ],
            },
        ])
        const expanded = uriTemplate.expand({
            x: 'A :B',
        })
        assert.equal(expanded, '?x=A%20%3AB')
    })

    it('should parse and expand a form continuation operator expression', () => {
        const uriTemplate = UriTemplate.parse('{&x}')
        assert.deepEqual(uriTemplate.problems, [])
        assert.deepEqual(uriTemplate.items, [
            {
                type: ItemType.Expression,
                operator: Operator.FormContinuation,
                variableList: [
                    {
                        varname: 'x',
                    },
                ],
            },
        ])
        const expanded = uriTemplate.expand({
            x: 'A :B',
        })
        assert.equal(expanded, '&x=A%20%3AB')
    })

    describe('expand unnamed operator', () => {
        const uriTemplate = UriTemplate.parse('x{+y}z')

        it('should expand an unnamed operator with a primitive', () => {
            const expanded = uriTemplate.expand({
                y: 'Y',
            })
            assert.equal(expanded, 'xYz')
        })

        it('should expand an unnamed operator with an empty value', () => {
            const expanded = uriTemplate.expand({
                y: '',
            })
            assert.equal(expanded, 'xz')
        })

        it('should expand an unnamed operator with an undefined value', () => {
            const expanded = uriTemplate.expand({})
            assert.equal(expanded, 'xz')
        })

        it('should expand an unnamed operator with an array containing empty values', () => {
            const expanded = uriTemplate.expand({
                y: [ 'A', '', 'B' ],
            })
            assert.equal(expanded, 'xA,,Bz')
        })

        it('should expand an unnamed operator with an array containing undefined values', () => {
            const expanded = uriTemplate.expand({
                y: [ 'A', undefined, null, 'B' ],
            })
            assert.equal(expanded, 'xA,Bz')
        })

        it('should expand an unnamed operator with an array containing only undefined values', () => {
            const expanded = uriTemplate.expand({
                y: [ undefined, null ],
            })
            assert.equal(expanded, 'xz')
        })

        it('should expand an unnamed operator with an empty array', () => {
            const expanded = uriTemplate.expand({
                y: [],
            })
            assert.equal(expanded, 'xz')
        })

        it('should expand an unnamed operator with an object containing empty values', () => {
            const expanded = uriTemplate.expand({
                y: {
                   a: 'A',
                   b: '',
                   c: 'C',
                },
            })
            assert.equal(expanded, 'xa,A,b,,c,Cz')
        })

        it('should expand an unnamed operator with an object containing undefined values', () => {
            const expanded = uriTemplate.expand({
                y: {
                   a: 'A',
                   b: undefined,
                   c: null,
                   d: 'D',
                },
            })
            assert.equal(expanded, 'xa,A,d,Dz')
        })

        it('should expand an unnamed operator with an object containing only undefined values', () => {
            const expanded = uriTemplate.expand({
                y: {
                    a: undefined,
                    b: null,
                },
            })
            assert.equal(expanded, 'xz')
        })

        it('should expand an unnamed operator with an empty object', () => {
            const expanded = uriTemplate.expand({
                y: {},
            })
            assert.equal(expanded, 'xz')
        })
    })

    describe('expand named operator', () => {
        const uriTemplate = UriTemplate.parse('x{?y}')

        it('should expand a named operator with a primitive', () => {
            const expanded = uriTemplate.expand({
                y: 'Y',
            })
            assert.equal(expanded, 'x?y=Y')
        })

        it('should expand a named operator with an empty value', () => {
            const expanded = uriTemplate.expand({
                y: '',
            })
            assert.equal(expanded, 'x?y=')
        })

        it('should expand a named operator with an undefined value', () => {
            const expanded = uriTemplate.expand({
                y: undefined,
            })
            assert.equal(expanded, 'x')
        })

        it('should expand a named operator with an array containing empty values', () => {
            const expanded = uriTemplate.expand({
                y: [ 'A', '', 'B' ],
            })
            assert.equal(expanded, 'x?y=A,,B')
        })

        it('should expand a named operator with an array containing undefined values', () => {
            const expanded = uriTemplate.expand({
                y: [ 'A', undefined, null, 'B' ],
            })
            assert.equal(expanded, 'x?y=A,B')
        })

        it('should expand a named operator with an array containing only undefined values', () => {
            const expanded = uriTemplate.expand({
                y: [ undefined, null ],
            })
            assert.equal(expanded, 'x?y=')
        })

        it('should expand a named operator with an empty array', () => {
            const expanded = uriTemplate.expand({
                y: [],
            })
            assert.equal(expanded, 'x')
        })

        it('should expand an named operator with an object containing empty values', () => {
            const expanded = uriTemplate.expand({
                y: {
                   a: 'A',
                   b: '',
                   c: 'C',
                },
            })
            assert.equal(expanded, 'x?y=a,A,b,,c,C')
        })

        it('should expand an named operator with an object containing undefined values', () => {
            const expanded = uriTemplate.expand({
                y: {
                   a: 'A',
                   b: undefined,
                   c: null,
                   d: 'D',
                },
            })
            assert.equal(expanded, 'x?y=a,A,d,D')
        })

        it('should expand an named operator with an object containing only undefined values', () => {
            const expanded = uriTemplate.expand({
                y: {
                   a: undefined,
                   b: null,
                },
            })
            assert.equal(expanded, 'x')
        })

        it('should expand an named operator with an empty object', () => {
            const expanded = uriTemplate.expand({
                y: {},
            })
            assert.equal(expanded, 'x')
        })
    })

    describe('explode unnamed operator', () => {
        const uriTemplate = UriTemplate.parse('x{/y*}')

        it('should explode an unnamed operator with a primitive value', () => {
            const expanded = uriTemplate.expand({
                y: 'ABC',
            })
            assert.equal(expanded, 'x')
        })

        it('should explode an unnamed operator with an undefined value', () => {
            const expanded = uriTemplate.expand({})
            assert.equal(expanded, 'x')
        })

        it('should explode an unnamed operator with an array containing empty values', () => {
            const expanded = uriTemplate.expand({
                y: [ 'A', '', 'B' ],
            })
            assert.equal(expanded, 'x/A//B')
        })

        it('should explode an unnamed operator with an array containing undefined values', () => {
            const expanded = uriTemplate.expand({
                y: [ 'A', undefined, null, 'B' ],
            })
            assert.equal(expanded, 'x/A/B')
        })

        it('should explode an unnamed operator with an array containing only undefined values', () => {
            const expanded = uriTemplate.expand({
                y: [ undefined, null ],
            })
            assert.equal(expanded, 'x/')
        })

        it('should explode an unnamed operator with an empty array', () => {
            const expanded = uriTemplate.expand({
                y: [],
            })
            assert.equal(expanded, 'x')
        })

        it('should explode an unnamed operator with an object containing empty values', () => {
            const expanded = uriTemplate.expand({
                y: {
                   a: 'A',
                   b: '',
                   c: 'C',
                },
            })
            assert.equal(expanded, 'x/a=A/b=/c=C')
        })

        it('should explode an unnamed operator with an object containing undefined values', () => {
            const expanded = uriTemplate.expand({
                y: {
                   a: 'A',
                   b: undefined,
                   c: null,
                   d: 'D',
                },
            })
            assert.equal(expanded, 'x/a=A/d=D')
        })

        it('should explode an unnamed operator with an object containing only undefined values', () => {
            const expanded = uriTemplate.expand({
                y: {
                    a: undefined,
                    b: null,
                },
            })
            assert.equal(expanded, 'x')
        })

        it('should explode an unnamed operator with an empty object', () => {
            const expanded = uriTemplate.expand({
                y: {},
            })
            assert.equal(expanded, 'x')
        })
    })

    describe('explode named operator', () => {
        const uriTemplate = UriTemplate.parse('x{;y*}')

        it('should explode a named operator with a primitive value', () => {
            const expanded = uriTemplate.expand({
                y: 'ABC',
            })
            assert.equal(expanded, 'x')
        })

        it('should explode a named operator with an undefined value', () => {
            const expanded = uriTemplate.expand({})
            assert.equal(expanded, 'x')
        })

        it('should explode a named operator with an array containing empty values', () => {
            const expanded = uriTemplate.expand({
                y: [ 'A', '', 'B' ],
            })
            assert.equal(expanded, 'x;y=A;y;y=B')
        })

        it('should explode a named operator with an array containing undefined values', () => {
            const expanded = uriTemplate.expand({
                y: [ 'A', undefined, null, 'B' ],
            })
            assert.equal(expanded, 'x;y=A;y=B')
        })

        it('should explode a named operator with an array containing only undefined values', () => {
            const expanded = uriTemplate.expand({
                y: [ undefined, null ],
            })
            assert.equal(expanded, 'x;')
        })

        it('should explode a named operator with an empty array', () => {
            const expanded = uriTemplate.expand({
                y: [],
            })
            assert.equal(expanded, 'x')
        })

        it('should explode a named operator with an object containing empty values', () => {
            const expanded = uriTemplate.expand({
                y: {
                   a: 'A',
                   b: '',
                   c: 'C',
                },
            })
            assert.equal(expanded, 'x;a=A;b;c=C')
        })

        it('should explode a named operator with an object containing undefined values', () => {
            const expanded = uriTemplate.expand({
                y: {
                   a: 'A',
                   b: undefined,
                   c: null,
                   d: 'D',
                },
            })
            assert.equal(expanded, 'x;a=A;d=D')
        })

        it('should explode a named operator with an object containing only undefined values', () => {
            const expanded = uriTemplate.expand({
                y: {
                    a: undefined,
                    b: null,
                },
            })
            assert.equal(expanded, 'x')
        })

        it('should explode a named operator with an empty object', () => {
            const expanded = uriTemplate.expand({
                y: {},
            })
            assert.equal(expanded, 'x')
        })
    })

})
