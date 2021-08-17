export type Span = {
    start: number,
    end: number,
}

export type Problem = Span & {
    readonly type: ProblemType,
}

export enum ProblemType {
    Error = 'Error',
    Warning = 'Warning',
}

export type Item = Literal | Expression

export enum ItemType {
    Literal = 'Literal',
    Expression = 'Expression',
}

export type Literal = {
    readonly type: ItemType.Literal,
    value: string,
}

export type Expression = {
    readonly type: ItemType.Expression,
    operator?: Operator,
    variableList: readonly Varspec[],
}

export enum Operator {
    Reserved = 'Reserved',
    Fragment = 'Fragment',
    Label = 'Label',
    PathSegment = 'PathSegment',
    PathParameter = 'PathParameter',
    FormQuery = 'FormQuery',
    FormContinuation = 'FormContinuation',
}

export type Varspec = {
    varname: string,
    modifierLevel4?: ModifierLevel4,
}

export type ModifierLevel4 = Prefix | Explode

export enum ModifierLevel4Type {
    Prefix = 'Prefix',
    Explode = 'Explode',
}

export type Prefix = {
    readonly type: ModifierLevel4Type.Prefix,
    size: number,
}

export type Explode = {
    readonly type: ModifierLevel4Type.Explode,
}

export type DefinedPrimitive = boolean | number | string

export type Primitive = undefined | null | DefinedPrimitive

export type PrimitiveArray = Primitive[]

export type PrimitiveObject = { [k: string]: Primitive }

export type Value = Primitive | PrimitiveArray | PrimitiveObject

export type Variables = { [k: string]: Value }
