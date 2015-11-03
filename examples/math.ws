(defn square [x] (* x x))

(defn make-point [x y] [x y])
(defn point-x [p] (p 0))
(defn point-y [p] (p 1))
(defn distance [p1, p2]
  (Math.sqrt (square (- (point-x p2) (point-x p1)))
             (square (- (point-y p2) (point-y p1)))))

(defn show [p] (str "[" (point-x p) ", " (point-y p) "]"))

(def a (make-point -1 2))
(def b (make-point 3 4))

(println (str "The distance between " (show a) " and " (show b)))
(println (str "is: " (distance a b)))

(deftype Point 
  "A 2d Cartesian point"
  [:x :y]
  {:distance (fn [p1 p2]
               (Math.sqrt (square (- (.-x p2) (.-x p1)))
                          (square (- (.-y p2) (.-y p1)))))
   :toString (fn [p]
                (str "[" (.-x p) ", " (.-y p) "]"))})

(def c (Point. -5 10))
(def d (Point. 20 -30))

(println (str "The distance between " c " and " d))
(println (str "is: " (.distance c d)))
