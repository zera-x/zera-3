WonderScript
============

A code-as-data language, that provides a light abstraction over JavaScript symatics, emphasising it's functional aspects.

Data Types
==========

- Primitive (IPrimitive)
   - Undefined
   - Null
   - Boolean
   - Number
   - String
   - Symbol

- Numeric (INumeric)
  - Number
  - Rat
  - Nat?
  - Int?

- Functions (IFunction)
  - Object
  - Map
  - Function
  - Array
  - Vector

- Extention Types
  - Date
  - Time (time only)
  - Day (date only)
  - Instant (time and date)
  - RegExp

- Objects (IObject)
  - Object
  - String
  - Array
  - Map
  - Function
  - Symbol
  - Rat
  - Date
  - RegExp

- Reference Types (IRef)
  - Atom
  - Ref
  - Var
  - Promise

- Abstract Data Types
  - Type
  - Record

- Collections (ICollection)
  - String
  - Array
  - Object
  - Map
  - Set
  - Function

- Stringlike (IStringlike)
  - String
  - Numeral?
  - Keyword
  - Symbol

- Symbolic (ISymbolic)
  - Symbol
  - Keyword
  - Null
  - Undefined
  - Boolean

IPrimitive
----------

### Methods

#### `type?, typeOf`

#### `type`

INumeric
--------

### Methods

#### `add, +`

#### `sub, -`

#### `mult, *`

#### `div, /`

#### `toInt, ->Int`

#### `toNat, ->Nat`

#### `toRat, ->Rat`

#### `toNumber, ->Number` (required)

#### `toNumeral, ->Numeral, toString, ->String`

IFunction
---------

### Attributes

#### `arities`

#### `doc`

### Methods

#### `apply` (required)

#### `call`

#### `compose`

#### `memoize`

#### `bind`

#### `methodize`

IObject
-------

### Attributes

#### `attributes`

#### `properties`

#### `constructor`

#### `prototype`

#### `class`

### Methods

#### `send`

#### `methods`

#### `isa?, isa`

#### `instance?, instanceOf`

#### `emit`

#### `valueOf`

#### `hashCode`

#### `toString, ->String`

IRef
----

### Methods

#### `deref`


ICollection
-----------

### Methods

#### `map`

#### `reduce, reduceLeft`

#### `reduceRight`

#### `filter`

#### `concat`

#### `mapcat`

#### `count`

#### `pair`

#### `any`

#### `all`

...More, much more

IStringlike
-----------

ISymbolic
---------

Special Forms
=============

Definitions
-----------

    (def NAME [EXPRESSION]) => "NAMESPACE[NAME] = [EXPRESSION]|undefined;"

names go to the currently scoped namespace determined by `use`.

    (def- NAME [EXPRESSION]) => "var NAME = [EXPRESSION];"

private names within functions, modules, lexical scopes, etc.

Modules & Namespaces
--------------------

    (use NAMESPACE)

    (require [MODULE :a ALIAS] ...)

Quotation
---------

    (quote EXPRESSION)

Conditionals
------------

    (cond P1 C1 P2 C2 ... PN CN else ALT)

or

    (if P1 C1 P2 C2 ... PN CN)

where P1-PN are predicate expressions, C1-CN corresponding consequtial expressions, and ALT is the default or alternate expression.

Functions
---------

    (fn ARGUMENTS BODY)

or

    (fn ARITY1 BODY1
        ARITY2 BODY2
        ...
        ARITYN BODYN)

Function Application
--------------------

    (NAME)

or

    ((fn ARGUMENTS BODY))

where `fn` is any object that implements an `apply` method.


Lexical Scope
-------------

    (do EXPRESSION1...EXPRESSION2)


Lexical Scope Binding
---------------------

    (let [NAME1 EXPRESSION1 NAME2 EXPRESSION2 ... NAMEN EXPRESSIONN]
      EXPRESSION1
      EXPRESSION2
      ...
      EXPRESSIONN)


Recursion
---------

    (loop [NAME1 EXPRESSION1
           NAME2 EXPRESSION2
           ...
           NAMEN EXPRESSIONN]
      EXPRESSION1
      EXPRESSION2
      ...
      EXPRESSIONN)


    (again EPRESSION1 EXPRESSION2 ... EXPRESSIONN)


See
`loop` & `recur` - http://clojure.org/special_forms
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Loops_and_iteration


Exceptions
----------

    (throw EXPRESSION)

    (try
      EXPRESSION1
      EXPRESSION2
      ...
      EXPRESSIONN
      (catch EXPRESSION
        EXPRESSION1
        EXPRESSION2
        ...
        EXPRESSIONN))

or

    (try
      EXPRESSION1
      EXPRESSION2
      ...
      EXPRESSIONN
      (catch EXPRESSION
        EXPRESSION1
        EXPRESSION2
        ...
        EXPRESSIONN)
      (finally
       EXPRESSION1
       EXPRESSION2
       ...
       EXPRESSIONN))


Assignment
----------

    (set! NAME EXPRESSION)

    (.-set! OBJECT NAME EXPRESSION)


Object Instantiation
--------------------

    (new CONSTRUCTOR ARG1 ARG2 ... ARGN)

    (CONSTRUCTOR. ARG1 ARG2 ... ARGN)


Object Method Call
------------------

    (. OBJECT METHOD ARGS*)

    (.METHOD OBJECT ARGS*)

    (METHOD OBJECT ARGS*)

    (OBJECT METHOD ARGS)

    (send OBJECT METHOD ARGS)


Object Property Access
----------------------

    (.- OBJECT PROPERTY)

    (.-PROPERTY OBJECT)

    (-PROPERTY OBJECT)

Macros
------

    (define-syntax DISPATCH FUNCTION)

    (defmacro FORM_ARGS BODY)

###Some core macros include:

#### `if`

    (if PRED CONSEQUENT [ALTERNATE])

expands to

    (cond PRED CONSEQUENT [else ALTERNATE])

#### `defn`
  
Named functions

    (defn square [x] (* x x))

expands to

    (.-set! CURRENT_NAMESPACE square (fn [x] (* x x)))

#### `defn-`

Privately named functions

    (defn- square [x] (* x x))

expands to

    (def square (fn [x] (* x x)))

#### `defmacro`

Shortened form for defining macros

    (defmacro on [form] (quote true))

expands to

    (define-syntax on (fn [form] (quote true)))

#### `.?`

Null-safe method calling

    (.? OBJECT METHOD ARGS*)

expands to

    (if (? (.- OBJECT METHOD)) (. OBJECT METHOD ARGS*) (object))

#### `..`

Method chaining

    (.. ($ document)
        (.find ".tester")
        (.fadeIn))

expands to

    (. (. ($ document) find ".tester") fadeIn)

#### `..?`

Null-safe method chaining

    (..? (User.find 1)
         (.authenticate)
         (.getToken))

expands to

    (let [obj2
      (let [obj1 (User.find 1)]
        (if (? (.- obj1 authenticate))
            (. obj1 authenticate)
            (object)))]
      (if (? (.- obj2 getToken))
          (. obj2 getToken)
          (object)))
         
#### `..-`

Property chaining

    ..-

The same as method chaining, but accesses properties, doesn't chain methods

#### `..-?`

Null-safe property chaining

    ..-?

The same as null-safe method chaining, but accesses properties, doesn't chain methods

#### `->, ->>`

Threading or pipelininig forms

    ->, ->>



Operators
---------

    ? // exitential
