(defn addDays
  [d n]
  (Date.
    (.getUTCFullYear d)
    (.getUTCMonth d)
    (+ (.getUTCDate d) n)
    (.getUTCHours d)
    (.getUTCMinutes d)
    (.getUTCSeconds d)
    (.getUTCMilliseconds d)))

(defn prevDay [d] (addDays d 1))

(defn addMonths
  [d n]
  (Date.
    (.getUTCFullYear d)
    (+ (.getUTCMonth d) n)
    (.getUTCDate d)
    (.getUTCHours d)
    (.getUTCMinutes d)
    (.getUTCSeconds d)
    (.getUTCMilliseconds d)))

(defn monthFirstDay
  [d] (Date. (.getUTCFullYear d) (.getUTCMonth d) 1))

(defn monthLastDay
  [d]
  (let [t (Date. (.getUTCFullYear d) (.getUTCMonth d) 31)]
    (until (=== (.getUTCMonth d) (.getUTCMonth t))
      (set! t (prevDay t))
      t))) 

(defn toDate
  [d]
  (Date.
    (.getUTCFullYear d)
    (.getUTCMonth d)
    (.getUTCDate d)
    0
    0
    0
    0))

(defn diff [d1 d2]
  (- (.valueOf d1) (.valueOf d2)))

(defn diffDays [d1 d2]
  (/ (diff (toDate d1) (toDate d2))) 86400000)

(deftype Offset
  [:offset]
  {:zero (fn [offset] 0)
   :ident (fn [offset] offset)
   :prev (fn [offset] (- offset 1))
   :next (fn [offset] (+ offset 1))})

(defprotocol IView
  {:unit :required
   :measure :required
   :ref (fn [view] (addDays (today), (.measure view)))
   :displacement :required
   :window (fn [view]
             (let [unit (.unit view)
                   offset (.-offset view)
                   dw (.displacement view)
                   start (- (* offset unit) dw)
                   end (- (- (+ (* offset unit) unit) dw) 1)]
                (range start end)))})

(deftype Day
  [:offset]
  IView
  {:unit (fn [view] 1)
   :measure (fn [view] (.-offset view))
   :displacement (fn [view] 1)})

(deftype Week
  [:offset]
  IView
  {:unit (fn [view] 7)
   :measure (fn [view]
              (let [day (if (=== offset 0) 0 (.displacement view))]
                (- (* (.-offset view) (.unit view)) day)))
   :displacement (fn [view] (.getUTCDay (Date.)))})

(deftype Recent
  [:offset]
  IView
  {:unit (fn [view] 5)
   :measure (fn [view] 5)
   :displacement (fn [view] 0)
   :window (fn [view] (range -1 3))})

(deftype Month
  [:offset]
  IView
  {:unit (fn [view]
           (let [ref (addMonths (Date.) (.-offset view))]
             (diffDays (monthLastDay ref) (prevDay (monthFirstDay ref)))))
   :measure (fn [view]
              (let [offset (.-offset view)]
                (cond (=== offset 0) (.unit view 0)
                      (< offset 0)
                        (-
                          (reduce
                            (map (range offset 1)
                                 (fn [offset] (.unit view offset)))
                            (fn [sum, u] (- sum u)))
                          (.displacement view))
                      (< offset 1)
                        (- 
                          (reduce
                            (map (range 1 offset)
                                 (fn [offset] (.unit view offset)))
                            (fn [sum, u] (+ sum u)))
                          (.displacement view)))))
   :displacement (fn [view] (.getUTCDate (Date.)))})

(println (monthLastDay (Date.)))

(each (range -2 3) (fn [n]
  (println (.window (Month. n)))))
  
