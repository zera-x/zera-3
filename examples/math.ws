(comment
  A port of this: https://gist.github.com/delonnewman/14d5f4b37247caf2634e)

(defprotocol Expression
  {:+ (fn [a b] (Sum. a b))
   :- (fn [a b] (Difference. a b))
   :* (fn [a b] (Product. a b))
   :/ (fn [a b] (Quotient. a b))
   :** (fn [a b] (Exponentiation. a b))})
