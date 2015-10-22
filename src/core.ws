;(module wonderscript.core
  ; some predicates
  (def object?
    (fn [val] (=== "object" (type val))))

  (def primitive?
    (fn [val] (!== "object" (type val))))

  (def string?
    (fn [val] (=== "string" (type val))))

  (def boolean?
    (fn [val] (=== "boolean" (type val))))

  (def undefined?
    (fn [val] (=== "undefined" (type val))))

  (def null?
    (fn [val] (=== "undefined" (type val))))

  (def ?
    (fn [val] (== val nil)))

  (def matches?
    (fn [regex string]
      (. regex test string)))

  (def parse
    (fn [regex string]
      (. regex exec string)))

  (def replace
    (fn [string pattern replacement]
      (. string replace pattern replacement)))

  (def count
    (fn [col] (.- col length)))

  (def toArray
    (fn [] []
        [val]
          (if (? (.- col length))
              (Array.prototype.slice val)
              [val])))

  (def toString
    (fn [val] (+ "" val)))

  (def concat
    (fn [&args] (Array.prototype.concat (args 0), (.slice args 1 (count args)))))

;  (def emit
;    (fn [form]
;      (cond (string? form)
;            (cond (matches? #"^(:|'|`)" form) (JSON.stringify (replace form #"^(:|'|`)" ""))
;                  (matches? #"^\".*\"$" form) form
;                  ; TODO: implement 'or'
;                  (or (=== "on" form) (=== "yes" form) (=== "true" form)) "true"
;                  (or (=== "off" form) (=== "no" form) (=== "false" form)) "false"
;                  ; fractions
;                  (matches? #"^\d+\/\d+$" form) 
;                    ; TODO: implement 'let'
;                    (do
;                      (def res (parse #"^(\d+)\/(\d+)$" form))
;                      (new Rat (parseInt (res 1)) (parseInt (res 2))))
;                  (matches? #"^([\d\.]+)%$" form)
;                    (do
;                      (def res (parse #"^([\d\.]+)%$" form))
;                      (new Rat (parseInt (res 1)) 100))
;                  (? (. wonderscript form)) (str "wonderscript['", form, "']")
;                  else form
;            (boolean? form) form
;            (null? form) "null"
;            (undefined? form) "undefined"
;            (instance? form Date) (str "new Date(", (. form valueOf), ")") 
;            (instance? form RegExp)
;              (do
;                (def flags [])
;                (if (.- form ignoreCase) (. flags push "i"))
;                (if (.- form global) (. flags push "g"))
;                (if (.- form muliline) (. flags push "m"))
;                (str "/", (.- form source), "/", (. flags join)))
;            (instance? form Array)
;              (do
;                (def f (form 0))
;                (cond (=== "if" f) ; emit if
;                      (=== "cond" f) ; emit cond
;                      (=== "instance?" f) (str (emit f), " instanceOf ", (emit (form 2)))
;                      else ...))))


;)
