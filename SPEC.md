WonderScript
============

A code-as-data language with a (subset of) JavaScript semantics, emphasizing it's functional aspects.

Data Types
==========

- Primitive (IPrimitive)
   - Undefined
   - Null
   - Boolean
   - Number
   - String
   - Symbol

- Booleans (IBoolean)
  - Boolean
  - Null
  - Undefined
  - String
  - Number
  - Object

- Numeric (INumeric)
  - Number
  - Rat

- Functions (IFunction)
  - Object
  - Map
  - Function
  - Array

- Extension Types
  - Date
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

- Collections (ICollection)
  - String
  - Array
  - Object
  - Map
  - Set
  - Function

Special Forms
=============

Definitions
-----------

    (var NAME EXP)

    (const NAME EXP)

Quotation
---------

    (quote EXPRESSION)

Conditionals
------------

    (if P1 C1 P2 C2 ... PN CN else ALT)

or

    (if P1 C1 P2 C2 ... PN CN)

where P1-PN are predicate expressions, C1-CN corresponding consequential expressions, and ALT is the default or alternate expression.

Functions
---------

    (function ARGS BODY)

or

    (function NAME ARGS BODY)

or (a macro)

    (fn ARGS BODY)

    (fn ARITY1 BODY1
        ARITY2 BODY2
        ...
        ARITYN BODYN)


Function Application
--------------------

    (NAME)

or

    ((function ARGUMENTS BODY))


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


Object Instantiation
--------------------

    (new CONSTRUCTOR ARG1 ARG2 ... ARGN)


Object Method Call
------------------

    (. OBJECT METHOD)


Object Property Access
----------------------

    (.- OBJECT PROPERTY)


Operators
---------

    ? // existential
    ! //
