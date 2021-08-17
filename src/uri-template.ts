import { _expand } from './_expand'
import { _parse } from './_parse'
import { Item, Problem, Variables } from './types'

export class UriTemplate {
    readonly items: readonly Item[]
    readonly problems: readonly Problem[]

    constructor(items: Item[], problems: Problem[]) {
        this.items = items
        this.problems = problems
    }

    static parse(template: string): UriTemplate {
        const { items, problems } = _parse(template)
        const uriTemplate = new UriTemplate(items, problems)
        return uriTemplate
    }

    expand(variables: Variables): string {
        const s = _expand(this.items, variables)
        return s
    }
}
