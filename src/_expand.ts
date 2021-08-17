import {
    DefinedPrimitive,
    Expression,
    Item,
    ItemType,
    Literal,
    ModifierLevel4Type,
    Operator,
    PrimitiveArray,
    PrimitiveObject,
    Value,
    Variables,
    Varspec,
} from './types'

type _Allow = (s: string) => string

type _OperatorTable = {
    first: string,
    sep: string,
    named: boolean,
    ifemp: string,
    allow: _Allow,
}

export const _isDefinedArray = (value: PrimitiveArray): boolean => (value.length > 0)

export const _isDefinedObject = (value: PrimitiveObject): boolean => (
    Object.values(value)
        .some(v => 'undefined' !== typeof v && null !== v)
)

// See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent#description
export const _allowUnreserved = (s: string): string => (
    s.split(/(%[0-9A-Za-z]{2})/g)
        .map(uriComponent => {
            if (!/(%[0-9A-Za-z]{2})/g.test(uriComponent)) {
                uriComponent = encodeURIComponent(uriComponent)
                    .replace(/[!*'()]/g, c => (
                        `%${c.charCodeAt(0).toString(16).toUpperCase()}`
                    ))
            }
            return uriComponent
        })
        .join('')
)

// See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURI#examples
export const _allowUnreservedReserved = (uri: string): string => (
    encodeURI(uri)
        .replace(/%5B/g, '[')
        .replace(/%5D/g, ']')
)

const _getOperatorTable = (operator: undefined | Operator) => {
    switch (operator) {
    case Operator.Reserved:
        return {
            first: '',
            sep: ',',
            named: false,
            ifemp: '',
            allow: _allowUnreservedReserved,
        }
    case Operator.Fragment:
        return {
            first: '#',
            sep: ',',
            named: false,
            ifemp: '',
            allow: _allowUnreservedReserved,
        }
    case Operator.Label:
        return {
            first: '.',
            sep: '.',
            named: false,
            ifemp: '',
            allow: _allowUnreserved,
        }
    case Operator.PathSegment:
        return {
            first: '/',
            sep: '/',
            named: false,
            ifemp: '',
            allow: _allowUnreserved,
        }
    case Operator.PathParameter:
        return {
            first: ';',
            sep: ';',
            named: true,
            ifemp: '',
            allow: _allowUnreserved,
        }
    case Operator.FormQuery:
        return {
            first: '?',
            sep: '&',
            named: true,
            ifemp: '=',
            allow: _allowUnreserved,
        }
    case Operator.FormContinuation:
        return {
            first: '&',
            sep: '&',
            named: true,
            ifemp: '=',
            allow: _allowUnreserved,
        }
    case undefined:
        return {
            first: '',
            sep: ',',
            named: false,
            ifemp: '',
            allow: _allowUnreserved,
        }
    }
}

export const _expand = (items: readonly Item[], variables: Variables): string => {
    const strings: string[] = []

    const expandLiteral = (literal: Literal) => {
        strings.push(literal.value)
    }

    const makePushSep = (first: string, sep: string) => {
        let s = first
        const pushSep = () => {
            strings.push(s)
            s = sep
        }
        return pushSep
    }

    const pushName = (operatorTable: _OperatorTable, varspec: Varspec, empty: boolean) => {
        const { named, ifemp } = operatorTable
        if (named) {
            strings.push(_allowUnreserved(varspec.varname))
            if (empty) {
                strings.push(ifemp)
            } else {
                strings.push('=')
            }
        }
    }

    const expandArray = (allow: _Allow, pushSep: () => void, value: PrimitiveArray) => {
        for (const v of value) {
            if (undefined !== v && null !== v) {
                pushSep()
                strings.push(allow(v.toString()))
            }
        }
    }

    const expandObject = (allow: _Allow, pushSep: () => void, kvSep: string, value: PrimitiveObject) => {
        for (const [ k, v ] of Object.entries(value)) {
            if (undefined !== v && null !== v) {
                pushSep()
                strings.push(allow(k))
                strings.push(kvSep)
                strings.push(allow(v.toString()))
            }
        }
    }

    const expandVarspecPrimitive = (operatorTable: _OperatorTable, varspec: Varspec, value: DefinedPrimitive) => {
        value = value.toString()
        const empty = '' === value
        pushName(operatorTable, varspec, empty)
        const { allow } = operatorTable
        if (!empty) {
            if (ModifierLevel4Type.Prefix === varspec.modifierLevel4?.type) {
                value = value.substring(0, varspec.modifierLevel4.size)
            }
            strings.push(allow(value))
        }
    }

    const expandVarspecArray = (operatorTable: _OperatorTable, varspec: Varspec, value: PrimitiveArray) => {
        pushName(operatorTable, varspec, false)
        const { allow } = operatorTable
        const pushSep = makePushSep('', ',')
        expandArray(allow, pushSep, value)
    }

    const expandVarspecObject = (operatorTable: _OperatorTable, varspec: Varspec, value: PrimitiveObject) => {
        pushName(operatorTable, varspec, false)
        const { allow } = operatorTable
        const pushSep = makePushSep('', ',')
        expandObject(allow, pushSep, ',', value)
    }

    const expandVarspec = (operatorTable: _OperatorTable, pushSep: () => void, varspec: Varspec, value: Value) => {
        if ('undefined' !== typeof value && null !== value) {
            if ('boolean' === typeof value || 'number' === typeof value || 'string' === typeof value) {
                pushSep()
                expandVarspecPrimitive(operatorTable, varspec, value)
            } else if (Array.isArray(value)) {
                if (_isDefinedArray(value)) {
                    pushSep()
                    expandVarspecArray(operatorTable, varspec, value)
                }
            } else {
                if (_isDefinedObject(value)) {
                    pushSep()
                    expandVarspecObject(operatorTable, varspec, value)
                }
            }
        }
    }

    const explodeVarspec = (operatorTable: _OperatorTable, pushSep: () => void, varspec: Varspec, value: Value) => {
        if ('undefined' !== typeof value && null !== value) {
            if (Array.isArray(value)) {
                if (_isDefinedArray(value)) {
                    pushSep()
                    explodeVarspecArray(operatorTable, varspec, value)
                }
            } else if ('object' === typeof value) {
                if (_isDefinedObject(value)) {
                    pushSep()
                    explodeVarspecObject(operatorTable, value)
                }
            }
        }
    }

    const explodeVarspecArray = (operatorTable: _OperatorTable, varspec: Varspec, value: PrimitiveArray) => {
        const { named, ifemp, allow } = operatorTable
        const pushSep = makePushSep('', operatorTable.sep)
        if (!named) {
            expandArray(allow, pushSep, value)
        } else {
            for (let v of value) {
                if ('undefined' !== typeof v && null !== v) {
                    pushSep()
                    strings.push(_allowUnreserved(varspec.varname))
                    v = v.toString()
                    if ('' === v) {
                        strings.push(ifemp)
                    } else {
                        strings.push('=')
                        strings.push(allow(v))
                    }
                }
            }
        }
    }

    const explodeVarspecObject = (operatorTable: _OperatorTable, value: PrimitiveObject) => {
        const { named, ifemp, allow } = operatorTable
        const pushSep = makePushSep('', operatorTable.sep)
        if (!named) {
            expandObject(allow, pushSep, '=', value)
        } else {
            for (let [ k, v ] of Object.entries(value)) { // eslint-disable-line prefer-const
                if ('undefined' !== typeof v && null !== v) {
                    pushSep()
                    strings.push(_allowUnreserved(k))
                    v = v.toString()
                    if ('' === v) {
                        strings.push(ifemp)
                    } else {
                        strings.push('=')
                        strings.push(allow(v))
                    }
                }
            }
        }
    }

    const expandExpression = (expression: Expression) => {
        const operatorTable = _getOperatorTable(expression.operator)
        const pushSep = makePushSep(operatorTable.first, operatorTable.sep)
        for (const varspec of expression.variableList) {
            const value = variables[varspec.varname]
            if (ModifierLevel4Type.Explode !== varspec.modifierLevel4?.type) {
                expandVarspec(operatorTable, pushSep, varspec, value)
            } else {
                explodeVarspec(operatorTable, pushSep, varspec, value)
            }
        }
    }

    for (const item of items) {
        switch (item.type) {
        case ItemType.Literal:
            expandLiteral(item)
            break
        case ItemType.Expression:
            expandExpression(item)
            break
        }
    }

    const s = strings.join('')
    return s
}
