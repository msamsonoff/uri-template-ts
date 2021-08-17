import { strict as assert } from 'assert'

import { UriTemplate } from '../src/uri-template'

describe('RFC6570 Examples', () => {

    const variables = {
         count: [
             'one',
             'two',
             'three',
         ],
         dom: [
             'example',
             'com',
         ],
         dub: 'me/too',
         hello: 'Hello World!',
         half: '50%',
         var: 'value',
         who: 'fred',
         base: 'http://example.com/home/',
         path: '/foo/bar',
         list: [
             'red',
             'green',
             'blue',
         ],
         keys: {
             semi: ';',
             dot: '.',
             comma: ',',
         },
         v: '6',
         x: '1024',
         y: '768',
         empty: '',
         empty_keys: [],
         undef: null,
    }

    const test = (template: string, expected: string) => {
        const uriTemplate = UriTemplate.parse(template)
        const actual = uriTemplate.expand(variables)
        assert.equal(actual, expected)
    }

    it('3.2.2. Simple String Expansion', () => {
        test('{var}', 'value')
        test('{hello}', 'Hello%20World%21')
        test('{half}', '50%25')
        test('O{empty}X', 'OX')
        test('O{undef}X', 'OX')
        test('{x,y}', '1024,768')
        test('{x,hello,y}', '1024,Hello%20World%21,768')
        test('?{x,empty}', '?1024,')
        test('?{x,undef}', '?1024')
        test('?{undef,y}', '?768')
        test('{var:3}', 'val')
        test('{var:30}', 'value')
        test('{list}', 'red,green,blue')
        test('{list*}', 'red,green,blue')
        test('{keys}', 'semi,%3B,dot,.,comma,%2C')
        test('{keys*}', 'semi=%3B,dot=.,comma=%2C')
    })

    it('3.2.3. Reserved Expansion', () => {
        test('{+var}', 'value')
        test('{+hello}', 'Hello%20World!')
        test('{+half}', '50%25')
        test('{base}index', 'http%3A%2F%2Fexample.com%2Fhome%2Findex')
        test('{+base}index', 'http://example.com/home/index')
        test('O{+empty}X', 'OX')
        test('O{+undef}X', 'OX')
        test('{+path}/here', '/foo/bar/here')
        test('here?ref={+path}', 'here?ref=/foo/bar')
        test('up{+path}{var}/here', 'up/foo/barvalue/here')
        test('{+x,hello,y}', '1024,Hello%20World!,768')
        test('{+path,x}/here', '/foo/bar,1024/here')
        test('{+path:6}/here', '/foo/b/here')
        test('{+list}', 'red,green,blue')
        test('{+list*}', 'red,green,blue')
        test('{+keys}', 'semi,;,dot,.,comma,,')
        test('{+keys*}', 'semi=;,dot=.,comma=,')
    })

    it('3.2.4. Fragment Expansion', () => {
        test('{#var}', '#value')
        test('{#hello}', '#Hello%20World!')
        test('{#half}', '#50%25')
        test('foo{#empty}', 'foo#')
        test('foo{#undef}', 'foo')
        test('{#x,hello,y}', '#1024,Hello%20World!,768')
        test('{#path,x}/here', '#/foo/bar,1024/here')
        test('{#path:6}/here', '#/foo/b/here')
        test('{#list}', '#red,green,blue')
        test('{#list*}', '#red,green,blue')
        test('{#keys}', '#semi,;,dot,.,comma,,')
        test('{#keys*}', '#semi=;,dot=.,comma=,')
    })

    it('3.2.5. Label Expansion with Dot-Prefix', () => {
        test('{.who}', '.fred')
        test('{.who,who}', '.fred.fred')
        test('{.half,who}', '.50%25.fred')
        test('www{.dom*}', 'www.example.com')
        test('X{.var}', 'X.value')
        test('X{.empty}', 'X.')
        test('X{.undef}', 'X')
        test('X{.var:3}', 'X.val')
        test('X{.list}', 'X.red,green,blue')
        test('X{.list*}', 'X.red.green.blue')
        test('X{.keys}', 'X.semi,%3B,dot,.,comma,%2C')
        test('X{.keys*}', 'X.semi=%3B.dot=..comma=%2C')
        test('X{.empty_keys}', 'X')
        test('X{.empty_keys*}', 'X')
    })

    it('3.2.6. Path Segment Expansion', () => {
       test('{/who}', '/fred')
       test('{/who,who}', '/fred/fred')
       test('{/half,who}', '/50%25/fred')
       test('{/who,dub}', '/fred/me%2Ftoo')
       test('{/var}', '/value')
       test('{/var,empty}', '/value/')
       test('{/var,undef}', '/value')
       test('{/var,x}/here', '/value/1024/here')
       test('{/var:1,var}', '/v/value')
       test('{/list}', '/red,green,blue')
       test('{/list*}', '/red/green/blue')
       test('{/list*,path:4}', '/red/green/blue/%2Ffoo')
       test('{/keys}', '/semi,%3B,dot,.,comma,%2C')
       test('{/keys*}', '/semi=%3B/dot=./comma=%2C')
    })

    it('3.2.7. Path Parameter Expansion', () => {
       test('{;who}', ';who=fred')
       test('{;half}', ';half=50%25')
       test('{;empty}', ';empty')
       test('{;v,empty,who}', ';v=6;empty;who=fred')
       test('{;v,bar,who}', ';v=6;who=fred')
       test('{;x,y}', ';x=1024;y=768')
       test('{;x,y,empty}', ';x=1024;y=768;empty')
       test('{;x,y,undef}', ';x=1024;y=768')
       test('{;hello:5}', ';hello=Hello')
       test('{;list}', ';list=red,green,blue')
       test('{;list*}', ';list=red;list=green;list=blue')
       test('{;keys}', ';keys=semi,%3B,dot,.,comma,%2C')
       test('{;keys*}', ';semi=%3B;dot=.;comma=%2C')
    })

    it('3.2.8. Form-Style Query Expansion', () => {
       test('{?who}', '?who=fred')
       test('{?half}', '?half=50%25')
       test('{?x,y}', '?x=1024&y=768')
       test('{?x,y,empty}', '?x=1024&y=768&empty=')
       test('{?x,y,undef}', '?x=1024&y=768')
       test('{?var:3}', '?var=val')
       test('{?list}', '?list=red,green,blue')
       test('{?list*}', '?list=red&list=green&list=blue')
       test('{?keys}', '?keys=semi,%3B,dot,.,comma,%2C')
       test('{?keys*}', '?semi=%3B&dot=.&comma=%2C')
    })

    it('3.2.9. Form-Style Query Continuation', () => {
       test('{&who}', '&who=fred')
       test('{&half}', '&half=50%25')
       test('?fixed=yes{&x}', '?fixed=yes&x=1024')
       test('{&x,y,empty}', '&x=1024&y=768&empty=')
       test('{&x,y,undef}', '&x=1024&y=768')
       test('{&var:3}', '&var=val')
       test('{&list}', '&list=red,green,blue')
       test('{&list*}', '&list=red&list=green&list=blue')
       test('{&keys}', '&keys=semi,%3B,dot,.,comma,%2C')
       test('{&keys*}', '&semi=%3B&dot=.&comma=%2C')
    })

})
