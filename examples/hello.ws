(defn greet [nm]
  (println (str "Hello, " nm "!")))

(each ["Peter" "Paul" "Mary"]
 (fn [nm]
  (greet nm)))
