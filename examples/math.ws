(defn square [x] (* x x))

(defn makePoint [x y] [x y])
(defn pointX [p] (p 0))
(defn pointY [p] (p 1))
(defn distance [p1, p2]
  (Math.sqrt (square (- (pointX p2) (pointX p1)))
             (square (- (pointY p2) (pointY p1)))))

(defn show [p] (str "[" (pointX p) ", " (pointY p) "]"))

(def a (makePoint -1 2))
(def b (makePoint 3 4))

(println (str "The distance between " (show a) " and " (show b)))
(println (str "is: ", (distance a b)))

