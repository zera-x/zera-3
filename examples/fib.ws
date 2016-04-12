(def fib
  (memoize
    (fn [n]
      (cond (=== n 0) 0
            (=== n 1) 1
            :else (+ (fib (- n 1)) (fib (- n 2)))))))

(let [fibs (map (range 20) fib)
      pairs (pair fibs)
      ratios (reduce pairs (fn [memo xs] (.concat memo (apply div (.reverse xs)))) [])]
  (each ratios (fn [ratio]
    (do
      (println (str ratio))
      (println (.toNumber ratio))))))
