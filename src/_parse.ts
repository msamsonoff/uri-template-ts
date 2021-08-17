import { Item, ItemType, ModifierLevel4Type, Operator, Problem, ProblemType, Varspec } from './types'

export const _indexOf = (s: string, searchString: string, start: number, end: number): number => {
    let i = s.indexOf(searchString, start)
    if (i >= end) {
        i = -1
    }
    return i
}

// Neither `RegExp` nor `String` have a simple and direct way to search or test
// a regular expression pattern starting from a given string offset. There is,
// however, a solution that (ab)uses the `RegExp`'s `global` and `sticky` flags
// and the `lastIndex` property.
//
// https://2ality.com/2020/01/regexp-lastindex.html

/*
export const _regExpIndexOf = (s: string, regExp: RegExp, start: number, end: number) => {
    if (!regExp.global && !regExp.sticky) {
        throw new Error('assertion failed: `regExp` must be global or sticky')
    } else {
        regExp.lastIndex = start
        let match = regExp.exec(s)
        if (null !== match && match.index >= end) {
            match = null
        }
        return match
    }
}
*/

export const _regExpTest = (s: string, regExp: RegExp, start: number): boolean => {
    if (!regExp.sticky) {
        throw new Error('assertion failed: `regExp` must be sticky')
    } else {
        regExp.lastIndex = start
        const match = regExp.test(s)
        return match
    }
}

export function* _split(s: string, separator: string, start: number, end: number): Generator<[ number, number ], void, unknown> {
    let i = start
    for (;;) {
        const j = _indexOf(s, separator, i, end)
        if (-1 === j) {
            yield [ i, end ]
            return
        } else {
            yield [ i, j ]
            i = j + 1
        }
    }
}

class ExpressionError extends Error {
    constructor() {
        super()
        Object.setPrototypeOf(this, ExpressionError.prototype)
    }
}

export const _parse = (template: string): { items: Item[], problems: Problem[] }  => {
    const items: Item[] = []
    const problems: Problem[] = []

    const pushProblem = (start: number, end: number, type: ProblemType) => {
        problems.push({
            start,
            end,
            type,
        })
    }

    const parseLiteral = (start: number, end?: number) => {
        const value = template.substring(start, end)
        items.push({
            type: ItemType.Literal,
            value,
        })
    }

    const parseOperator = (start: number) => {
        switch (template[start]) {
        case '+': return Operator.Reserved
        case '#': return Operator.Fragment
        case '.': return Operator.Label
        case '/': return Operator.PathSegment
        case ';': return Operator.PathParameter
        case '?': return Operator.FormQuery
        case '&': return Operator.FormContinuation
        default:  return undefined
        }
    }

    const parseVarname = (start: number, end: number) => {
        const varname = template.substring(start, end)
        return varname
    }

    const parseVariableList = (operator: undefined | Operator, start: number, end: number) => {
        const variableList: Varspec[] = []
        let error = false

        for (const [ i, j ] of _split(template, ',', start, end)) {
            const asterisk = _indexOf(template, '*', i, j)
            const colon = _indexOf(template, ':', i, j)
            if (-1 !== asterisk && -1 !== colon) {
                pushProblem(i, j, ProblemType.Error)
                error = true
            } else if (-1 !== asterisk) {
                if (j !== asterisk + 1) {
                    pushProblem(i, j, ProblemType.Error)
                    error = true
                } else {
                    variableList.push({
                        varname: parseVarname(i, asterisk),
                        modifierLevel4: {
                            type: ModifierLevel4Type.Explode,
                        },
                    })
                }
            } else if (-1 !== colon) {
                if (!_regExpTest(template, /[0-9]{1,4}[,}]/y, colon + 1)) {
                    pushProblem(i, j, ProblemType.Error)
                    error = true
                } else {
                    variableList.push({
                        varname: parseVarname(i, colon),
                        modifierLevel4: {
                            type: ModifierLevel4Type.Prefix,
                            size: parseInt(template.substring(colon + 1, j)),
                        },
                    })
                }
            } else {
                variableList.push({
                    varname: parseVarname(i, j),
                })
            }
        }

        if (error) {
            throw new ExpressionError()
        } else if (operator) {
            items.push({
                type: ItemType.Expression,
                operator,
                variableList,
            })
        } else {
            items.push({
                type: ItemType.Expression,
                variableList,
            })
        }
    }

    const parseExpression = (start: number, end: number) => {
        try {
            if (end - start <= 2) {
                pushProblem(start, end, ProblemType.Error)
                throw new ExpressionError()
            } else {
                const operator = parseOperator(start + 1)
                if (undefined !== operator) {
                    parseVariableList(operator, start + 2, end - 1)
                } else if (!_regExpTest(template, /[0-9A-Z_a-z]|%[0-9A-Fa-f]{2}/y, start + 1)) {
                    pushProblem(start, end, ProblemType.Error)
                    throw new ExpressionError()
                } else {
                    parseVariableList(operator, start + 1, end - 1)
                }
            }
        }
        catch (err) {
            /* istanbul ignore else */
            if (err instanceof ExpressionError) {
                parseLiteral(start, end)
            } else {
                throw err
            }
        }
    }

    let i = 0
    while (i < template.length) {
        const j = template.indexOf('{', i)
        if (-1 === j) {
            parseLiteral(i)
            break
        } else {
            if (i !== j) {
                parseLiteral(i, j)
            }
            const k = template.indexOf('}', j + 1)
            if (-1 === k) {
                parseLiteral(j)
                pushProblem(j, template.length, ProblemType.Error)
                break
            } else {
                parseExpression(j, k + 1)
                i = k + 1
            }
        }
    }

    return { items, problems }
}
